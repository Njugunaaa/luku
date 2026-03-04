import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  DollarSign,
  Edit3,
  Package,
  Plus,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Tab = "overview" | "orders" | "manual" | "reports";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<"weekly" | "monthly">("weekly");

  const utils = trpc.useUtils();

  // Queries
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = trpc.admin.allOrders.useQuery({});
  const { data: weeklySummary } = trpc.admin.weeklySummary.useQuery();
  const { data: monthlySummary } = trpc.admin.monthlySummary.useQuery();
  const { data: allUsers = [] } = trpc.admin.allUsers.useQuery();

  // Mutations
  const updateStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => { toast.success("Order updated!"); refetchOrders(); setSelectedOrder(null); },
    onError: (e) => toast.error(e.message),
  });

  const createManual = trpc.admin.createManualOrder.useMutation({
    onSuccess: () => { toast.success("Manual order created!"); refetchOrders(); setShowManualForm(false); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-24 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3">Access Denied</h2>
        <p className="text-muted-foreground mb-6">You need admin privileges to view this page.</p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const summary = reportPeriod === "weekly" ? weeklySummary : monthlySummary;
  const current = summary?.current;
  const previous = summary?.previous;

  const revenueChange = previous && previous.totalRevenue > 0
    ? ((current?.totalRevenue ?? 0) - previous.totalRevenue) / previous.totalRevenue * 100
    : 0;

  const TABS = [
    { id: "overview" as Tab, label: "Overview", icon: BarChart3 },
    { id: "orders" as Tab, label: "Orders", icon: ClipboardList },
    { id: "manual" as Tab, label: "Manual Entry", icon: Plus },
    { id: "reports" as Tab, label: "Reports", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
          </div>
          <button onClick={() => refetchOrders()} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-8 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Orders", value: orders.length, icon: Package, color: "text-blue-600 bg-blue-50" },
                { label: "Revenue (Month)", value: `KES ${(current?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
                { label: "Paid Orders", value: current?.paidOrders ?? 0, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
                { label: "Total Customers", value: allUsers.length, icon: Users, color: "text-purple-600 bg-purple-50" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg">Recent Orders</h2>
                <button onClick={() => setActiveTab("orders")} className="text-sm text-accent hover:underline">
                  View All
                </button>
              </div>
              <OrdersTable orders={orders.slice(0, 5)} onSelect={setSelectedOrder} onUpdateStatus={updateStatus} />
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">All Orders ({orders.length})</h2>
              <Button size="sm" onClick={() => setActiveTab("manual")} className="gap-2">
                <Plus className="w-4 h-4" />
                Manual Entry
              </Button>
            </div>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <OrdersTable orders={orders} onSelect={setSelectedOrder} onUpdateStatus={updateStatus} />
            )}
          </div>
        )}

        {/* Manual Entry Tab */}
        {activeTab === "manual" && (
          <ManualOrderForm onSubmit={async (data) => { await createManual.mutateAsync(data as any); }} loading={createManual.isPending} />
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Period Toggle */}
            <div className="flex gap-2">
              {(["weekly", "monthly"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setReportPeriod(p)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    reportPeriod === p ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-secondary"
                  }`}
                >
                  {p === "weekly" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Orders", value: current?.totalOrders ?? 0, prev: previous?.totalOrders ?? 0 },
                { label: "Revenue", value: `KES ${(current?.totalRevenue ?? 0).toLocaleString()}`, prev: null },
                { label: "Paid Orders", value: current?.paidOrders ?? 0, prev: previous?.paidOrders ?? 0 },
                { label: "Delivered", value: current?.deliveredOrders ?? 0, prev: previous?.deliveredOrders ?? 0 },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  {stat.prev !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      vs {stat.prev} previous {reportPeriod === "weekly" ? "week" : "month"}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Revenue trend */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-5">Revenue Comparison</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { period: `Previous ${reportPeriod === "weekly" ? "Week" : "Month"}`, revenue: previous?.totalRevenue ?? 0 },
                  { period: `Current ${reportPeriod === "weekly" ? "Week" : "Month"}`, revenue: current?.totalRevenue ?? 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.008 70)" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v.toLocaleString()}`} />
                  <Tooltip formatter={(v: any) => [`KES ${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="oklch(0.72 0.15 75)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Orders breakdown */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-5">Orders Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: "Total", count: current?.totalOrders ?? 0 },
                  { name: "Paid", count: current?.paidOrders ?? 0 },
                  { name: "Pending", count: current?.pendingOrders ?? 0 },
                  { name: "Delivered", count: current?.deliveredOrders ?? 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.008 70)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="oklch(0.18 0.015 60)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={async (id, status, paymentStatus, notes) => {
            await updateStatus.mutateAsync({ orderId: id, status: status as any, paymentStatus: paymentStatus as any, notes });
          }}
          loading={updateStatus.isPending}
        />
      )}
    </div>
  );
}

// ─── Orders Table ─────────────────────────────────────────────────────────────
function OrdersTable({ orders, onSelect, onUpdateStatus }: {
  orders: any[];
  onSelect: (order: any) => void;
  onUpdateStatus: any;
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {["Order #", "Customer", "Items", "Total", "Status", "Payment", "Date", "Actions"].map(h => (
              <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
              <td className="py-3 px-3 font-mono text-xs font-semibold">{order.orderNumber}</td>
              <td className="py-3 px-3">
                <p className="font-medium text-foreground truncate max-w-[120px]">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{order.source}</p>
              </td>
              <td className="py-3 px-3 text-muted-foreground">{order.items?.length ?? 0}</td>
              <td className="py-3 px-3 font-semibold whitespace-nowrap">
                KES {parseFloat(String(order.total)).toLocaleString()}
              </td>
              <td className="py-3 px-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {order.status}
                </span>
              </td>
              <td className="py-3 px-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                }`}>
                  {order.paymentStatus}
                </span>
              </td>
              <td className="py-3 px-3 text-muted-foreground text-xs whitespace-nowrap">
                {new Date(order.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
              </td>
              <td className="py-3 px-3">
                <button
                  onClick={() => onSelect(order)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  title="Edit order"
                >
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onUpdate, loading }: {
  order: any;
  onClose: () => void;
  onUpdate: (id: number, status: string, paymentStatus: string, notes: string) => Promise<void>;
  loading: boolean;
}) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [notes, setNotes] = useState(order.notes ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-lg">Order {order.orderNumber}</h2>
            <p className="text-xs text-muted-foreground">{order.customerName} · {order.source}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Items</h3>
            <div className="space-y-2">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  {item.productImage && (
                    <img src={item.productImage} alt={item.productName} className="w-10 h-10 object-cover rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    {item.selectedSize && <p className="text-xs text-muted-foreground">Size: {item.selectedSize}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">KES {parseFloat(item.price).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>KES {parseFloat(order.subtotal).toLocaleString()}</span>
            </div>
            {parseFloat(order.deliveryFee) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>KES {parseFloat(order.deliveryFee).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-border pt-2">
              <span>Total</span>
              <span>KES {parseFloat(order.total).toLocaleString()}</span>
            </div>
          </div>

          {/* Delivery info */}
          {order.needsDelivery && (
            <div className="bg-blue-50 rounded-xl p-4 text-sm">
              <p className="font-semibold text-blue-800 mb-1 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Delivery Required
              </p>
              <p className="text-blue-700">{order.deliveryAddress}</p>
              {order.deliveryCity && <p className="text-blue-700">{order.deliveryCity}</p>}
            </div>
          )}

          {/* Update Status */}
          <div className="space-y-3">
            <div>
              <Label>Order Status</Label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {["pending", "confirmed", "paid", "processing", "shipped", "delivered", "cancelled"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {["unpaid", "paid", "refunded"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Admin Notes</Label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Internal notes..."
                className="mt-1.5 w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={() => onUpdate(order.id, status, paymentStatus, notes)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Manual Order Form ────────────────────────────────────────────────────────
function ManualOrderForm({ onSubmit, loading }: { onSubmit: (data: any) => Promise<void>; loading: boolean }) {
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    needsDelivery: false,
    deliveryAddress: "",
    deliveryCity: "",
    source: "whatsapp" as "whatsapp" | "manual",
    notes: "",
  });
  const [items, setItems] = useState([{ productName: "", price: "", quantity: 1, selectedSize: "" }]);

  const addItem = () => setItems(i => [...i, { productName: "", price: "", quantity: 1, selectedSize: "" }]);
  const removeItem = (idx: number) => setItems(i => i.filter((_, j) => j !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    setItems(i => i.map((item, j) => j === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName) { toast.error("Customer name required"); return; }
    if (items.some(i => !i.productName || !i.price)) { toast.error("All items need name and price"); return; }
    await onSubmit({ ...form, items });
    setForm({ customerName: "", customerPhone: "", customerEmail: "", needsDelivery: false, deliveryAddress: "", deliveryCity: "", source: "whatsapp", notes: "" });
    setItems([{ productName: "", price: "", quantity: 1, selectedSize: "" }]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-5">Manual Order Entry</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Record orders placed via WhatsApp or in person.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <Label>Customer Name *</Label>
            <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Full name" className="mt-1.5" required />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="+254 700 000 000" className="mt-1.5" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="email@example.com" className="mt-1.5" />
          </div>
          <div>
            <Label>Order Source</Label>
            <select
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value as any }))}
              className="mt-1.5 w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="manual">Manual / In-person</option>
            </select>
          </div>
        </div>

        {/* Delivery */}
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="delivery"
            checked={form.needsDelivery}
            onChange={e => setForm(f => ({ ...f, needsDelivery: e.target.checked }))}
            className="w-4 h-4"
          />
          <Label htmlFor="delivery" className="cursor-pointer">Needs Delivery</Label>
        </div>
        {form.needsDelivery && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Delivery Address</Label>
              <Input value={form.deliveryAddress} onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.deliveryCity} onChange={e => setForm(f => ({ ...f, deliveryCity: e.target.value }))} className="mt-1.5" />
            </div>
          </div>
        )}

        <div>
          <Label>Notes</Label>
          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." className="mt-1.5" />
        </div>
      </div>

      {/* Items */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Order Items</h3>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-end p-3 bg-secondary rounded-xl">
              <div className="col-span-12 sm:col-span-5">
                <Label className="text-xs">Product Name *</Label>
                <Input value={item.productName} onChange={e => updateItem(idx, "productName", e.target.value)} placeholder="e.g. Blue Denim Jacket" className="mt-1" />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Label className="text-xs">Price (KES) *</Label>
                <Input type="number" value={item.price} onChange={e => updateItem(idx, "price", e.target.value)} placeholder="1500" className="mt-1" />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, "quantity", parseInt(e.target.value))} className="mt-1" />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Label className="text-xs">Size</Label>
                <Input value={item.selectedSize} onChange={e => updateItem(idx, "selectedSize", e.target.value)} placeholder="M" className="mt-1" />
              </div>
              <div className="col-span-1">
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total preview */}
        <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm font-semibold">
          <span>Estimated Total</span>
          <span>KES {items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity, 0).toLocaleString()}</span>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full h-12 text-sm font-semibold gap-2">
        <ClipboardList className="w-4 h-4" />
        {loading ? "Creating Order..." : "Create Manual Order"}
      </Button>
    </form>
  );
}
