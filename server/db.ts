import {
  and,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DEFAULT_STORE_CATEGORIES } from "@shared/catalog";
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

type DatabaseClient = ReturnType<typeof drizzle>;
type UserCartOwner = { userId: number; guestId?: never };
type GuestCartOwner = { guestId: string; userId?: never };
type CartOwner = UserCartOwner | GuestCartOwner;

let _sql: ReturnType<typeof postgres> | null = null;
let _db: DatabaseClient | null = null;
let _ensureCategoriesPromise: Promise<void> | null = null;

function getConnectionString() {
  return process.env.DATABASE_URL ?? ENV.databaseUrl;
}

function shouldRequireSsl(connectionString: string) {
  return (
    connectionString.includes("sslmode=require") ||
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com") ||
    connectionString.includes("pooler.supabase")
  );
}

export async function getDb() {
  if (_db) {
    return _db;
  }

  const connectionString = getConnectionString();
  if (!connectionString) {
    console.warn("[Database] DATABASE_URL is not configured.");
    return null;
  }

  try {
    _sql = postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 5 : 1,
      idle_timeout: 20,
      connect_timeout: 30,
      prepare: false,
      ssl: shouldRequireSsl(connectionString) ? "require" : undefined,
    });
    _db = drizzle(_sql);
  } catch (error) {
    console.warn("[Database] Failed to connect:", error);
    _db = null;
  }

  return _db;
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeInsertText(value: string | null | undefined) {
  return normalizeText(value);
}

function assertCartOwner(owner: CartOwner): UserCartOwner | GuestCartOwner {
  if ("userId" in owner && typeof owner.userId === "number") {
    return { userId: owner.userId };
  }

  if ("guestId" in owner && owner.guestId?.trim()) {
    return { guestId: owner.guestId.trim() };
  }

  throw new Error("A cart owner is required.");
}

function buildCartOwnerClause(owner: CartOwner) {
  const currentOwner = assertCartOwner(owner);

  if ("userId" in currentOwner && typeof currentOwner.userId === "number") {
    return and(eq(cartItems.userId, currentOwner.userId), isNull(cartItems.guestId));
  }

  return and(eq(cartItems.guestId, currentOwner.guestId), isNull(cartItems.userId));
}

function matchNullableText(
  column: typeof cartItems.selectedSize | typeof cartItems.selectedColor,
  value: string | null | undefined,
) {
  const normalized = normalizeText(value);
  return normalized ? eq(column, normalized) : isNull(column);
}

async function ensureBaseCategories() {
  const db = await getDb();
  if (!db) {
    return;
  }

  if (!_ensureCategoriesPromise) {
    _ensureCategoriesPromise = (async () => {
      for (const category of DEFAULT_STORE_CATEGORIES) {
        await db
          .insert(categories)
          .values(category)
          .onConflictDoNothing({ target: categories.slug });
      }
    })();
  }

  await _ensureCategoriesPromise;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = {
    openId: user.openId,
    name: normalizeInsertText(user.name),
    email: normalizeInsertText(user.email),
    passwordHash: normalizeInsertText(user.passwordHash),
    phone: normalizeInsertText(user.phone),
    loginMethod: normalizeInsertText(user.loginMethod),
    role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
    lastSignedIn: user.lastSignedIn ?? new Date(),
  };

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.openId,
      set: {
        name: values.name,
        email: values.email,
        passwordHash: values.passwordHash,
        phone: values.phone,
        loginMethod: values.loginMethod,
        role: values.role,
        lastSignedIn: values.lastSignedIn,
        updatedAt: new Date(),
      },
    });
}

export async function syncSupabaseUserIdentity(user: {
  openId: string;
  email?: string | null;
  name?: string | null;
  loginMethod?: string | null;
  role?: "user" | "admin";
  lastSignedIn?: Date;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot sync Supabase user: database not available");
    return undefined;
  }

  const normalizedEmail = normalizeInsertText(user.email);
  const normalizedName = normalizeInsertText(user.name);
  const normalizedLoginMethod = normalizeInsertText(user.loginMethod);
  const lastSignedIn = user.lastSignedIn ?? new Date();

  const existingByOpenId = await getUserByOpenId(user.openId);
  const existingByEmail = normalizedEmail ? await getUserByEmail(normalizedEmail) : undefined;
  const existingUser = existingByOpenId ?? existingByEmail;

  const role =
    user.role ??
    existingUser?.role ??
    (normalizedEmail === (process.env.ADMIN_EMAIL?.trim() ?? "")
      ? "admin"
      : undefined) ??
    ((await getAllUsers()).length === 0 ? "admin" : "user");

  if (existingUser) {
    await db
      .update(users)
      .set({
        openId: user.openId,
        email: normalizedEmail ?? existingUser.email,
        name: normalizedName ?? existingUser.name,
        loginMethod: normalizedLoginMethod,
        role,
        lastSignedIn,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser.id));

    return getUserById(existingUser.id);
  }

  await db.insert(users).values({
    openId: user.openId,
    email: normalizedEmail,
    name: normalizedName,
    loginMethod: normalizedLoginMethod,
    role,
    lastSignedIn,
  });

  return getUserByOpenId(user.openId);
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

export async function updateUserPasswordByEmail(email: string, passwordHash: string) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.email, email));
}

