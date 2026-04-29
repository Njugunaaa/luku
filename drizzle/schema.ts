import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
};

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const genderEnum = pgEnum("gender", ["men", "women", "unisex"]);
export const productConditionEnum = pgEnum("productcondition", [
  "new",
  "like_new",
  "good",
  "fair",
]);
export const orderStatusEnum = pgEnum("status", [
  "pending",
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("paymentStatus", [
  "unpaid",
  "paid",
  "refunded",
]);
export const orderSourceEnum = pgEnum("source", ["website", "whatsapp", "manual"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  gender: genderEnum("gender").default("unisex"),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamps.createdAt,
});

export type Category = typeof categories.$inferSelect;

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull().unique(),
    name: varchar("name", { length: 256 }).notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    originalPrice: numeric("originalPrice", { precision: 10, scale: 2 }),
    categoryId: integer("categoryId").notNull(),
    imageUrl: text("imageUrl").notNull(),
    images: text("images"),
    sizes: text("sizes"),
    colors: text("colors"),
    brand: varchar("brand", { length: 128 }),
    productcondition: productConditionEnum("productcondition").default("like_new"),
    inStock: boolean("inStock").default(true).notNull(),
    stockCount: integer("stockCount").default(1),
    featured: boolean("featured").default(false),
    isNew: boolean("isNew").default(false),
    tags: text("tags"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (table) => ({
    categoryIdx: index("products_category_id_idx").on(table.categoryId),
  }),
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const cartItems = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId"),
    guestId: varchar("guestId", { length: 64 }),
    productId: integer("productId").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    selectedSize: varchar("selectedSize", { length: 32 }),
    selectedColor: varchar("selectedColor", { length: 64 }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (table) => ({
    userIdx: index("cart_items_user_id_idx").on(table.userId),
    guestIdx: index("cart_items_guest_id_idx").on(table.guestId),
    productIdx: index("cart_items_product_id_idx").on(table.productId),
  }),
);

export type CartItem = typeof cartItems.$inferSelect;

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
    userId: integer("userId"),
    guestId: varchar("guestId", { length: 64 }),
    customerName: varchar("customerName", { length: 256 }).notNull(),
    customerEmail: varchar("customerEmail", { length: 320 }),
    customerPhone: varchar("customerPhone", { length: 32 }),
    needsDelivery: boolean("needsDelivery").default(false),
    deliveryAddress: text("deliveryAddress"),
    deliveryCity: varchar("deliveryCity", { length: 128 }),
    deliveryNotes: text("deliveryNotes"),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    deliveryFee: numeric("deliveryFee", { precision: 10, scale: 2 }).default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    status: orderStatusEnum("status").default("pending").notNull(),
    paymentStatus: paymentStatusEnum("paymentStatus").default("unpaid").notNull(),
    source: orderSourceEnum("source").default("website").notNull(),
    notes: text("notes"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (table) => ({
    userIdx: index("orders_user_id_idx").on(table.userId),
    guestIdx: index("orders_guest_id_idx").on(table.guestId),
    statusIdx: index("orders_status_idx").on(table.status),
  }),
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("orderId").notNull(),
    productId: integer("productId"),
    productName: varchar("productName", { length: 256 }).notNull(),
    productImage: text("productImage"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    selectedSize: varchar("selectedSize", { length: 32 }),
    selectedColor: varchar("selectedColor", { length: 64 }),
    createdAt: timestamps.createdAt,
  },
  (table) => ({
    orderIdx: index("order_items_order_id_idx").on(table.orderId),
    productIdx: index("order_items_product_id_idx").on(table.productId),
  }),
);

export type OrderItem = typeof orderItems.$inferSelect;
