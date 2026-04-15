"use client";

import React, { createContext, useCallback, useContext } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export type CartItemLocal = {
  id: number;
  productId: number;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  product: {
    id: number;
    name: string;
    price: string;
    imageUrl: string;
    slug: string;
    inStock: boolean;
  };
};

type CartContextValue = {
  items: CartItemLocal[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (productId: number, quantity: number, selectedSize?: string, selectedColor?: string) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const utils = api.useUtils();

  const { data: cartData, isLoading, refetch } = api.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const addMutation = api.cart.add.useMutation({
    onSuccess: () => { utils.cart.get.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = api.cart.update.useMutation({
    onSuccess: () => { utils.cart.get.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = api.cart.remove.useMutation({
    onSuccess: () => { utils.cart.get.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const clearMutation = api.cart.clear.useMutation({
    onSuccess: () => { utils.cart.get.invalidate(); },
  });

  const items: CartItemLocal[] = (cartData as CartItemLocal[] | undefined) ?? [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);

  const addItem = useCallback(async (productId: number, quantity: number, selectedSize?: string, selectedColor?: string) => {
    await addMutation.mutateAsync({ productId, quantity, selectedSize, selectedColor });
  }, [addMutation]);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    await updateMutation.mutateAsync({ itemId, quantity });
  }, [updateMutation]);

  const removeItem = useCallback(async (itemId: number) => {
    await removeMutation.mutateAsync({ itemId });
  }, [removeMutation]);

  const clearCartFn = useCallback(async () => {
    await clearMutation.mutateAsync();
  }, [clearMutation]);

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      subtotal,
      isLoading,
      addItem,
      updateItem,
      removeItem,
      clearCart: clearCartFn,
      refetch,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
