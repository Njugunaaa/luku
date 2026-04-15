import { useAuth } from "@/_core/hooks/useAuth";
import { OrdersTable, OrderDetailModal } from "@/components/admin/AdminOrderViews";
import { CategoryManager, InventoryManager, ManualOrderForm } from "@/components/admin/AdminForms";
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

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>("weekly");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const utils = api.useUtils();

  const needsOrders =
    activeSection === "overview" ||
    activeSection === "current" ||
    activeSection === "pending" ||
    activeSection === "past" ||
    activeSection === "surveillance" ||
    activeSection === "manual" ||
    activeSection === "analytics";
  const needsSummaries = activeSection === "overview" || activeSection === "analytics";
  const needsUsers = activeSection === "overview" || activeSection === "customers";
  const needsProducts =
    activeSection === "overview" ||
    activeSection === "surveillance" ||
    activeSection === "inventory";
  const needsCategories = activeSection === "inventory";

  const ordersQuery = api.admin.allOrders.useQuery(
    {},
    { enabled: needsOrders, staleTime: 30_000 },
  );
  const weeklySummaryQuery = api.admin.weeklySummary.useQuery({
    enabled: needsSummaries,
    staleTime: 30_000,
  });
  const monthlySummaryQuery = api.admin.monthlySummary.useQuery({
    enabled: needsSummaries,
    staleTime: 30_000,
  });
  const yearlySummaryQuery = api.admin.yearlySummary.useQuery({
    enabled: needsSummaries,
    staleTime: 30_000,
  });
  const usersQuery = api.admin.allUsers.useQuery({
    enabled: needsUsers,
    staleTime: 30_000,
  });
  const productsQuery = api.admin.allProducts.useQuery({
    enabled: needsProducts,
    staleTime: 30_000,
  });
  const categoriesQuery = api.categories.list.useQuery({
    enabled: needsCategories,
    staleTime: 30_000,
  });

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
      await Promise.all([
        productsQuery.refetch(),
        utils.products.list.invalidate(),
        utils.products.featured.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteProduct = api.admin.deleteProduct.useMutation({
    onSuccess: async () => {
      toast.success("Product deleted.");
      await Promise.all([
        productsQuery.refetch(),
        utils.products.list.invalidate(),
        utils.products.featured.invalidate(),
        utils.cart.get.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const saveCategory = api.admin.upsertCategory.useMutation({
    onSuccess: async () => {
      toast.success("Category saved.");
      await Promise.all([
        categoriesQuery.refetch(),
        utils.categories.list.invalidate(),
      ]);
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

  const orders = (ordersQuery.data ?? []) as AdminOrder[];
  const allUsers = usersQuery.data ?? [];
  const allProducts = (productsQuery.data ?? []) as AdminProduct[];
  const rawCategories = categoriesQuery.data ?? [];
  const categories = rawCategories.map((category) => ({
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
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
    <div className="bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,113,133,0.1),transparent_24%)] bg-background pb-10">
      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-6 px-4 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[2rem] border border-border bg-card p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          <p className="text-xs uppercase tracking-[0.28em] text-pink-500">Admin Ops</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">Luku control room</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Welcome back, {user.name || user.email}. Run fulfillment, inventory, and reporting from one place.
          </p>

          <div className="mt-6 grid gap-3">
            {ADMIN_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                  activeSection === section.id
                    ? "border-pink-400/60 bg-pink-500/10 shadow-sm"
                    : "border-border bg-background/60 hover:border-pink-300/50 hover:bg-pink-500/[0.06]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-secondary/70 p-2.5">
                    <section.icon className="h-4 w-4 text-pink-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{section.label}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live counts</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <MetricChip label="Current" value={currentOrders.length} />
              <MetricChip label="Pending" value={pendingOrders.length} />
              <MetricChip label="Urgent" value={urgentOrders.length} />
              <MetricChip label="Low stock" value={lowStockProducts.length} />
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <header className="rounded-[2rem] border border-border bg-card p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-pink-500">Operations Dashboard</p>
                <h2 className="mt-3 text-3xl font-semibold text-foreground">
                  {ADMIN_SECTIONS.find((section) => section.id === activeSection)?.label}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  {getSectionIntro(activeSection)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
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
                className="gap-2 self-start"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </header>

          {activeSection === "overview" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Revenue This Month"
                  value={formatCurrency(monthlySummaryQuery.data?.current?.totalRevenue)}
                  note={`${Math.round(revenueDelta)}% vs previous period`}
                  icon={DollarSign}
                />
                <StatCard
                  label="Pending Orders"
                  value={String(pendingOrders.length)}
                  note="Delete or process fresh orders fast"
                  icon={ClipboardList}
                />
                <StatCard
                  label="Customer Accounts"
                  value={String(allUsers.length)}
                  note={`${manualOrders.length} manual-origin orders`}
                  icon={Users}
                />
                <StatCard
                  label="Inventory Count"
                  value={String(allProducts.length)}
                  note={`${lowStockProducts.length} low stock or paused`}
                  icon={ShoppingBag}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-[2rem] border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">Current fulfillment queue</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Focus the team on the newest active orders first.
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setActiveSection("current")}>
                      View all current
                    </Button>
                  </div>
                  <div className="mt-6">
                    <OrdersTable
                      orders={currentOrders.slice(0, 6)}
                      emptyTitle="No active orders right now"
                      emptyDescription="New website and WhatsApp orders will appear here."
                      onSelect={setSelectedOrder}
                    />
                  </div>
                </section>

                <section className="rounded-[2rem] border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">Operational watchlist</h3>
                  <div className="mt-5 space-y-4">
                    <WatchCard
                      title="Pending orders"
                      count={pendingOrders.length}
                      detail="Fresh orders waiting for confirmation, processing, or deletion."
                    />
                    <WatchCard
                      title="Urgent orders"
                      count={urgentOrders.length}
                      detail="Pending, unpaid, or aging orders that need operator follow-up."
                    />
                    <WatchCard
                      title="WhatsApp / manual orders"
                      count={manualOrders.length}
                      detail="Orders booked outside the storefront that still affect revenue and stock."
                    />
                    <WatchCard
                      title="Low stock products"
                      count={lowStockProducts.length}
                      detail="Products with 3 or fewer units left, or temporarily paused from sale."
                    />
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activeSection === "current" ? (
            <section className="rounded-[2rem] border border-border bg-card p-6">
              <OrdersTable
                orders={currentOrders}
                emptyTitle="No current orders"
                emptyDescription="Once new customer orders arrive, they will queue here for admin handling."
                onSelect={setSelectedOrder}
              />
            </section>
          ) : null}

          {activeSection === "pending" ? (
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-border bg-card p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Pending order desk</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Review fresh orders, move them forward, or delete only the ones that should not stay in the system.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-pink-400/20 bg-pink-500/10 px-4 py-3 text-sm text-pink-700 dark:text-pink-200">
                    {pendingOrders.length} pending order{pendingOrders.length === 1 ? "" : "s"} waiting
                  </div>
                </div>
                <div className="mt-6">
                  <OrdersTable
                    orders={pendingOrders}
                    emptyTitle="No pending orders"
                    emptyDescription="Fresh orders will appear here before they are confirmed or processed."
                    onSelect={setSelectedOrder}
                  />
                </div>
              </section>
            </div>
          ) : null}

          {activeSection === "past" ? (
            <section className="rounded-[2rem] border border-border bg-card p-6">
              <OrdersTable
                orders={pastOrders}
                emptyTitle="No completed history yet"
                emptyDescription="Delivered and cancelled orders will build your history panel."
                onSelect={setSelectedOrder}
              />
            </section>
          ) : null}

          {activeSection === "surveillance" ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[2rem] border border-border bg-card p-6">
                <h3 className="text-xl font-semibold">Urgent order radar</h3>
                <div className="mt-5 space-y-4">
                  {urgentOrders.length === 0 ? (
                    <EmptyMessage
                      title="No urgent orders right now"
                      description="The queue is healthy. New high-priority issues will surface here."
                    />
                  ) : (
                    urgentOrders.map((order) => (
                      <div key={order.id} className="rounded-3xl border border-border bg-background/70 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{order.orderNumber}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {order.customerName} · {order.source} · {formatRelativeAge(order.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-secondary text-secondary-foreground"}`}>
                              {order.status}
                            </span>
                            <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-200">
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-foreground">{formatCurrency(order.total)}</p>
                          <Button type="button" variant="outline" onClick={() => setSelectedOrder(order)}>
                            Review order
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <div className="space-y-6">
                <section className="rounded-[2rem] border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">Low stock watch</h3>
                  <div className="mt-5 space-y-3">
                    {lowStockProducts.length === 0 ? (
                      <EmptyMessage
                        title="No low stock products"
                        description="Inventory levels are looking healthy."
                      />
                    ) : (
                      lowStockProducts.slice(0, 8).map((product) => (
                        <div key={product.id} className="flex items-center gap-3 rounded-3xl border border-border bg-background/70 p-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-14 w-14 rounded-2xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.stockCount ?? 0} left · {product.inStock ? "live" : "paused"}
                            </p>
                          </div>
                          <Button type="button" variant="outline" onClick={() => setActiveSection("inventory")}>
                            Open
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-[2rem] border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">Traffic split</h3>
                  <div className="mt-5 h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusMixData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="rgb(236 72 153)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activeSection === "manual" ? (
            <ManualOrderForm
              loading={createManualOrder.isPending}
              onSubmit={async (payload) => {
                await createManualOrder.mutateAsync(payload);
              }}
            />
          ) : null}

          {activeSection === "inventory" ? (
            <div className="space-y-6">
              <InventoryManager
                categories={categories}
                products={allProducts}
                loading={saveProduct.isPending}
                deletingProductId={
                  deleteProduct.isPending ? deleteProduct.variables?.productId ?? null : null
                }
                onSubmit={async (payload) => {
                  await saveProduct.mutateAsync(payload);
                }}
                onDelete={async (productId) => {
                  await deleteProduct.mutateAsync({ productId });
                }}
              />

              <CategoryManager
                categories={rawCategories as any}
                loading={saveCategory.isPending}
                onSubmit={async (payload) => {
                  await saveCategory.mutateAsync(payload);
                }}
              />
            </div>
          ) : null}

          {activeSection === "customers" ? (
            <section className="rounded-[2rem] border border-border bg-card p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Customer accounts</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Every registered user in one clean list so you can track who is shopping and who has admin access.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  {allUsers.length} total account{allUsers.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="mt-6 overflow-x-auto rounded-3xl border border-border">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      {["Name", "Email", "Role", "Joined", "Last Seen"].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((account: any) => (
                      <tr key={account.id} className="border-b border-border/70">
                        <td className="px-4 py-4 font-medium text-foreground">
                          {account.name || "No name"}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{account.email || "No email"}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-600 dark:text-pink-200">
                            {account.role === "admin" ? "Admin" : "Customer"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {account.createdAt ? formatOrderDate(account.createdAt) : "Unknown"}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {account.lastSignedIn ? formatOrderDate(account.lastSignedIn) : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "analytics" ? (
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-border bg-card p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-pink-500">Revenue Intelligence</p>
                    <h3 className="mt-3 text-2xl font-semibold">Weekly, monthly, and yearly trends</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Track order flow and revenue changes across active trading windows.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["weekly", "monthly", "yearly"] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setAnalyticsPeriod(period)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          analyticsPeriod === period
                            ? "bg-pink-500 text-white"
                            : "border border-border bg-background text-foreground hover:border-pink-400 hover:text-pink-500"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              </section>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-[2rem] border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">Revenue chart</h3>
                  <div className="mt-5 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="revenue" fill="rgb(244 114 182)" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">Latest wins</h3>
                  <div className="mt-5 space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="rounded-3xl border border-border bg-background/70 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground">{order.customerName}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {formatOrderDate(order.createdAt)}
                            </p>
                          </div>
                          <p className="font-semibold text-foreground">{formatCurrency(order.total)}</p>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 ? (
                      <EmptyMessage
                        title="No orders to chart yet"
                        description="Once the first orders land, analytics will start filling in."
                      />
                    ) : null}
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {isBusy ? (
            <div className="rounded-[2rem] border border-dashed border-border px-6 py-4 text-sm text-muted-foreground">
              Loading live admin data...
            </div>
          ) : null}
        </main>
      </div>

      {selectedOrder ? (
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
      ) : null}
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
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
    <div className="rounded-[2rem] border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-pink-500/10 p-3 text-pink-500">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function WatchCard({
  title,
  count,
  detail,
}: {
  title: string;
  count: number;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-background/70 p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-foreground">{title}</p>
        <span className="rounded-full bg-pink-500/15 px-3 py-1 text-xs font-semibold text-pink-600 dark:text-pink-200">
          {count}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function EmptyMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function getSectionIntro(section: AdminSection) {
  switch (section) {
    case "overview":
      return "Get a clean read on revenue, fulfillment pressure, customer accounts, and stock levels before you dive into actions.";
    case "current":
      return "Handle live customer orders, payments, and delivery progress from the active fulfillment queue.";
    case "pending":
      return "Review newly placed orders quickly, then either move them into fulfillment or remove the ones that should not remain.";
    case "past":
      return "Review completed and cancelled orders for service follow-up, reconciliation, and support history.";
    case "surveillance":
      return "Watch urgent orders, low-stock products, and manual-origin traffic that needs an operator eye.";
    case "manual":
      return "Book WhatsApp and walk-in orders on behalf of customers so every sale hits reporting and stock correctly.";
    case "inventory":
      return "Add new inventory, refresh pricing, and keep low-stock items moving with a cleaner merchandise desk.";
    case "customers":
      return "See every registered customer and admin account in one place with the key dates that matter.";
    case "analytics":
      return "Track revenue and order performance with weekly, monthly, and yearly views built for admin decision-making.";
  }
}

function buildRevenueChartData(orders: AdminOrder[], period: AnalyticsPeriod) {
  if (period === "weekly") {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const buckets = labels.map((label) => ({ label, revenue: 0 }));
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const mondayFirstIndex = (date.getDay() + 6) % 7;
      buckets[mondayFirstIndex].revenue += parseMoney(order.total);
    });
    return buckets;
  }

  if (period === "monthly") {
    const labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
    const buckets = labels.map((label) => ({ label, revenue: 0 }));
    orders.forEach((order) => {
      const weekIndex = Math.min(4, Math.floor((new Date(order.createdAt).getDate() - 1) / 7));
      buckets[weekIndex].revenue += parseMoney(order.total);
    });
    return buckets;
  }

  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const buckets = labels.map((label) => ({ label, revenue: 0 }));
  orders.forEach((order) => {
    const monthIndex = new Date(order.createdAt).getMonth();
    buckets[monthIndex].revenue += parseMoney(order.total);
  });
  return buckets;
}
