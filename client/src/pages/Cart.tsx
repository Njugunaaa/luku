"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Minus, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link, useLocation } from "@/lib/navigation";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { items, itemCount, subtotal, isLoading, updateItem, removeItem } = useCart();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="container py-24 text-center">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Sign in to view your cart</h2>
        <p className="text-muted-foreground mb-6">Your cart items are saved when you're signed in.</p>
        <a href={getLoginUrl()} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">
          Sign In
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 p-4 bg-card border border-border rounded-xl">
              <div className="w-20 h-20 bg-secondary rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary rounded w-1/2" />
                <div className="h-3 bg-secondary rounded w-1/4" />
                <div className="h-5 bg-secondary rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm mx-auto"
        >
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-9 h-9 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Discover amazing thrifted pieces and add them to your cart.</p>
          <Link href="/category/mens-collection">
            <Button className="gap-2">
              <Package className="w-4 h-4" />
              Start Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">Shopping Cart</h1>
            <p className="text-sm text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4 flex gap-4"
              >
                <Link href={`/product/${item.product.slug}`} className="shrink-0">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl bg-secondary"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/product/${item.product.slug}`}>
                        <h3 className="font-semibold text-sm text-foreground hover:text-accent transition-colors line-clamp-2">
                          {item.product.name}
                        </h3>
                      </Link>
                      {item.selectedSize && (
                        <p className="text-xs text-muted-foreground mt-0.5">Size: {item.selectedSize}</p>
                      )}
                      {item.selectedColor && (
                        <p className="text-xs text-muted-foreground">Color: {item.selectedColor}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { removeItem(item.id); toast.success("Removed from cart"); }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <p className="font-bold text-foreground">
                      KES {(parseFloat(item.product.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
              <h2 className="font-semibold text-lg mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                  <span className="font-medium">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span className="font-medium text-muted-foreground">Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-5">
                <div className="flex justify-between">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold text-lg">KES {subtotal.toLocaleString()}</span>
                </div>
              </div>

              <Button
                className="w-full gap-2 h-12 text-sm font-semibold"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Link href="/category/mens-collection" className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
