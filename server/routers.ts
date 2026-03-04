import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addToCart,
  clearCart,
  createOrder,
  getAllCategories,
  getAllOrders,
  getAllUsers,
  getCartItems,
  getCategoryBySlug,
  getOrderById,
  getOrdersByUserId,
  getOrderSummary,
  getOrderWithItems,
  getProductById,
  getProducts,
  getProductBySlug,
  removeCartItem,
  updateCartItem,
  updateOrderStatus,
  upsertCategory,
  upsertProduct,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Products Router ──────────────────────────────────────────────────────────
const productsRouter = router({
  list: publicProcedure.input(z.object({
    categoryId: z.number().optional(),
    featured: z.boolean().optional(),
    search: z.string().optional(),
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional(),
    inStock: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    return getProducts(input ?? {});
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const product = await getProductBySlug(input.slug);
    if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    return product;
  }),

  byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const product = await getProductById(input.id);
    if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    return product;
  }),

  featured: publicProcedure.query(async () => {
    return getProducts({ featured: true, limit: 8 });
  }),
});

// ─── Categories Router ────────────────────────────────────────────────────────
const categoriesRouter = router({
  list: publicProcedure.query(async () => {
    return getAllCategories();
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const category = await getCategoryBySlug(input.slug);
    if (!category) throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
    return category;
  }),
});

// ─── Cart Router ──────────────────────────────────────────────────────────────
const cartRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getCartItems(ctx.user.id);
  }),

  add: protectedProcedure.input(z.object({
    productId: z.number(),
    quantity: z.number().min(1).max(10),
    selectedSize: z.string().optional(),
    selectedColor: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const product = await getProductById(input.productId);
    if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    if (!product.inStock) throw new TRPCError({ code: "BAD_REQUEST", message: "Product is out of stock" });
    await addToCart({ userId: ctx.user.id, ...input });
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({
    itemId: z.number(),
    quantity: z.number().min(0).max(10),
  })).mutation(async ({ ctx, input }) => {
    await updateCartItem(input.itemId, ctx.user.id, input.quantity);
    return { success: true };
  }),

  remove: protectedProcedure.input(z.object({ itemId: z.number() })).mutation(async ({ ctx, input }) => {
    await removeCartItem(input.itemId, ctx.user.id);
    return { success: true };
  }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await clearCart(ctx.user.id);
    return { success: true };
  }),
});

// ─── Orders Router ────────────────────────────────────────────────────────────
const ordersRouter = router({
  create: protectedProcedure.input(z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().optional(),
    needsDelivery: z.boolean(),
    deliveryAddress: z.string().optional(),
    deliveryCity: z.string().optional(),
    deliveryNotes: z.string().optional(),
    items: z.array(z.object({
      productId: z.number(),
      productName: z.string(),
      productImage: z.string().optional(),
      price: z.string(),
      quantity: z.number().min(1),
      selectedSize: z.string().optional(),
      selectedColor: z.string().optional(),
    })),
  })).mutation(async ({ ctx, input }) => {
    const subtotal = input.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const deliveryFee = input.needsDelivery ? 50 : 0; // KES 50 delivery fee
    const total = subtotal + deliveryFee;

    const order = await createOrder({
      userId: ctx.user.id,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      needsDelivery: input.needsDelivery,
      deliveryAddress: input.deliveryAddress,
      deliveryCity: input.deliveryCity,
      deliveryNotes: input.deliveryNotes,
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
      source: "website",
    }, input.items);

    // Clear cart after successful order
    await clearCart(ctx.user.id);

    return order;
  }),

  myOrders: protectedProcedure.query(async ({ ctx }) => {
    return getOrdersByUserId(ctx.user.id);
  }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const order = await getOrderWithItems(input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    // Users can only see their own orders; admins can see all
    if (ctx.user.role !== "admin" && order.userId !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return order;
  }),
});

// ─── Admin Router ─────────────────────────────────────────────────────────────
const adminRouter = router({
  allOrders: adminProcedure.input(z.object({
    status: z.string().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const orders = await getAllOrders(input ?? {});
    // Attach items to each order
    const result = [];
    for (const order of orders) {
      const full = await getOrderWithItems(order.id);
      if (full) result.push(full);
    }
    return result;
  }),

  updateOrderStatus: adminProcedure.input(z.object({
    orderId: z.number(),
    status: z.enum(["pending", "confirmed", "paid", "processing", "shipped", "delivered", "cancelled"]).optional(),
    paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input }) => {
    await updateOrderStatus(input.orderId, input.status ?? "pending", input.paymentStatus, input.notes);
    return { success: true };
  }),

  createManualOrder: adminProcedure.input(z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().optional(),
    needsDelivery: z.boolean().default(false),
    deliveryAddress: z.string().optional(),
    deliveryCity: z.string().optional(),
    source: z.enum(["whatsapp", "manual"]).default("whatsapp"),
    notes: z.string().optional(),
    items: z.array(z.object({
      productId: z.number().optional(),
      productName: z.string(),
      productImage: z.string().optional(),
      price: z.string(),
      quantity: z.number().min(1),
      selectedSize: z.string().optional(),
    })),
  })).mutation(async ({ input }) => {
    const subtotal = input.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const deliveryFee = input.needsDelivery ? 50 : 0;
    const total = subtotal + deliveryFee;

    const order = await createOrder({
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      needsDelivery: input.needsDelivery,
      deliveryAddress: input.deliveryAddress,
      deliveryCity: input.deliveryCity,
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
      source: input.source,
      notes: input.notes,
    }, input.items);

    return order;
  }),

  weeklySummary: adminProcedure.query(async () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);

    const current = await getOrderSummary(weekStart, now);
    const previous = await getOrderSummary(prevWeekStart, weekStart);
    return { current, previous, period: "weekly" };
  }),

  monthlySummary: adminProcedure.query(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const current = await getOrderSummary(monthStart, now);
    const previous = await getOrderSummary(prevMonthStart, prevMonthEnd);
    return { current, previous, period: "monthly" };
  }),

  allProducts: adminProcedure.query(async () => {
    return getProducts({ limit: 200 });
  }),

  allUsers: adminProcedure.query(async () => {
    return getAllUsers();
  }),

  upsertProduct: adminProcedure.input(z.object({
    slug: z.string(),
    name: z.string(),
    description: z.string().optional(),
    price: z.string(),
    originalPrice: z.string().optional(),
    categoryId: z.number(),
    imageUrl: z.string(),
    images: z.string().optional(),
    sizes: z.string().optional(),
    colors: z.string().optional(),
    brand: z.string().optional(),
    condition: z.enum(["new", "like_new", "good", "fair"]).optional(),
    inStock: z.boolean().optional(),
    stockCount: z.number().optional(),
    featured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    tags: z.string().optional(),
  })).mutation(async ({ input }) => {
    await upsertProduct(input as any);
    return { success: true };
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  products: productsRouter,
  categories: categoriesRouter,
  cart: cartRouter,
  orders: ordersRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
