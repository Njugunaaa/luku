import { useAuth } from "@/_core/hooks/useAuth";
import { OrdersTable, OrderDetailModal } from "@/components/admin/AdminOrderViews";
import { InventoryManager, ManualOrderForm } from "@/components/admin/AdminForms";
import {
  AdminOrder,
  AdminProduct,
  AdminSection,
  formatCurrency,
  formatOrderDate,
  formatRelativeAge,
  parseMoney,
  STATUS_COLORS,
} from "@/components/admin/admin-types";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { normalizeArray } from "@/lib/normalizeArray";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  Clock3,
  DollarSign,
  Package,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SummarySnapshot = {
  current?: {
    totalOrders: number;
    totalRevenue: number;
    paidOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
  };
  previous?: {
    totalOrders: number;
    totalRevenue: number;
    paidOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
  };
  period?: string;
};

type AnalyticsPeriod = "weekly" | "monthly" | "yearly";

const ADMIN_SECTIONS: Array<{
  id: AdminSection;
  label: string;
  description: string;
  icon: typeof BarChart3;
}> = [
  { id: "overview", label: "Overview", description: "Daily command center", icon: BarChart3 },
  { id: "current", label: "Current Orders", description: "Active fulfillment queue", icon: ClipboardList },
  { id: "pending", label: "Pending Orders", description: "Delete or process fresh orders", icon: Clock3 },
  { id: "past", label: "Past Orders", description: "Completed and cancelled history", icon: Clock3 },
  { id: "surveillance", label: "Surveillance", description: "Watch urgent operations", icon: AlertTriangle },
  { id: "manual", label: "Manual Entry", description: "Book WhatsApp orders", icon: Truck },
  { id: "inventory", label: "Inventory", description: "Manage stock and pricing", icon: Boxes },
  { id: "customers", label: "Customers", description: "Review every registered user", icon: Users },
  { id: "analytics", label: "Analytics", description: "Weekly, monthly, yearly revenue", icon: TrendingUp },
];

