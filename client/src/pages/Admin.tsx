"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { CategoryManager, InventoryManager, ManualOrderForm } from "@/components/admin/AdminForms";
import { OrderDetailModal, OrdersTable } from "@/components/admin/AdminOrderViews";
import {
  type AdminOrder,
  type AdminProduct,
  type AdminSection,
  formatCurrency,
  formatOrderDate,
  formatRelativeAge,
  parseMoney,
} from "@/components/admin/admin-types";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  buildVisibleCategoryIdSet,
  filterProductsByVisibleCategoryIds,
  filterVisibleCategories,
} from "@/lib/catalog";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  Clock3,
  DollarSign,
  LayoutGrid,
  Package,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
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
  icon: typeof LayoutGrid;
}> = [
  { id: "overview", label: "Overview", description: "Daily pulse", icon: LayoutGrid },
  { id: "current", label: "Current Orders", description: "Active work", icon: ClipboardList },
  { id: "pending", label: "Pending Orders", description: "Needs review", icon: Clock3 },
  { id: "past", label: "Past Orders", description: "Completed history", icon: Package },
  { id: "surveillance", label: "Attention", description: "Urgent checks", icon: AlertTriangle },
  { id: "manual", label: "Manual Orders", description: "WhatsApp and walk-in", icon: Truck },
  { id: "inventory", label: "Inventory", description: "Products and categories", icon: Boxes },
  { id: "customers", label: "Customers", description: "Accounts", icon: Users },
  { id: "analytics", label: "Analytics", description: "Revenue and trend", icon: BarChart3 },
];

const pageClass =
  "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(120,53,15,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.04),transparent_28%),linear-gradient(180deg,#faf6f1_0%,#f4f3ef_38%,#eef1f3_100%)] pb-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.08),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_24%),linear-gradient(180deg,#101214_0%,#15181c_45%,#0f1114_100%)]";
const shellClass =
  "rounded-[1.75rem] border border-stone-200/85 bg-white/96 shadow-[0_20px_65px_-40px_rgba(15,23,42,0.28)] dark:border-white/8 dark:bg-[#111315]/96";
const panelClass =
  "rounded-[1.4rem] border border-stone-200/80 bg-stone-50/88 dark:border-white/8 dark:bg-[#181b20]/92";
