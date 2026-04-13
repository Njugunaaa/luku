import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  cartItems,
  categories,
  orderItems,
  orders,
  products,
  users,
} from "../drizzle/schema";
import type { InsertOrder, InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  } catch (err) {
    console.error("[Database] getUserByEmail failed", { email }, err);
    // re‑throw so caller can decide how to handle it
    throw err;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function upsertCategory(data: {
  slug: string; name: string; description?: string; imageUrl?: string;
  gender?: "men" | "women" | "unisex"; sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(categories).values(data).onDuplicateKeyUpdate({ set: { name: data.name, description: data.description, imageUrl: data.imageUrl } });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(opts: {
  categoryId?: number; featured?: boolean; search?: string;
  limit?: number; offset?: number; inStock?: boolean;
} = {}) {
  const db = await getDb();
  if (!db) return [];

  const productconditions = [];
  if (opts.categoryId) productconditions.push(eq(products.categoryId, opts.categoryId));
  if (opts.featured !== undefined) productconditions.push(eq(products.featured, opts.featured));
  if (opts.inStock !== undefined) productconditions.push(eq(products.inStock, opts.inStock));
  if (opts.search) {
    productconditions.push(or(
      like(products.name, `%${opts.search}%`),
      like(products.description, `%${opts.search}%`),
      like(products.brand, `%${opts.search}%`)
    ));
  }

  const query = db.select().from(products);
  if (productconditions.length > 0) query.where(and(...productconditions));
  query.orderBy(desc(products.createdAt));
  if (opts.limit) query.limit(opts.limit);
  if (opts.offset) query.offset(opts.offset);

  return query;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0];
}

export async function upsertProduct(data: typeof products.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(products).values(data).onDuplicateKeyUpdate({
    set: {
      name: data.name,
      description: data.description,
      price: data.price,
      originalPrice: data.originalPrice,
      categoryId: data.categoryId,
      imageUrl: data.imageUrl,
      images: data.images,
      sizes: data.sizes,
      colors: data.colors,
      brand: data.brand,
      productcondition: data.productcondition,
      inStock: data.inStock,
      stockCount: data.stockCount,
      featured: data.featured,
      isNew: data.isNew,
      tags: data.tags,
      updatedAt: new Date(),
    }
  });
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: cartItems.id,
    userId: cartItems.userId,
    productId: cartItems.productId,
    quantity: cartItems.quantity,
    selectedSize: cartItems.selectedSize,
    selectedColor: cartItems.selectedColor,
    createdAt: cartItems.createdAt,
    product: {
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: products.imageUrl,
      slug: products.slug,
      inStock: products.inStock,
    }
  }).from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
}

export async function addToCart(data: { userId: number; productId: number; quantity: number; selectedSize?: string; selectedColor?: string }) {
  const db = await getDb();
  if (!db) return;
  // Check if item already exists
  const existing = await db.select().from(cartItems)
    .where(and(
      eq(cartItems.userId, data.userId),
      eq(cartItems.productId, data.productId),
      data.selectedSize ? eq(cartItems.selectedSize, data.selectedSize) : sql`cart_items.selectedSize IS NULL`,
    )).limit(1);

  if (existing.length > 0) {
    await db.update(cartItems)
      .set({ quantity: existing[0]!.quantity + data.quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, existing[0]!.id));
  } else {
    await db.insert(cartItems).values(data);
  }
}

export async function updateCartItem(id: number, userId: number, quantity: number) {
  const db = await getDb();
  if (!db) return;
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  } else {
    await db.update(cartItems).set({ quantity, updatedAt: new Date() }).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  }
}

export async function removeCartItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LK-${ts}-${rand}`;
}

export async function createOrder(data: Omit<InsertOrder, 'orderNumber'>, items: Array<{
  productId?: number; productName: string; productImage?: string;
  price: string; quantity: number; selectedSize?: string; selectedColor?: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orderNumber = generateOrderNumber();
  await db.insert(orders).values({ ...data, orderNumber });

  const inserted = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  const order = inserted[0];
  if (!order) throw new Error("Failed to create order");

  if (items.length > 0) {
    await db.insert(orderItems).values(items.map(item => ({ ...item, orderId: order.id })));
  }

  return order;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderWithItems(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const order = await getOrderById(id);
  if (!order) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...order, items };
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  const result = [];
  for (const order of userOrders) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    result.push({ ...order, items });
  }
  return result;
}

export async function getAllOrders(opts: { status?: string; limit?: number; offset?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const productconditions = [];
  if (opts.status) productconditions.push(eq(orders.status, opts.status as any));
  const query = db.select().from(orders);
  if (productconditions.length > 0) query.where(and(...productconditions));
  query.orderBy(desc(orders.createdAt));
  if (opts.limit) query.limit(opts.limit);
  if (opts.offset) query.offset(opts.offset);
  return query;
}

export async function updateOrderStatus(id: number, status: string, paymentStatus?: string, notes?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (notes !== undefined) updateData.notes = notes;
  await db.update(orders).set(updateData as any).where(eq(orders.id, id));
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.delete(orders).where(eq(orders.id, id));
}

export async function getOrderSummary(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { totalOrders: 0, totalRevenue: 0, paidOrders: 0, pendingOrders: 0, deliveredOrders: 0 };

  const periodOrders = await db.select().from(orders)
    .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

  const totalOrders = periodOrders.length;
  const totalRevenue = periodOrders.reduce((sum, o) => sum + parseFloat(String(o.total)), 0);
  const paidOrders = periodOrders.filter(o => o.paymentStatus === "paid").length;
  const pendingOrders = periodOrders.filter(o => o.status === "pending").length;
  const deliveredOrders = periodOrders.filter(o => o.status === "delivered").length;

  return { totalOrders, totalRevenue, paidOrders, pendingOrders, deliveredOrders };
}
export { users, products, orders, orderItems, cartItems, categories };
