"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Truck,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    customerName: user?.name ?? "",
    customerEmail: user?.email ?? "",
    customerPhone: "",
    needsDelivery: false,
    deliveryAddress: "",
    deliveryCity: "",
    deliveryNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const createOrder = api.orders.create.useMutation({
    onSuccess: async (order) => {
      await clearCart().catch(() => undefined);
      setOrderId(order.id);
      toast.success("Order placed successfully!");
    },
    onError: (err) => {
      toast.error("Failed to place order: " + err.message);
      setSubmitting(false);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-24 text-center">
        <h2 className="font-display text-2xl font-bold mb-3">Sign in to checkout</h2>
        <a href={getLoginUrl()} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">
          Sign In
        </a>
      </div>
    );
  }

  if (items.length === 0 && !orderId) {
    return (
      <div className="container py-24 text-center">
        <h2 className="font-display text-2xl font-bold mb-3">Your cart is empty</h2>
        <Link href="/category/mens-collection">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="container py-24 text-center max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="font-display text-3xl font-bold mb-3">Order Placed!</h2>
          <p className="text-muted-foreground mb-2">
            Your order has been received. We'll confirm it shortly.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Order #{orderId} — Check your orders page for updates.
          </p>

          <div className="bg-card border border-border rounded-2xl p-5 mb-6 text-left">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              Prefer to pay via M-Pesa?
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Send payment to our M-Pesa number and WhatsApp us your confirmation.
            </p>
            <a
              href={`https://wa.me/254701887586?text=${encodeURIComponent(`Hi Alivella Boutique! I just placed Order #${orderId}. Please send me payment details.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp w-full justify-center"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Us on WhatsApp
            </a>
          </div>

          <div className="flex gap-3">
            <Link href="/account/orders" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <Package className="w-4 h-4" />
                View Orders
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const deliveryFee = form.needsDelivery ? 50 : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) { toast.error("Please enter your name"); return; }
    if (form.needsDelivery && !form.deliveryAddress.trim()) { toast.error("Please enter your delivery address"); return; }
    setSubmitting(true);

    await createOrder.mutateAsync({
      ...form,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.imageUrl,
        price: item.product.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize ?? undefined,
        selectedColor: item.selectedColor ?? undefined,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/cart" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 text-accent" />
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={form.customerName}
                      onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                      placeholder="Your full name"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={form.customerPhone}
                        onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                        placeholder="+254 700 000 000"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.customerEmail}
                      onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                      placeholder="your@email.com"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-accent" />
                  Delivery Options
                </h2>

                {/* Toggle */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, needsDelivery: false }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      !form.needsDelivery ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Package className={`w-5 h-5 mb-2 ${!form.needsDelivery ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-semibold text-sm">Pickup</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Collect from our store</p>
                    <p className="text-xs font-semibold text-green-600 mt-1">Free</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, needsDelivery: true }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.needsDelivery ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Truck className={`w-5 h-5 mb-2 ${form.needsDelivery ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-semibold text-sm">Delivery</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Delivered to your door</p>
                    <p className="text-xs font-semibold text-foreground mt-1">KES 50</p>
                  </button>
                </div>

                {/* Address form */}
                {form.needsDelivery && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="address">Delivery Address *</Label>
                      <div className="relative mt-1.5">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <textarea
                          id="address"
                          value={form.deliveryAddress}
                          onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))}
                          placeholder="Street address, building, apartment..."
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          rows={3}
                          required={form.needsDelivery}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="city">City / Town</Label>
                      <Input
                        id="city"
                        value={form.deliveryCity}
                        onChange={e => setForm(f => ({ ...f, deliveryCity: e.target.value }))}
                        placeholder="e.g. Nairobi, Mombasa"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Delivery Notes</Label>
                      <Input
                        id="notes"
                        value={form.deliveryNotes}
                        onChange={e => setForm(f => ({ ...f, deliveryNotes: e.target.value }))}
                        placeholder="Any special instructions..."
                        className="mt-1.5"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Payment Info */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent" />
                  Payment
                </h2>
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">
                    Payment is handled via <strong className="text-foreground">M-Pesa</strong> or <strong className="text-foreground">Cash on Delivery</strong>. After placing your order, you'll receive our payment details via WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
                <h2 className="font-semibold text-lg mb-5">Order Summary</h2>

                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-lg bg-secondary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground line-clamp-2">{item.product.name}</p>
                        {item.selectedSize && <p className="text-xs text-muted-foreground">Size: {item.selectedSize}</p>}
                        <p className="text-xs font-semibold mt-0.5">
                          KES {(parseFloat(item.product.price) * item.quantity).toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>KES {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>{deliveryFee > 0 ? `KES ${deliveryFee}` : "Free"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span>KES {total.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2 h-12 text-sm font-semibold"
                  disabled={submitting}
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  By placing your order, you agree to our terms of service.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