const subtleTextClass = "text-slate-600 dark:text-slate-300";
const metricTextClass = "text-slate-950 dark:text-slate-50";

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

  const ordersQuery = api.admin.allOrders.useQuery({}, { enabled: needsOrders, staleTime: 30_000 });
  const weeklySummaryQuery = api.admin.weeklySummary.useQuery({
    enabled: needsSummaries && analyticsPeriod === "weekly",
    staleTime: 30_000,
  });
  const monthlySummaryQuery = api.admin.monthlySummary.useQuery({
    enabled: needsSummaries,
    staleTime: 30_000,
  });
  const yearlySummaryQuery = api.admin.yearlySummary.useQuery({
    enabled: needsSummaries && analyticsPeriod === "yearly",
    staleTime: 30_000,
  });
  const usersQuery = api.admin.allUsers.useQuery({ enabled: needsUsers, staleTime: 30_000 });
  const productsQuery = api.admin.allProducts.useQuery({ enabled: needsProducts, staleTime: 30_000 });
  const categoriesQuery = api.categories.list.useQuery({ staleTime: 30_000 });

  async function refetchAdminData() {
    await Promise.all([
      ordersQuery.refetch(),
      weeklySummaryQuery.refetch(),
      monthlySummaryQuery.refetch(),
      yearlySummaryQuery.refetch(),
      usersQuery.refetch(),
      productsQuery.refetch(),
      categoriesQuery.refetch(),
    ]);
  }

  const updateStatus = api.admin.updateOrderStatus.useMutation({
    onSuccess: async () => {
      toast.success("Order updated.");
      setSelectedOrder(null);
      await refetchAdminData();
    },
    onError: (error) => toast.error(error.message),
  });

  const createManualOrder = api.admin.createManualOrder.useMutation({
    onSuccess: async () => {
      toast.success("Manual order created.");
      setActiveSection("pending");
      await refetchAdminData();
    },
    onError: (error) => toast.error(error.message),
  });

  const saveProduct = api.admin.upsertProduct.useMutation({
    onSuccess: async () => {
      toast.success("Inventory saved.");
      await Promise.all([
        productsQuery.refetch(),
        categoriesQuery.refetch(),
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
        categoriesQuery.refetch(),
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
        productsQuery.refetch(),
        utils.categories.list.invalidate(),
        utils.products.list.invalidate(),
        utils.products.featured.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteOrder = api.admin.deleteOrder.useMutation({
    onSuccess: async () => {
      toast.success("Pending order deleted.");
      setSelectedOrder(null);
      await refetchAdminData();
    },
    onError: (error) => toast.error(error.message),
  });

  const orders = (ordersQuery.data ?? []) as AdminOrder[];
  const allUsers = usersQuery.data ?? [];
  const rawCategories = categoriesQuery.data ?? [];
  const visibleCategories = useMemo(() => filterVisibleCategories(rawCategories), [rawCategories]);
  const visibleCategoryIds = useMemo(() => buildVisibleCategoryIdSet(rawCategories), [rawCategories]);
  const allProducts = useMemo(
    () =>
      filterProductsByVisibleCategoryIds(
        (productsQuery.data ?? []) as AdminProduct[],
        visibleCategoryIds,
      ) as AdminProduct[],
    [productsQuery.data, visibleCategoryIds],
  );
  const categories = visibleCategories.map((category) => ({
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
  const activeSummary = summaryMap[analyticsPeriod] ?? monthlySummaryQuery.data;
  const revenueDelta =
    activeSummary?.previous?.totalRevenue && activeSummary.previous.totalRevenue > 0
      ? (((activeSummary.current?.totalRevenue ?? 0) - activeSummary.previous.totalRevenue) /
          activeSummary.previous.totalRevenue) *
        100
      : 0;
  const revenueChartData = useMemo(
    () => buildRevenueChartData(orders, analyticsPeriod),
    [orders, analyticsPeriod],
  );

  const sectionBadges: Record<AdminSection, string> = {
    overview: "Live",
    current: String(currentOrders.length),
    pending: String(pendingOrders.length),
    past: String(pastOrders.length),
    surveillance: String(urgentOrders.length + lowStockProducts.length),
    manual: String(manualOrders.length),
    inventory: String(allProducts.length),
    customers: String(allUsers.length),
    analytics: analyticsPeriod.toUpperCase(),
  };

  const currentSectionMeta = ADMIN_SECTIONS.find((section) => section.id === activeSection) ?? ADMIN_SECTIONS[0];

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-24 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="mt-3 text-muted-foreground">Sign in as an admin to open the operator workspace.</p>
        <Link href="/">
          <Button className="mt-6">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const isBusy =
    (needsOrders && ordersQuery.isLoading) ||
    (needsSummaries &&
      ((analyticsPeriod === "weekly" && weeklySummaryQuery.isLoading) ||
        monthlySummaryQuery.isLoading ||
        (analyticsPeriod === "yearly" && yearlySummaryQuery.isLoading))) ||
    (needsUsers && usersQuery.isLoading) ||
    (needsProducts && productsQuery.isLoading) ||
    categoriesQuery.isLoading;

  const primaryError =
    ordersQuery.error ||
    weeklySummaryQuery.error ||
    monthlySummaryQuery.error ||
    yearlySummaryQuery.error ||
    usersQuery.error ||
    productsQuery.error ||
    categoriesQuery.error;

  let sectionContent: React.ReactNode = null;

  if (primaryError) {
    sectionContent = (
      <InlineErrorBox
        title="Admin data could not load"
        message={primaryError.message || "Please refresh the dashboard and try again."}
      />
    );
  } else if (isBusy) {
    sectionContent = <LoadingPanel title={`Loading ${currentSectionMeta.label.toLowerCase()}...`} />;
  } else if (activeSection === "overview") {
    sectionContent = (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Revenue"
            value={formatCurrency(activeSummary?.current?.totalRevenue)}
            note={`${revenueDelta >= 0 ? "+" : ""}${revenueDelta.toFixed(1)}% vs previous`}
            icon={DollarSign}
          />
          <SummaryCard
            label="Orders"
            value={String(activeSummary?.current?.totalOrders ?? orders.length)}
            note={`${pendingOrders.length} pending right now`}
            icon={ShoppingBag}
          />
          <SummaryCard
            label="Customers"
            value={String(allUsers.length)}
            note={`${manualOrders.length} manual orders tracked`}
            icon={Users}
          />
          <SummaryCard
            label="Low Stock"
            value={String(lowStockProducts.length)}
            note={`${urgentOrders.length} urgent order${urgentOrders.length === 1 ? "" : "s"}`}
            icon={AlertTriangle}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
          <section className={cn(panelClass, "p-4 sm:p-5")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Revenue trend
                </h3>
                <p className={cn("mt-1 text-sm", subtleTextClass)}>
                  Fast view of how sales are moving this {analyticsPeriod.replace("ly", "")}.
                </p>
              </div>
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-white/10 dark:bg-[#111315] dark:text-slate-200">
                {analyticsPeriod}
              </span>
            </div>
            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgba(196,138,86,0.28)" />
                      <stop offset="95%" stopColor="rgba(196,138,86,0.02)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(value) => formatCompactAmount(Number(value))}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: 18,
                      border: "1px solid rgba(148,163,184,0.18)",
                      background: "rgba(15,23,42,0.96)",
                      color: "#e2e8f0",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#c48a56"
                    strokeWidth={3}
                    fill="url(#adminRevenueFill)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#c48a56", stroke: "#fff", strokeWidth: 1.5 }}
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="space-y-4">
            <section className={cn(panelClass, "p-4 sm:p-5")}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Queue split</h3>
              <div className="mt-4 space-y-3">
                <ProgressRow label="Current orders" value={currentOrders.length} tone="bg-slate-950 dark:bg-[#f4efe7]" max={Math.max(orders.length, 1)} />
                <ProgressRow label="Pending" value={pendingOrders.length} tone="bg-amber-500 dark:bg-amber-400" max={Math.max(orders.length, 1)} />
                <ProgressRow label="Past orders" value={pastOrders.length} tone="bg-stone-400 dark:bg-stone-300" max={Math.max(orders.length, 1)} />
                <ProgressRow label="Urgent" value={urgentOrders.length} tone="bg-rose-500 dark:bg-rose-400" max={Math.max(orders.length, 1)} />
              </div>
            </section>

            <section className={cn(panelClass, "p-4 sm:p-5")}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Needs attention</h3>
              <div className="mt-4 space-y-3">
                <InsightRow
                  title="Pending approvals"
                  detail="Fresh orders waiting for review."
                  value={String(pendingOrders.length)}
                />
                <InsightRow
                  title="Urgent follow-up"
                  detail="Aged or unpaid orders needing action."
                  value={String(urgentOrders.length)}
                />
                <InsightRow
                  title="Low stock products"
                  detail="Products at three units or fewer."
                  value={String(lowStockProducts.length)}
                />
              </div>
            </section>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className={cn(panelClass, "p-4 sm:p-5")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Pending queue</h3>
                <p className={cn("mt-1 text-sm", subtleTextClass)}>
                  The next orders you should clear.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection("pending")}
                className="text-sm font-medium text-slate-700 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              >
                Open section
              </button>
            </div>
            <OrdersTable
              orders={pendingOrders.slice(0, 5)}
              emptyTitle="No pending orders"
              emptyDescription="New orders will appear here for quick review."
              onSelect={setSelectedOrder}
            />
          </section>

          <section className={cn(panelClass, "p-4 sm:p-5")}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recent activity</h3>
              <p className={cn("mt-1 text-sm", subtleTextClass)}>
                Latest orders and how recently they came in.
              </p>
            </div>
            <RecentOrderList orders={orders.slice(0, 6)} />
          </section>
        </div>
      </div>
    );
  } else if (activeSection === "current") {
    sectionContent = (
      <OrdersTable
        orders={currentOrders}
        emptyTitle="No active orders"
        emptyDescription="Once new orders come in, the live queue will show up here."
        onSelect={setSelectedOrder}
      />
    );
  } else if (activeSection === "pending") {
    sectionContent = (
      <OrdersTable
        orders={pendingOrders}
        emptyTitle="No pending orders"
        emptyDescription="All new orders are already cleared."
        onSelect={setSelectedOrder}
      />
    );
  } else if (activeSection === "past") {
    sectionContent = (
      <OrdersTable
        orders={pastOrders}
        emptyTitle="No archived orders"
        emptyDescription="Completed and cancelled orders will collect here."
        onSelect={setSelectedOrder}
      />
    );
  } else if (activeSection === "surveillance") {
    sectionContent = (
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className={cn(panelClass, "p-4 sm:p-5")}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Urgent orders</h3>
            <p className={cn("mt-1 text-sm", subtleTextClass)}>
              Orders that are aging out or still unpaid.
            </p>
          </div>
          <OrdersTable
            orders={urgentOrders}
            emptyTitle="Nothing urgent"
            emptyDescription="No orders are currently overdue or payment-blocked."
            onSelect={setSelectedOrder}
          />
        </section>

        <div className="space-y-4">
          <section className={cn(panelClass, "p-4 sm:p-5")}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Low stock</h3>
            <div className="mt-4 space-y-3">
              {lowStockProducts.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className="rounded-[1.15rem] border border-stone-200/80 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-[#111315]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-50">
                        {product.name}
                      </p>
                      <p className={cn("mt-1 text-sm", subtleTextClass)}>
                        {product.brand || "Unbranded"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#f7efe6] px-3 py-1 text-xs font-semibold text-[#8c6239] dark:bg-[#231c16] dark:text-[#e6c6a4]">
                      {product.stockCount ?? 0} left
                    </span>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 ? (
                <EmptyMessage
                  title="Stock looks healthy"
                  description="No products are currently in the low stock range."
                />
              ) : null}
            </div>
          </section>

          <section className={cn(panelClass, "p-4 sm:p-5")}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Quick notes</h3>
            <div className="mt-4 space-y-3">
              <InsightRow
                title="Manual orders"
                detail="Sales captured outside the storefront."
                value={String(manualOrders.length)}
              />
              <InsightRow
                title="Delivered orders"
                detail="Orders already completed."
                value={String(activeSummary?.current?.deliveredOrders ?? 0)}
              />
              <InsightRow
                title="Paid orders"
                detail="Orders already confirmed with payment."
                value={String(activeSummary?.current?.paidOrders ?? 0)}
              />
            </div>
          </section>
        </div>
      </div>
    );
  } else if (activeSection === "manual") {
    sectionContent = (
      <ManualOrderForm
        loading={createManualOrder.isPending}
        onSubmit={async (payload) => {
          await createManualOrder.mutateAsync(payload);
        }}
      />
    );
  } else if (activeSection === "inventory") {
    sectionContent = (
      <div className="space-y-6">
        <InventoryManager
          categories={categories}
          products={allProducts}
          loading={saveProduct.isPending}
          deletingProductId={deleteProduct.variables?.productId ?? null}
          onSubmit={async (payload) => {
            await saveProduct.mutateAsync(payload);
          }}
          onDelete={async (productId) => {
            await deleteProduct.mutateAsync({ productId });
          }}
        />
        <CategoryManager
          categories={visibleCategories}
          loading={saveCategory.isPending}
          onSubmit={async (payload) => {
            await saveCategory.mutateAsync(payload);
          }}
        />
      </div>
    );
  } else if (activeSection === "customers") {
    sectionContent = (
      <section className={cn(panelClass, "overflow-hidden")}>
        <div className="flex items-center justify-between gap-4 border-b border-stone-200/80 px-4 py-4 dark:border-white/8 sm:px-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Customer accounts</h3>
            <p className={cn("mt-1 text-sm", subtleTextClass)}>
              Cleaner view of shoppers and admin operators.
            </p>
          </div>
          <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-[#111315] dark:text-slate-200">
            {allUsers.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-stone-200/80 bg-stone-100/70 dark:border-white/8 dark:bg-[#15181c]">
                {["Name", "Email", "Role", "Joined", "Last Seen"].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allUsers.map((account: any) => (
                <tr key={account.id} className="border-b border-stone-200/70 dark:border-white/8">
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-50">
                    {account.name || "No name"}
                  </td>
                  <td className={cn("px-4 py-4", subtleTextClass)}>{account.email || "No email"}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-stone-200/80 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-white/10 dark:text-slate-100">
                      {account.role === "admin" ? "Admin" : "Customer"}
                    </span>
                  </td>
                  <td className={cn("px-4 py-4", subtleTextClass)}>
                    {account.createdAt ? formatOrderDate(account.createdAt) : "Unknown"}
                  </td>
                  <td className={cn("px-4 py-4", subtleTextClass)}>
                    {account.lastSignedIn ? formatOrderDate(account.lastSignedIn) : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  } else if (activeSection === "analytics") {
    sectionContent = (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Orders"
            value={String(activeSummary?.current?.totalOrders ?? 0)}
            note={`Previous ${activeSummary?.previous?.totalOrders ?? 0}`}
            icon={Package}
          />
          <SummaryCard
            label="Revenue"
            value={formatCurrency(activeSummary?.current?.totalRevenue)}
            note={`${revenueDelta >= 0 ? "+" : ""}${revenueDelta.toFixed(1)}% change`}
            icon={DollarSign}
          />
          <SummaryCard
            label="Paid"
            value={String(activeSummary?.current?.paidOrders ?? 0)}
            note={`Previous ${activeSummary?.previous?.paidOrders ?? 0}`}
            icon={TrendingUp}
          />
          <SummaryCard
            label="Delivered"
            value={String(activeSummary?.current?.deliveredOrders ?? 0)}
            note={`Previous ${activeSummary?.previous?.deliveredOrders ?? 0}`}
            icon={Truck}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <section className={cn(panelClass, "p-4 sm:p-5")}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Revenue chart</h3>
            <p className={cn("mt-1 text-sm", subtleTextClass)}>
              Compact view of the active period.
            </p>
            <div className="mt-4 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgba(196,138,86,0.28)" />
                      <stop offset="95%" stopColor="rgba(196,138,86,0.02)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(value) => formatCompactAmount(Number(value))}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: 18,
                      border: "1px solid rgba(148,163,184,0.18)",
                      background: "rgba(15,23,42,0.96)",
                      color: "#e2e8f0",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#c48a56"
                    strokeWidth={3}
                    fill="url(#analyticsRevenueFill)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#c48a56", stroke: "#fff", strokeWidth: 1.5 }}
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={cn(panelClass, "p-4 sm:p-5")}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Latest wins</h3>
            <div className="mt-4">
              <RecentOrderList orders={orders.slice(0, 8)} />
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-[1680px] px-4 py-4 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className={cn(shellClass, "flex flex-col gap-4 p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]")}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500 dark:text-slate-400">
                Admin
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                Boutique Console
              </h1>
              <p className={cn("mt-2 text-sm", subtleTextClass)}>
                Minimal workspace for orders, stock, customers, and reporting.
              </p>
            </div>

            <div className="grid gap-2">
              <Button
                type="button"
                onClick={() => setActiveSection("inventory")}
                className="justify-start rounded-[1rem] bg-slate-950 text-white hover:bg-slate-800 dark:bg-[#f4efe7] dark:text-slate-950 dark:hover:bg-[#ece4d9]"
              >
                <Boxes className="h-4 w-4" />
                Open inventory
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveSection("manual")}
                className="justify-start rounded-[1rem] border-stone-200 bg-white text-slate-700 hover:bg-stone-50 dark:border-white/10 dark:bg-[#171a1f] dark:text-slate-200 dark:hover:bg-[#1d2127]"
              >
                <Truck className="h-4 w-4" />
                Add manual order
              </Button>
            </div>

            <nav className="space-y-1 overflow-y-auto pr-1">
              {ADMIN_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[1.1rem] px-3 py-3 text-left transition-colors",
                      isActive
                        ? "bg-slate-950 text-white dark:bg-[#f2ede5] dark:text-slate-950"
                        : "text-slate-700 hover:bg-stone-100 dark:text-slate-200 dark:hover:bg-[#181b20]",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl",
                        isActive
                          ? "bg-white/12 dark:bg-white/60"
                          : "bg-white shadow-sm dark:bg-white/8",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold">{section.label}</p>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                            isActive
                              ? "bg-white/12 text-white dark:bg-white/60 dark:text-slate-950"
                              : "bg-stone-200/80 text-slate-700 dark:bg-white/8 dark:text-slate-200",
                          )}
                        >
                          {sectionBadges[section.id]}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          isActive ? "text-white/75 dark:text-slate-700" : "text-slate-500 dark:text-slate-400",
                        )}
                      >
                        {section.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[1.25rem] border border-stone-200/80 bg-stone-50/85 p-4 dark:border-white/8 dark:bg-[#181b20]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500 dark:text-slate-400">
                Signed in
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-[#f4efe7] dark:text-slate-950">
                  {user.name?.charAt(0)?.toUpperCase() ?? "A"}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-50">
                    {user.name || "Admin"}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <section className={shellClass}>
              <div className="flex flex-col gap-4 border-b border-stone-200/80 px-4 py-4 dark:border-white/8 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-slate-400">
                    Control Room
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                    {currentSectionMeta.label}
                  </h2>
                  <p className={cn("mt-2 text-sm", subtleTextClass)}>{getSectionIntro(activeSection)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(activeSection === "overview" || activeSection === "analytics") && (
                    <div className="flex rounded-full border border-stone-200 bg-stone-50 p-1 dark:border-white/10 dark:bg-[#181b20]">
                      {(["weekly", "monthly", "yearly"] as const).map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setAnalyticsPeriod(period)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
                            analyticsPeriod === period
                              ? "bg-slate-950 text-white dark:bg-[#f4efe7] dark:text-slate-950"
                              : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white",
                          )}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void refetchAdminData();
                    }}
                    className="rounded-full border-stone-200 bg-white text-slate-700 hover:bg-stone-50 dark:border-white/10 dark:bg-[#171a1f] dark:text-slate-200 dark:hover:bg-[#1d2127]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="px-4 py-5 sm:px-5">{sectionContent}</div>
            </section>
          </main>
        </div>
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

function SummaryCard({
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
    <div className={cn(panelClass, "p-4")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="rounded-2xl bg-white p-2.5 text-slate-700 shadow-sm dark:bg-white/8 dark:text-slate-100">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn("mt-4 text-3xl font-semibold", metricTextClass)}>{value}</p>
      <p className={cn("mt-2 text-sm", subtleTextClass)}>{note}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 12 : 0) : 0;

  return (
    <div className="rounded-[1.15rem] border border-stone-200/80 bg-white/80 p-3.5 dark:border-white/8 dark:bg-[#111315]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{label}</p>
        <span className="rounded-full bg-stone-200/80 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-white/8 dark:text-slate-100">
          {value}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-stone-200/75 dark:bg-white/8">
        <div className={cn("h-full rounded-full transition-all duration-500", tone)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function InsightRow({
  title,
  detail,
  value,
}: {
  title: string;
  detail: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-stone-200/80 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-[#111315]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-slate-50">{title}</p>
          <p className={cn("mt-1 text-sm", subtleTextClass)}>{detail}</p>
        </div>
        <p className={cn("text-lg font-semibold", metricTextClass)}>{value}</p>
      </div>
    </div>
  );
}

function RecentOrderList({ orders }: { orders: AdminOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyMessage
        title="No orders to show yet"
        description="The recent activity list will fill in as orders arrive."
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-[1.15rem] border border-stone-200/80 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-[#111315]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900 dark:text-slate-50">
                {order.customerName}
              </p>
              <p className={cn("mt-1 text-sm", subtleTextClass)}>
                {order.orderNumber} • {formatRelativeAge(order.createdAt)}
              </p>
            </div>
            <p className={cn("text-sm font-semibold", metricTextClass)}>{formatCurrency(order.total)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingPanel({ title }: { title: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-stone-300/80 px-6 py-14 text-center dark:border-white/10">
      <p className="font-medium text-slate-900 dark:text-slate-50">{title}</p>
      <p className={cn("mt-2 text-sm", subtleTextClass)}>One moment while the latest admin data arrives.</p>
    </div>
  );
}

function InlineErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[1.4rem] border border-red-200 bg-red-50/80 px-5 py-4 dark:border-red-900/50 dark:bg-red-950/20">
      <p className="font-semibold text-slate-900 dark:text-slate-50">{title}</p>
      <p className={cn("mt-2 text-sm", subtleTextClass)}>{message}</p>
    </div>
  );
}

function EmptyMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-stone-300/80 px-6 py-12 text-center dark:border-white/10">
      <p className="font-medium text-slate-900 dark:text-slate-50">{title}</p>
      <p className={cn("mt-2 text-sm", subtleTextClass)}>{description}</p>
    </div>
  );
}

function formatCompactAmount(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }

  return value.toString();
}

function getSectionIntro(section: AdminSection) {
  switch (section) {
    case "overview":
      return "Key numbers, current queue pressure, and the next orders worth your attention.";
    case "current":
      return "Everything still moving through confirmation, payment, shipping, or delivery.";
    case "pending":
      return "Fresh orders waiting for the first operator decision.";
    case "past":
      return "Completed and cancelled orders kept in one clean archive.";
    case "surveillance":
      return "A tighter view of overdue orders, unpaid orders, and stock risks.";
    case "manual":
      return "Capture WhatsApp and in-person sales without leaving the admin workspace.";
    case "inventory":
      return "Manage the storefront catalog and collections in one place.";
    case "customers":
      return "Registered shoppers and admin roles in a simpler table.";
    case "analytics":
      return "Revenue, order volume, and delivery progress by period.";
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
