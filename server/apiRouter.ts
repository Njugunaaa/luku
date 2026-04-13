import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import type { User } from "../drizzle/schema";
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "../shared/_core/errors";
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../shared/const";
import { asyncHandler, parseInput } from "./_core/http";
import { clearSessionCookie, setSessionCookie } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as db from "./db";

type ApiLocals = {
  user: User | null;
};

type ApiResponse<T = unknown> = Response<T, ApiLocals>;

const router = Router();

const ORDER_STATUS_VALUES = [
  "pending",
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const PAYMENT_STATUS_VALUES = ["unpaid", "paid", "refunded"] as const;
const PRODUCT_CONDITION_VALUES = ["new", "like_new", "good", "fair"] as const;
const MANUAL_ORDER_SOURCE_VALUES = ["whatsapp", "manual"] as const;

const orderStatusSchema = z.enum(ORDER_STATUS_VALUES);
const paymentStatusSchema = z.enum(PAYMENT_STATUS_VALUES);
const productConditionSchema = z.enum(PRODUCT_CONDITION_VALUES);
const manualOrderSourceSchema = z.enum(MANUAL_ORDER_SOURCE_VALUES);

const productListSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
  search: z.string().trim().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  inStock: z.boolean().optional(),
});

const authCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = authCredentialsSchema.extend({
  password: z.string().min(6),
  name: z.string().trim().min(1).optional(),
});

const cartAddSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
  selectedSize: z.string().trim().optional(),
  selectedColor: z.string().trim().optional(),
});

const cartUpdateSchema = z.object({
  quantity: z.number().int().min(0).max(10),
});

const websiteOrderSchema = z.object({
  customerName: z.string().trim().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().trim().optional(),
  needsDelivery: z.boolean(),
  deliveryAddress: z.string().trim().optional(),
  deliveryCity: z.string().trim().optional(),
  deliveryNotes: z.string().trim().optional(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      productName: z.string().trim().min(1),
      productImage: z.string().trim().optional(),
      price: z.string().trim().min(1),
      quantity: z.number().int().min(1),
      selectedSize: z.string().trim().optional(),
      selectedColor: z.string().trim().optional(),
    }),
  ).min(1),
});

const manualOrderSchema = z.object({
  customerName: z.string().trim().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().trim().optional(),
  needsDelivery: z.boolean().default(false),
  deliveryAddress: z.string().trim().optional(),
  deliveryCity: z.string().trim().optional(),
  source: manualOrderSourceSchema.default("whatsapp"),
  notes: z.string().trim().optional(),
  items: z.array(
    z.object({
      productId: z.number().int().positive().optional(),
      productName: z.string().trim().min(1),
      productImage: z.string().trim().optional(),
      price: z.string().trim().min(1),
      quantity: z.number().int().min(1),
      selectedSize: z.string().trim().optional(),
    }),
  ).min(1),
});

const orderUpdateSchema = z.object({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  notes: z.string().optional(),
});

const productUpsertSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  price: z.string().trim().min(1),
  originalPrice: z.string().trim().optional(),
  categoryId: z.number().int().positive(),
  imageUrl: z.string().trim().min(1),
  images: z.string().trim().optional(),
  sizes: z.string().trim().optional(),
  colors: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  productcondition: productConditionSchema.optional(),
  inStock: z.boolean().optional(),
  stockCount: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  tags: z.string().trim().optional(),
});

function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function toOptionalNumber(value: unknown) {
  const raw = firstValue(value);
  if (raw === undefined || raw === null || raw === "") return undefined;
  return Number(raw);
}

function toOptionalBoolean(value: unknown) {
  const raw = firstValue(value);
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (raw === true || raw === "true") return true;
  if (raw === false || raw === "false") return false;
  return raw;
}

function sanitizeText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toPublicUser(user: User | null) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

async function loadBcrypt() {
  const mod = await import("bcrypt");
  return mod.default ?? mod;
}

async function attachUser(req: Request, res: ApiResponse, next: () => void) {
  try {
    res.locals.user = await sdk.authenticateRequest(req);
  } catch {
    res.locals.user = null;
  }

  next();
}

function requireUser(res: ApiResponse) {
  if (!res.locals.user) {
    throw UnauthorizedError(UNAUTHED_ERR_MSG);
  }

  return res.locals.user;
}

function requireAdmin(res: ApiResponse) {
  const user = requireUser(res);
  if (user.role !== "admin") {
    throw ForbiddenError(NOT_ADMIN_ERR_MSG);
  }

  return user;
}

router.use(asyncHandler(attachUser));

router.get(
  "/health",
  (_req, res) => {
    res.json({ ok: true });
  },
);

router.get(
  "/auth/me",
  (_req, res: ApiResponse) => {
    res.json(toPublicUser(res.locals.user));
  },
);