export async function updateUserLoginMethodByEmail(email: string, loginMethod: string | null) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(users)
    .set({
      loginMethod: normalizeInsertText(loginMethod),
      updatedAt: new Date(),
    })
    .where(eq(users.email, email));
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];

  await ensureBaseCategories();

  return db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder, categories.name);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  await ensureBaseCategories();

  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function upsertCategory(data: {
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  gender?: "men" | "women" | "unisex";
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(categories)
    .values({
      slug: data.slug,
      name: data.name,
      description: normalizeText(data.description),
      imageUrl: normalizeText(data.imageUrl),
      gender: data.gender ?? "unisex",
      sortOrder: data.sortOrder ?? 0,
    })
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: data.name,
        description: normalizeText(data.description),
        imageUrl: normalizeText(data.imageUrl),
        gender: data.gender ?? "unisex",
        sortOrder: data.sortOrder ?? 0,
      },
    });
}

export async function getProducts(
  opts: {
    categoryId?: number;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    inStock?: boolean;
  } = {},
) {
  const db = await getDb();
  if (!db) return [];

  const productConditions: any[] = [];

  if (opts.categoryId) productConditions.push(eq(products.categoryId, opts.categoryId));
  if (opts.featured !== undefined) productConditions.push(eq(products.featured, opts.featured));
  if (opts.inStock !== undefined) productConditions.push(eq(products.inStock, opts.inStock));

  if (opts.search) {
    const pattern = `%${opts.search}%`;
    productConditions.push(
      or(
        ilike(products.name, pattern),
        ilike(products.description, pattern),
        ilike(products.brand, pattern),
      ),
    );
  }

  let query: any = db.select().from(products);

  if (productConditions.length > 0) {
    query = query.where(and(...productConditions));
  }

  query = query.orderBy(desc(products.createdAt));

  if (opts.limit) query = query.limit(opts.limit);
  if (opts.offset) query = query.offset(opts.offset);

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

  await db
    .insert(products)
    .values({
      ...data,
      description: normalizeText(data.description),
      originalPrice: normalizeInsertText(data.originalPrice),
      images: normalizeText(data.images),
      sizes: normalizeText(data.sizes),
      colors: normalizeText(data.colors),
      brand: normalizeText(data.brand),
      tags: normalizeText(data.tags),
    })
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        name: data.name,
        description: normalizeText(data.description),
        price: data.price,
        originalPrice: normalizeInsertText(data.originalPrice),
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        images: normalizeText(data.images),
        sizes: normalizeText(data.sizes),
        colors: normalizeText(data.colors),
        brand: normalizeText(data.brand),
        productcondition: data.productcondition,
        inStock: data.inStock,
        stockCount: data.stockCount,
        featured: data.featured,
        isNew: data.isNew,
        tags: normalizeText(data.tags),
        updatedAt: new Date(),
      },
    });
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(cartItems).where(eq(cartItems.productId, id));
  await db.delete(products).where(eq(products.id, id));
}

export async function getCartItems(owner: CartOwner) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: cartItems.id,
      userId: cartItems.userId,
      guestId: cartItems.guestId,
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
      },
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(buildCartOwnerClause(owner))
    .orderBy(desc(cartItems.createdAt));
}

export async function addToCart(
  data: CartOwner & {
    productId: number;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
  },
) {
  const db = await getDb();
  if (!db) return;

  const ownerClause = buildCartOwnerClause(data);
  const selectedSize = normalizeText(data.selectedSize);
  const selectedColor = normalizeText(data.selectedColor);

  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(
        ownerClause,
        eq(cartItems.productId, data.productId),
        matchNullableText(cartItems.selectedSize, selectedSize),
        matchNullableText(cartItems.selectedColor, selectedColor),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(cartItems)
      .set({
        quantity: Math.min(10, existing[0]!.quantity + data.quantity),
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existing[0]!.id));
    return;
  }

  await db.insert(cartItems).values({
    userId: "userId" in data ? data.userId : null,
    guestId: "guestId" in data ? data.guestId : null,
    productId: data.productId,
    quantity: data.quantity,
    selectedSize,
    selectedColor,
  });
}

