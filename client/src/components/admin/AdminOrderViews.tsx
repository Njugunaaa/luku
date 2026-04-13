import { motion } from "framer-motion";
import { Edit3, Package, Trash2, Truck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminOrder,
  formatCurrency,
  formatOrderDate,
  PAYMENT_STATUS_OPTIONS,
  STATUS_COLORS,
  ORDER_STATUS_OPTIONS,
} from "./admin-types";

type OrdersTableProps = {
  orders: AdminOrder[];
  emptyTitle: string;
  emptyDescription: string;
  onSelect: (order: AdminOrder) => void;
};

export function OrdersTable({
  orders,
  emptyTitle,
  emptyDescription,
  onSelect,
}: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/80 bg-background/70 px-6 py-16 text-center">
        <Package className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium text-foreground">{emptyTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-card">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/40">
            {["Order", "Customer", "Source", "Items", "Total", "Status", "Payment", "Placed", "Action"].map((heading) => (
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
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border/70 transition-colors hover:bg-secondary/30">
              <td className="px-4 py-4 font-mono text-xs font-semibold">{order.orderNumber}</td>
              <td className="px-4 py-4">
                <p className="font-medium text-foreground">{order.customerName}</p>
                {order.customerPhone ? (
                  <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                ) : null}
              </td>
              <td className="px-4 py-4 capitalize text-muted-foreground">{order.source}</td>
              <td className="px-4 py-4 text-muted-foreground">{order.items?.length ?? 0}</td>
              <td className="px-4 py-4 font-semibold">{formatCurrency(order.total)}</td>
              <td className="px-4 py-4">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[order.status] ?? "bg-secondary text-secondary-foreground"}`}>
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    order.paymentStatus === "paid"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-200"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </td>
              <td className="px-4 py-4 text-muted-foreground">{formatOrderDate(order.createdAt)}</td>
              <td className="px-4 py-4">
                <button
                  type="button"
                  onClick={() => onSelect(order)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-pink-400 hover:text-pink-500"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Manage
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type OrderDetailModalProps = {
  order: AdminOrder;
  loading: boolean;
  deleteLoading?: boolean;
  canDelete?: boolean;
  onClose: () => void;
  onUpdate: (
    id: number,
    status: string,
    paymentStatus: string,
    notes: string,
  ) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
};

export function OrderDetailModal({
  order,
  loading,
  deleteLoading = false,
  canDelete = false,
  onClose,
  onUpdate,
  onDelete,
}: OrderDetailModalProps) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [notes, setNotes] = useState(order.notes ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-pink-500">Order Control</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">{order.orderNumber}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.customerName} · {formatOrderDate(order.createdAt)} · {order.source}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-pink-400 hover:text-pink-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 overflow-y-auto p-6 lg:grid-cols-[1.25fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-background/70 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Ordered Items
                </h3>
                <p className="text-sm text-muted-foreground">{order.items?.length ?? 0} line items</p>
              </div>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={`${item.productName}-${index}`} className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-500">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity}
                        {item.selectedSize ? ` · Size ${item.selectedSize}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-background/70 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Payment Summary
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {order.needsDelivery ? (
              <div className="rounded-3xl border border-pink-400/20 bg-pink-500/10 p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-pink-600 dark:text-pink-200">
                  <Truck className="h-4 w-4" />
                  Delivery Required
                </p>
                <p className="mt-2 text-sm text-foreground">{order.deliveryAddress}</p>
                {order.deliveryCity ? (
                  <p className="text-sm text-muted-foreground">{order.deliveryCity}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-border bg-background/70 p-5">
              <Label htmlFor="order-status">Order Status</Label>
              <select
                id="order-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/40"
              >
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <Label htmlFor="payment-status" className="mt-5 block">
                Payment Status
              </Label>
              <select
                id="payment-status"
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/40"
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <Label htmlFor="order-notes" className="mt-5 block">
                Internal Notes
              </Label>
              <Textarea
                id="order-notes"
                rows={6}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add delivery notes, payment context, or customer follow-up details."
                className="mt-2 min-h-[140px] rounded-2xl"
              />
            </div>

            <div className="rounded-3xl border border-border bg-background/70 p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Operator note</p>
              <p className="mt-2">
                Use this panel to move current orders through fulfillment, track payments, and keep a clean internal log for WhatsApp and delivery follow-ups.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-6 py-5 sm:flex-row">
          {canDelete && onDelete ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => onDelete(order.id)}
              disabled={deleteLoading}
              className="gap-2 sm:flex-1"
            >
              <Trash2 className="h-4 w-4" />
              {deleteLoading ? "Deleting..." : "Delete Pending Order"}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose} className="sm:flex-1">
            Close
          </Button>
          <Button
            type="button"
            onClick={() => onUpdate(order.id, status, paymentStatus, notes)}
            disabled={loading}
            className="sm:flex-1"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