router.post(
  "/auth/signup",
  asyncHandler(async (req, res: ApiResponse) => {
    const input = parseInput(signupSchema, req.body);
    const bcrypt = await loadBcrypt();
    const existing = await db.getUserByEmail(input.email);

    if (existing) {
      throw BadRequestError("Email already in use");
    }

    const hash = await bcrypt.hash(input.password, 10);
    const openId = crypto.randomUUID();
    const users = await db.getAllUsers();
    const role =
      users.length === 0 || process.env.ADMIN_EMAIL === input.email ? "admin" : "user";

    await db.upsertUser({
      openId,
      email: input.email,
      name: input.name ?? null,
      passwordHash: hash,
      role,
    } as any);

    const user = await db.getUserByEmail(input.email);
    if (!user) {
      throw BadRequestError("Signup failed");
    }

    const token = await sdk.createSessionToken(user.id);
    setSessionCookie(req, res, token);
    res.status(201).json(toPublicUser(user));
  }),
);

router.post(
  "/auth/login",
  asyncHandler(async (req, res: ApiResponse) => {
    const input = parseInput(authCredentialsSchema, req.body);
    const bcrypt = await loadBcrypt();
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@alivellaboutique.com";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "Password123!";
    const adminName = process.env.ADMIN_NAME ?? "Joshua";

    let user = await db.getUserByEmail(input.email);

    if (input.email === adminEmail && input.password === adminPassword) {
      if (!user) {
        const openId = crypto.randomUUID();
        const hash = await bcrypt.hash(crypto.randomUUID(), 10);
        await db.upsertUser({
          openId,
          email: input.email,
          name: adminName,
          passwordHash: hash,
          role: "admin",
        } as any);
        user = await db.getUserByEmail(input.email);
      } else if (user.role !== "admin") {
        await db.upsertUser({
          ...user,
          role: "admin",
        } as any);
        user = await db.getUserByEmail(input.email);
      }
    } else {
      if (!user || !user.passwordHash) {
        throw UnauthorizedError("Invalid credentials");
      }

      const matches = await bcrypt.compare(input.password, user.passwordHash as string);
      if (!matches) {
        throw UnauthorizedError("Invalid credentials");
      }
    }

    if (!user) {
      throw UnauthorizedError("Invalid credentials");
    }

    const token = await sdk.createSessionToken(user.id);
    setSessionCookie(req, res, token);
    res.json(toPublicUser(user));
  }),
);

router.post(
  "/auth/logout",
  asyncHandler(async (req, res) => {
    clearSessionCookie(req, res);
    res.json({ success: true });
  }),
);

router.get(
  "/products/featured",
  asyncHandler(async (_req, res) => {
    res.json(await db.getProducts({ featured: true, limit: 8 }));
  }),
);

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const input = parseInput(productListSchema, {
      categoryId: toOptionalNumber(req.query.categoryId),
      featured: toOptionalBoolean(req.query.featured),
      search: sanitizeText(firstValue(req.query.search) as string | undefined),
      limit: toOptionalNumber(req.query.limit),
      offset: toOptionalNumber(req.query.offset),
      inStock: toOptionalBoolean(req.query.inStock),
    });

    res.json(await db.getProducts(input));
  }),
);

router.get(
  "/products/slug/:slug",
  asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const product = await db.getProductBySlug(slug);
    if (!product) {
      throw NotFoundError("Product not found");
    }

    res.json(product);
  }),
);

router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    res.json(await db.getAllCategories());
  }),
);

router.get(
  "/categories/:slug",
  asyncHandler(async (req, res) => {
    const category = await db.getCategoryBySlug(req.params.slug);
    if (!category) {
      throw NotFoundError("Category not found");
    }

    res.json(category);
  }),
);

router.get(
  "/cart",
  asyncHandler(async (_req, res: ApiResponse) => {
    const user = requireUser(res);
    res.json(await db.getCartItems(user.id));
  }),
);

router.post(
  "/cart",
  asyncHandler(async (req, res: ApiResponse) => {
    const user = requireUser(res);
    const input = parseInput(cartAddSchema, req.body);
    const product = await db.getProductById(input.productId);

    if (!product) {
      throw NotFoundError("Product not found");
    }

    if (!product.inStock) {
      throw BadRequestError("Product is out of stock");
    }

    await db.addToCart({ userId: user.id, ...input });
    res.status(201).json({ success: true });
  }),
);

router.patch(
  "/cart/:itemId",
  asyncHandler(async (req, res: ApiResponse) => {
    const user = requireUser(res);
    const itemId = Number.parseInt(req.params.itemId, 10);
    if (!Number.isFinite(itemId)) {
      throw BadRequestError("Invalid cart item");
    }

    const input = parseInput(cartUpdateSchema, req.body);
    await db.updateCartItem(itemId, user.id, input.quantity);
    res.json({ success: true });
  }),
);

router.delete(
  "/cart/:itemId",
  asyncHandler(async (req, res: ApiResponse) => {
    const user = requireUser(res);
    const itemId = Number.parseInt(req.params.itemId, 10);
    if (!Number.isFinite(itemId)) {
      throw BadRequestError("Invalid cart item");
    }

    await db.removeCartItem(itemId, user.id);
    res.json({ success: true });
  }),
);