export async function updateCartItem(id: number, owner: CartOwner, quantity: number) {
  const db = await getDb();
  if (!db) return;

  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, id), buildCartOwnerClause(owner)));
    return;
  }

  await db
    .update(cartItems)
    .set({
      quantity: Math.min(10, quantity),
      updatedAt: new Date(),
    })
    .where(and(eq(cartItems.id, id), buildCartOwnerClause(owner)));
}

export async function removeCartItem(id: number, owner: CartOwner) {
  const db = await getDb();
  if (!db) return;

  await db.delete(cartItems).where(and(eq(cartItems.id, id), buildCartOwnerClause(owner)));
}

export async function clearCart(owner: CartOwner) {
  const db = await getDb();
  if (!db) return;

  await db.delete(cartItems).where(buildCartOwnerClause(owner));
}

export async function claimGuestData(guestId: string, userId: number) {
  const db = await getDb();
  if (!db || !guestId?.trim()) return;

  const guestItems = await getCartItems({ guestId });

  for (const item of guestItems) {
    await addToCart({
      userId,
      productId: item.productId,
      quantity: item.quantity,
      selectedSize: item.selectedSize ?? undefined,
      selectedColor: item.selectedColor ?? undefined,
    });
  }

  await clearCart({ guestId });

  await db
    .update(orders)
    .set({
      userId,
      guestId: null,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.guestId, guestId), isNull(orders.userId)));
}

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LK-${ts}-${rand}`;
}

export async function createOrder(
  data: Omit<InsertOrder, "orderNumber">,
  items: Array<{
    productId?: number;
    productName: string;
    productImage?: string;
    price: string;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
  }>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orderNumber = generateOrderNumber();
  const [order] = await db
    .insert(orders)
    .values({
      ...data,
      orderNumber,
      userId: data.userId ?? null,
      guestId: normalizeInsertText(data.guestId),
      customerEmail: normalizeInsertText(data.customerEmail),
      customerPhone: normalizeInsertText(data.customerPhone),
      deliveryAddress: normalizeInsertText(data.deliveryAddress),
      deliveryCity: normalizeInsertText(data.deliveryCity),
      deliveryNotes: normalizeInsertText(data.deliveryNotes),
      notes: normalizeInsertText(data.notes),
    })
    .returning();

  if (!order) {
    throw new Error("Failed to create order");
  }

  if (items.length > 0) {
    await db.insert(orderItems).values(
      items.map((item) => ({
        orderId: order.id,
        productId: item.productId ?? null,
        productName: item.productName,
        productImage: normalizeInsertText(item.productImage),
        price: item.price,
        quantity: item.quantity,
        selectedSize: normalizeInsertText(item.selectedSize),
        selectedColor: normalizeInsertText(item.selectedColor),
      })),
    );
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

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const result: any[] = [];
  for (const order of userOrders) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    result.push({ ...order, items });
  }

  return result;
}

export async function getAllOrders(opts: { status?: string; limit?: number; offset?: number } = {}) {
  const db = await getDb();
  if (!db) return [];

  let query: any = db.select().from(orders);

  if (opts.status) {
    query = query.where(eq(orders.status, opts.status as any));
  }

  query = query.orderBy(desc(orders.createdAt));

  if (opts.limit) query = query.limit(opts.limit);
  if (opts.offset) query = query.offset(opts.offset);

  return query;
}

export async function updateOrderStatus(
  id: number,
  status: string,
  paymentStatus?: string,
  notes?: string,
) {
  const db = await getDb();
  if (!db) return;

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (notes !== undefined) updateData.notes = normalizeText(notes);

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
  if (!db) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      paidOrders: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
    };
  }

  const periodOrders = await db
    .select()
    .from(orders)
    .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

  const totalOrders = periodOrders.length;
  const totalRevenue = periodOrders.reduce(
    (sum, order) => sum + Number.parseFloat(String(order.total)),
    0,
  );
  const paidOrders = periodOrders.filter((order) => order.paymentStatus === "paid").length;
  const pendingOrders = periodOrders.filter((order) => order.status === "pending").length;
  const deliveredOrders = periodOrders.filter((order) => order.status === "delivered").length;

  return { totalOrders, totalRevenue, paidOrders, pendingOrders, deliveredOrders };
}

export { users, products, orders, orderItems, cartItems, categories, sql };