/* ─── Blue accent design tokens (used throughout admin) ──────────────────────
   These mirror Tailwind classes but are centralised here for consistency.
   The admin-shell CSS class in index.css provides the theme overrides.
──────────────────────────────────────────────────────────────────────────── */
const BLUE = {
  icon: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
  badgeSoft: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  activeNav: "border-l-2 border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
  inactiveNav: "border-l-2 border-transparent hover:bg-gray-100/70 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300",
  pill: "bg-blue-600 text-white",
  chartFill: "#2563eb",
} as const;

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>("weekly");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const utils = api.useUtils();

  const ordersQuery = api.admin.allOrders.useQuery({});
  const weeklySummaryQuery = api.admin.weeklySummary.useQuery();
  const monthlySummaryQuery = api.admin.monthlySummary.useQuery();
  const yearlySummaryQuery = api.admin.yearlySummary.useQuery();
  const usersQuery = api.admin.allUsers.useQuery();
  const productsQuery = api.admin.allProducts.useQuery();
  const categoriesQuery = api.categories.list.useQuery();

  const updateStatus = api.admin.updateOrderStatus.useMutation({
    onSuccess: async () => {
      toast.success("Order updated.");
      setSelectedOrder(null);
      await Promise.all([
        ordersQuery.refetch(),
        weeklySummaryQuery.refetch(),
        monthlySummaryQuery.refetch(),
        yearlySummaryQuery.refetch(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const createManualOrder = api.admin.createManualOrder.useMutation({
    onSuccess: async () => {
      toast.success("Manual order created.");
      setActiveSection("pending");
      await Promise.all([
        ordersQuery.refetch(),
        weeklySummaryQuery.refetch(),
        monthlySummaryQuery.refetch(),
        yearlySummaryQuery.refetch(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const saveProduct = api.admin.upsertProduct.useMutation({
    onSuccess: async () => {
      toast.success("Inventory saved.");
      await productsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteOrder = api.admin.deleteOrder.useMutation({
    onSuccess: async () => {
      toast.success("Pending order deleted.");
      setSelectedOrder(null);
      await Promise.all([
        ordersQuery.refetch(),
        weeklySummaryQuery.refetch(),
        monthlySummaryQuery.refetch(),
        yearlySummaryQuery.refetch(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  // ── Normalise all API data through the single normalization layer ────────────
  const orders = normalizeArray<AdminOrder>(ordersQuery.data);
  const allUsers = normalizeArray(usersQuery.data);
  const allProducts = normalizeArray<AdminProduct>(productsQuery.data);
  const categories = normalizeArray(categoriesQuery.data).map((category: any) => ({
    id: category.id,
    name: category.name,
  }));

  const currentOrders = useMemo(
    () => orders.filter((order) => !["delivered", "cancelled"].includes(order.status)),
    [orders],
  );
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "pending"),
    [orders],
  );
  const pastOrders = useMemo(
    () => orders.filter((order) => ["delivered", "cancelled"].includes(order.status)),
    [orders],
  );
  const urgentOrders = useMemo(
    () =>
      currentOrders.filter((order) => {
        const ageHours = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
        return ageHours >= 48 || order.paymentStatus === "unpaid";
      }),
    [currentOrders],
  );
  const manualOrders = useMemo(
    () => orders.filter((order) => order.source === "whatsapp" || order.source === "manual"),
    [orders],
  );
  const lowStockProducts = useMemo(
    () => allProducts.filter((product) => (product.stockCount ?? 0) <= 3 || product.inStock === false),
    [allProducts],
  );

  const summaryMap: Record<AnalyticsPeriod, SummarySnapshot | undefined> = {
    weekly: weeklySummaryQuery.data,
    monthly: monthlySummaryQuery.data,
    yearly: yearlySummaryQuery.data,
  };
  const activeSummary = summaryMap[analyticsPeriod];
  const revenueDelta =
    activeSummary?.previous?.totalRevenue && activeSummary.previous.totalRevenue > 0
      ? (((activeSummary.current?.totalRevenue ?? 0) - activeSummary.previous.totalRevenue) /
          activeSummary.previous.totalRevenue) *
        100
      : 0;

  const revenueChartData = useMemo(() => buildRevenueChartData(orders, analyticsPeriod), [orders, analyticsPeriod]);
  const statusMixData = useMemo(
    () => [
      { label: "Active", count: currentOrders.length },
      { label: "Pending", count: pendingOrders.length },
      { label: "Past", count: pastOrders.length },
      { label: "Urgent", count: urgentOrders.length },
    ],
    [currentOrders.length, pastOrders.length, pendingOrders.length, urgentOrders.length],
  );

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-24 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="mt-3 text-muted-foreground">
          Sign in as an admin to open the operator workspace.
        </p>
        <Link href="/">
          <Button className="mt-6">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const isBusy =
    ordersQuery.isLoading ||
    usersQuery.isLoading ||
    productsQuery.isLoading ||
    weeklySummaryQuery.isLoading ||
    monthlySummaryQuery.isLoading ||
    yearlySummaryQuery.isLoading;

  return (
    <div className="admin-shell min-h-screen bg-[var(--background)] pb-12">
      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="sticky top-0 hidden lg:flex flex-col h-screen border-r border-[var(--border)] bg-[var(--card)] overflow-y-auto">
          {/* Brand */}
          <div className="px-6 py-6 border-b border-[var(--border)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
              Admin
            </p>
            <h1 className="mt-1 text-xl font-bold text-[var(--foreground)]">Luku Control</h1>
            <p className="mt-1 text-xs text-[var(--muted-foreground)] truncate">
              {user.name || user.email}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {ADMIN_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                  activeSection === section.id ? BLUE.activeNav : BLUE.inactiveNav
                }`}
              >
                <section.icon className={`h-4 w-4 shrink-0 ${activeSection === section.id ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
                <div className="min-w-0">
                  <p className="font-medium truncate">{section.label}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)] truncate hidden xl:block">{section.description}</p>
                </div>
              </button>
            ))}
          </nav>

          {/* Live counts */}
          <div className="px-3 py-4 border-t border-[var(--border)]">
            <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--muted-foreground)]">Live counts</p>
            <div className="grid grid-cols-2 gap-2">
              <MetricChip label="Active" value={currentOrders.length} />
              <MetricChip label="Pending" value={pendingOrders.length} />
              <MetricChip label="Urgent" value={urgentOrders.length} accent />
              <MetricChip label="Low stock" value={lowStockProducts.length} accent={lowStockProducts.length > 0} />
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  {ADMIN_SECTIONS.find((s) => s.id === activeSection)?.label}
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {getSectionIntro(activeSection)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void Promise.all([
                    ordersQuery.refetch(),
                    usersQuery.refetch(),
                    productsQuery.refetch(),
                    weeklySummaryQuery.refetch(),
                    monthlySummaryQuery.refetch(),
                    yearlySummaryQuery.refetch(),
                  ]);
                }}
                className="gap-2 shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* ── Overview ──────────────────────────────────────────────── */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Revenue This Month"
                    value={formatCurrency(monthlySummaryQuery.data?.current?.totalRevenue)}
                    note={`${Math.round(revenueDelta)}% vs previous`}
                    icon={DollarSign}
                  />
                  <StatCard
                    label="Pending Orders"
                    value={String(pendingOrders.length)}
                    note="Needs processing"
                    icon={ClipboardList}
                  />
                  <StatCard
                    label="Customer Accounts"
                    value={String(allUsers.length)}
                    note={`${manualOrders.length} manual-origin`}
                    icon={Users}
                  />
                  <StatCard
                    label="Products"
                    value={String(allProducts.length)}
                    note={`${lowStockProducts.length} low stock`}
                    icon={ShoppingBag}
                  />
                </div>

                {/* Tables */}
                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">Current fulfillment queue</h3>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Newest active orders first</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setActiveSection("current")}>
                        View all
                      </Button>
                    </div>
                    <div className="p-4">
                      <OrdersTable
                        orders={currentOrders.slice(0, 6)}
                        emptyTitle="No active orders right now"
                        emptyDescription="New orders will appear here."
                        onSelect={setSelectedOrder}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border)]">
                      <h3 className="font-semibold text-[var(--foreground)]">Watchlist</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <WatchCard title="Pending orders" count={pendingOrders.length} detail="Awaiting confirmation" />
                      <WatchCard title="Urgent orders" count={urgentOrders.length} detail="48h+ or unpaid" urgent />
                      <WatchCard title="WhatsApp / manual" count={manualOrders.length} detail="Off-platform orders" />
                      <WatchCard title="Low stock" count={lowStockProducts.length} detail="≤3 units remaining" urgent={lowStockProducts.length > 0} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Current Orders ─────────────────────────────────────────── */}
            {activeSection === "current" && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Active orders</h3>
                </div>
                <div className="p-4">
                  <OrdersTable
                    orders={currentOrders}
                    emptyTitle="No current orders"
                    emptyDescription="New orders will queue here once received."
                    onSelect={setSelectedOrder}
                  />
                </div>
              </div>
            )}

            {/* ── Pending Orders ─────────────────────────────────────────── */}
            {activeSection === "pending" && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Pending order desk</h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Review, confirm, or delete new orders.
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-3 py-1 text-xs font-semibold">
                    {pendingOrders.length} waiting
                  </span>
                </div>
                <div className="p-4">
                  <OrdersTable
                    orders={pendingOrders}
                    emptyTitle="No pending orders"
                    emptyDescription="Fresh orders appear here before confirmation."
                    onSelect={setSelectedOrder}
                  />
                </div>
              </div>
            )}

            {/* ── Past Orders ────────────────────────────────────────────── */}
            {activeSection === "past" && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Order history</h3>
                </div>
                <div className="p-4">
                  <OrdersTable
                    orders={pastOrders}
                    emptyTitle="No history yet"
                    emptyDescription="Delivered and cancelled orders build this log."
                    onSelect={setSelectedOrder}
                  />
                </div>
              </div>
            )}

            {/* ── Surveillance ───────────────────────────────────────────── */}
            {activeSection === "surveillance" && (
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Urgent order radar</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {urgentOrders.length === 0 ? (
                      <EmptyMessage
                        title="No urgent orders right now"
                        description="The queue is healthy."
                      />
                    ) : (
                      urgentOrders.map((order) => (
                        <div key={order.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold text-[var(--foreground)] text-sm">{order.orderNumber}</p>
                              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                                {order.customerName} · {order.source} · {formatRelativeAge(order.createdAt)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                                {order.status}
                              </span>
                              <span className="rounded-full bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300">
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(order.total)}</p>
                            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              Review
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border)]">
                      <h3 className="font-semibold text-[var(--foreground)]">Low stock watch</h3>
                    </div>
                    <div className="p-4 space-y-2">
                      {lowStockProducts.length === 0 ? (
                        <EmptyMessage title="Stock levels healthy" description="No products are low stock." />
                      ) : (
                        lowStockProducts.slice(0, 8).map((product) => (
                          <div key={product.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[var(--foreground)]">{product.name}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {product.stockCount ?? 0} left · {product.inStock ? "live" : "paused"}
                              </p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => setActiveSection("inventory")}>
                              Edit
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border)]">
                      <h3 className="font-semibold text-[var(--foreground)]">Traffic split</h3>
                    </div>
                    <div className="p-4 h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusMixData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--border)]" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill={BLUE.chartFill} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Manual Entry ───────────────────────────────────────────── */}
            {activeSection === "manual" && (
              <ManualOrderForm
                loading={createManualOrder.isPending}
                onSubmit={async (payload) => {
                  await createManualOrder.mutateAsync(payload);
                }}
              />
            )}

            {/* ── Inventory ──────────────────────────────────────────────── */}
            {activeSection === "inventory" && (
              <InventoryManager
                categories={categories}
                products={allProducts}
                loading={saveProduct.isPending}
                onSubmit={async (payload) => {
                  await saveProduct.mutateAsync(payload);
                  await utils.products.list.invalidate();
                }}
              />
            )}

            {/* ── Customers ──────────────────────────────────────────────── */}
            {activeSection === "customers" && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Customer accounts</h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      All registered users and admins
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BLUE.badgeSoft}`}>
                    {allUsers.length} total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40">
                        {["Name", "Email", "Role", "Joined", "Last Seen"].map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {allUsers.map((account: any) => (
                        <tr key={account.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                            {account.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">{account.email || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              account.role === "admin" ? BLUE.badgeSoft : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                            }`}>
                              {account.role === "admin" ? "Admin" : "Customer"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">
                            {account.createdAt ? formatOrderDate(account.createdAt) : "—"}
                          </td>
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">
                            {account.lastSignedIn ? formatOrderDate(account.lastSignedIn) : "Never"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Analytics ──────────────────────────────────────────────── */}
            {activeSection === "analytics" && (
              <div className="space-y-6">
                {/* Period selector */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">Revenue intelligence</h3>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        Track order flow and revenue across trading windows.
                      </p>
                    </div>
                    <div className="flex gap-1 rounded-lg border border-[var(--border)] p-1 bg-[var(--background)]">
                      {(["weekly", "monthly", "yearly"] as const).map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setAnalyticsPeriod(period)}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                            analyticsPeriod === period
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      label="Orders"
                      value={String(activeSummary?.current?.totalOrders ?? 0)}
                      note={`Prev ${activeSummary?.previous?.totalOrders ?? 0}`}
                      icon={Package}
                    />
                    <StatCard
                      label="Revenue"
                      value={formatCurrency(activeSummary?.current?.totalRevenue)}
                      note={`${revenueDelta >= 0 ? "+" : ""}${revenueDelta.toFixed(1)}%`}
                      icon={DollarSign}
                    />
                    <StatCard
                      label="Paid Orders"
                      value={String(activeSummary?.current?.paidOrders ?? 0)}
                      note={`Prev ${activeSummary?.previous?.paidOrders ?? 0}`}
                      icon={TrendingUp}
                    />
                    <StatCard
                      label="Delivered"
                      value={String(activeSummary?.current?.deliveredOrders ?? 0)}
                      note={`Prev ${activeSummary?.previous?.deliveredOrders ?? 0}`}
                      icon={Truck}
                    />
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border)]">
                      <h3 className="font-semibold text-[var(--foreground)]">Revenue chart</h3>
                    </div>
                    <div className="p-4 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--border)]" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="revenue" fill={BLUE.chartFill} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border)]">
                      <h3 className="font-semibold text-[var(--foreground)]">Latest orders</h3>
                    </div>
                    <div className="p-4 divide-y divide-[var(--border)]">
                      {orders.slice(0, 6).map((order) => (
                        <div key={order.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)]">{order.customerName}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{formatOrderDate(order.createdAt)}</p>
                          </div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(order.total)}</p>
                        </div>
                      ))}
                      {orders.length === 0 && (
                        <EmptyMessage title="No orders yet" description="First orders will appear here." />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isBusy && (
              <div className="rounded-lg border border-dashed border-[var(--border)] px-5 py-3 text-xs text-[var(--muted-foreground)]">
                Loading data...
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Order detail modal ────────────────────────────────────────────── */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          loading={updateStatus.isPending}
          deleteLoading={deleteOrder.isPending}
          canDelete={selectedOrder.status === "pending"}
          onClose={() => setSelectedOrder(null)}
          onUpdate={async (id, status, paymentStatus, notes) => {
            await updateStatus.mutateAsync({
              orderId: id,
              status: status as any,
              paymentStatus: paymentStatus as any,
              notes,
            });
          }}
          onDelete={async (id) => {
            await deleteOrder.mutateAsync({ orderId: id });
          }}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function MetricChip({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${accent && value > 0 ? "border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20" : "border-[var(--border)] bg-[var(--background)]"}`}>
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${accent && value > 0 ? "text-amber-700 dark:text-amber-300" : "text-[var(--foreground)]"}`}>
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof DollarSign;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className={`inline-flex rounded-lg p-2.5 ${BLUE.icon}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{note}</p>
    </div>
  );
}

function WatchCard({
  title,
  count,
  detail,
  urgent = false,
}: {
  title: string;
  count: number;
  detail: string;
  urgent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{title}</p>
        <p className="text-xs text-[var(--muted-foreground)] truncate">{detail}</p>
      </div>
      <span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
        urgent && count > 0
          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          : BLUE.badgeSoft
      }`}>
        {count}
      </span>
    </div>
  );
}

function EmptyMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] px-6 py-10 text-center">
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}

function getSectionIntro(section: AdminSection) {
  switch (section) {
    case "overview": return "Revenue, fulfillment pressure, customers, and stock at a glance.";
    case "current": return "Handle live orders, payments, and delivery progress.";
    case "pending": return "Review new orders quickly — confirm or remove them.";
    case "past": return "Completed and cancelled order history for reconciliation.";
    case "surveillance": return "Urgent orders, low-stock products, and manual traffic.";
    case "manual": return "Book WhatsApp and walk-in orders so every sale hits reporting.";
    case "inventory": return "Add products, update pricing, and manage stock levels.";
    case "customers": return "Every registered customer and admin in one list.";
    case "analytics": return "Revenue and order performance — weekly, monthly, yearly.";
  }
}

function buildRevenueChartData(orders: AdminOrder[], period: AnalyticsPeriod) {
  if (period === "weekly") {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const buckets = labels.map((label) => ({ label, revenue: 0 }));
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const mondayFirstIndex = (date.getDay() + 6) % 7;
      buckets[mondayFirstIndex]!.revenue += parseMoney(order.total);
    });
    return buckets;
  }

  if (period === "monthly") {
    const labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
    const buckets = labels.map((label) => ({ label, revenue: 0 }));
    orders.forEach((order) => {
      const weekIndex = Math.min(4, Math.floor((new Date(order.createdAt).getDate() - 1) / 7));
      buckets[weekIndex]!.revenue += parseMoney(order.total);
    });
    return buckets;
  }

  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const buckets = labels.map((label) => ({ label, revenue: 0 }));
  orders.forEach((order) => {
    const monthIndex = new Date(order.createdAt).getMonth();
    buckets[monthIndex]!.revenue += parseMoney(order.total);
  });
  return buckets;
}