router.delete(
  "/cart",
  asyncHandler(async (_req, res: ApiResponse) => {
    const user = requireUser(res);
    await db.clearCart(user.id);
    res.json({ success: true });
  }),
);

router.post(
  "/orders",
  asyncHandler(async (req, res: ApiResponse) => {
    const user = requireUser(res);
    const input = parseInput(websiteOrderSchema, req.body);
    const subtotal = input.items.reduce(
      (sum, item) => sum + Number.parseFloat(item.price) * item.quantity,
      0,
    );
    const deliveryFee = input.needsDelivery ? 50 : 0;
    const total = subtotal + deliveryFee;

    const order = await db.createOrder(
      {
        userId: user.id,
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
      },
      input.items,
    );

    await db.clearCart(user.id);
    res.status(201).json(order);
  }),
);

router.get(
  "/orders/me",
  asyncHandler(async (_req, res: ApiResponse) => {
    const user = requireUser(res);
    res.json(await db.getOrdersByUserId(user.id));
  }),
);

router.get(
  "/admin/orders",
  asyncHandler(async (req, res: ApiResponse) => {
    requireAdmin(res);
    const input = parseInput(
      z.object({
        status: z.string().trim().optional(),
        limit: z.number().int().min(1).optional(),
        offset: z.number().int().min(0).optional(),
      }),
      {
        status: sanitizeText(firstValue(req.query.status) as string | undefined),
        limit: toOptionalNumber(req.query.limit),
        offset: toOptionalNumber(req.query.offset),
      },
    );

    const orders = await db.getAllOrders(input);
    const result = [];
    for (const order of orders) {
      const full = await db.getOrderWithItems(order.id);
      if (full) result.push(full);
    }

    res.json(result);
  }),
);

router.patch(
  "/admin/orders/:orderId",
  asyncHandler(async (req, res: ApiResponse) => {
    requireAdmin(res);
    const orderId = Number.parseInt(req.params.orderId, 10);
    if (!Number.isFinite(orderId)) {
      throw BadRequestError("Invalid order");
    }

    const input = parseInput(orderUpdateSchema, req.body);
    await db.updateOrderStatus(
      orderId,
      input.status ?? "pending",
      input.paymentStatus,
      input.notes,
    );
    res.json({ success: true });
  }),
);

router.delete(
  "/admin/orders/:orderId",
  asyncHandler(async (req, res: ApiResponse) => {
    requireAdmin(res);
    const orderId = Number.parseInt(req.params.orderId, 10);
    if (!Number.isFinite(orderId)) {
      throw BadRequestError("Invalid order");
    }

    const order = await db.getOrderById(orderId);
    if (!order) {
      throw NotFoundError("Order not found");
    }

    if (order.status !== "pending") {
      throw BadRequestError("Only pending orders can be deleted.");
    }

    await db.deleteOrder(orderId);
    res.json({ success: true });
  }),
);

router.post(
  "/admin/orders/manual",
  asyncHandler(async (req, res: ApiResponse) => {
    requireAdmin(res);
    const input = parseInput(manualOrderSchema, req.body);
    const subtotal = input.items.reduce(
      (sum, item) => sum + Number.parseFloat(item.price) * item.quantity,
      0,
    );
    const deliveryFee = input.needsDelivery ? 50 : 0;
    const total = subtotal + deliveryFee;

    const order = await db.createOrder(
      {
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
      },
      input.items,
    );

    res.status(201).json(order);
  }),
);

router.get(
  "/admin/summary/:period",
  asyncHandler(async (req, res: ApiResponse) => {
    requireAdmin(res);
    const period = parseInput(z.enum(["weekly", "monthly", "yearly"]), req.params.period);
    const now = new Date();

    if (period === "weekly") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(weekStart.getDate() - 7);

      res.json({
        current: await db.getOrderSummary(weekStart, now),
        previous: await db.getOrderSummary(prevWeekStart, weekStart),
        period,
      });
      return;
    }

    if (period === "monthly") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      res.json({
        current: await db.getOrderSummary(monthStart, now),
        previous: await db.getOrderSummary(prevMonthStart, prevMonthEnd),
        period,
      });
      return;
    }

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

    res.json({
      current: await db.getOrderSummary(yearStart, now),
      previous: await db.getOrderSummary(prevYearStart, prevYearEnd),
      period,
    });
  }),
);

router.get(
  "/admin/products",
  asyncHandler(async (_req, res: ApiResponse) => {
    requireAdmin(res);
    res.json(await db.getProducts({ limit: 200 }));
  }),
);

router.post(
  "/admin/products",
  asyncHandler(async (req, res: ApiResponse) => {
    requireAdmin(res);
    const input = parseInput(productUpsertSchema, req.body);
    await db.upsertProduct(input as any);
    res.json({ success: true });
  }),
);

router.get(
  "/admin/users",
  asyncHandler(async (_req, res: ApiResponse) => {
    requireAdmin(res);
    const users = await db.getAllUsers();
    res.json(users.map((user) => toPublicUser(user)));
  }),
);

export { router as apiRouter };
