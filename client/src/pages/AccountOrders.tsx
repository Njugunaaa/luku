import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { api } from "@/lib/api";
import { normalizeArray } from "@/lib/normalizeArray";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import { Link } from "wouter";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-indigo-100 text-indigo-700", icon: Package },
  shipped: { label: "Shipped", color: "bg-cyan-100 text-cyan-700", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AccountOrders() {
  const { isAuthenticated } = useAuth();
  const { data: orders, isLoading } = api.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-24 text-center">
        <h2 className="font-display text-2xl font-bold mb-3">Sign in to view your orders</h2>
        <a href={getLoginUrl()} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">
          Sign In
        </a>
      </div>
    );
  }

  const normalizedOrders = normalizeArray(orders);

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">My Orders</h1>
            <p className="text-sm text-muted-foreground">Track your purchases</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-5 bg-secondary rounded w-32" />
                  <div className="h-5 bg-secondary rounded w-20" />
                </div>
                <div className="h-4 bg-secondary rounded w-48 mb-2" />
                <div className="h-4 bg-secondary rounded w-24" />
              </div>
            ))}
          </div>
        ) : normalizedOrders.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Start shopping to see your orders here.</p>
            <Link href="/category/mens-collection" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {normalizedOrders.map((order: any, i: number) => {
              const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["pending"]!;
              const StatusIcon = statusCfg.icon;
              const orderItems = normalizeArray(order.items);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-semibold text-foreground">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-KE", {
                          year: "numeric", month: "long", day: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {order.paymentStatus === "paid" ? "Paid" : "Payment Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {orderItems.slice(0, 4).map((item: any) => (
                      <div key={item.id} className="shrink-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded-lg bg-secondary"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {orderItems.length > 4 && (
                      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                        +{orderItems.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {orderItems.length} item{orderItems.length !== 1 ? "s" : ""}
                        {order.needsDelivery && " · Delivery"}
                      </p>
                    </div>
                    <p className="font-bold text-foreground">
                      KES {parseFloat(String(order.total)).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
