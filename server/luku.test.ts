import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import bcrypt from "bcrypt";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getAllCategories: vi.fn().mockResolvedValue([
    { id: 1, slug: "mens-collection", name: "Men's Collection", description: "Men's clothes", imageUrl: null, gender: "men", sortOrder: 1, createdAt: new Date() },
    { id: 2, slug: "womens-collection", name: "Women's Collection", description: "Women's clothes", imageUrl: null, gender: "women", sortOrder: 2, createdAt: new Date() },
  ]),
  getCategoryBySlug: vi.fn().mockImplementation((slug: string) => {
    if (slug === "mens-collection") return Promise.resolve({ id: 1, slug: "mens-collection", name: "Men's Collection", description: null, imageUrl: null, gender: "men", sortOrder: 1, createdAt: new Date() });
    return Promise.resolve(undefined);
  }),
  getProducts: vi.fn().mockResolvedValue([
    { id: 1, slug: "test-product", name: "Test Jacket", description: "A test jacket", price: "2500.00", originalPrice: "4000.00", categoryId: 1, imageUrl: "https://example.com/img.jpg", images: null, sizes: '["S","M","L"]', colors: '["Black"]', brand: "TestBrand", productcondition: "like_new", inStock: true, stockCount: 5, featured: true, isNew: true, tags: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getProductById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) return Promise.resolve({ id: 1, slug: "test-product", name: "Test Jacket", description: "A test jacket", price: "2500.00", originalPrice: "4000.00", categoryId: 1, imageUrl: "https://example.com/img.jpg", images: null, sizes: '["S","M","L"]', colors: '["Black"]', brand: "TestBrand", productcondition: "like_new", inStock: true, stockCount: 5, featured: true, isNew: true, tags: null, createdAt: new Date(), updatedAt: new Date() });
    return Promise.resolve(undefined);
  }),
  getProductBySlug: vi.fn().mockImplementation((slug: string) => {
    if (slug === "test-product") return Promise.resolve({ id: 1, slug: "test-product", name: "Test Jacket", description: "A test jacket", price: "2500.00", originalPrice: "4000.00", categoryId: 1, imageUrl: "https://example.com/img.jpg", images: null, sizes: '["S","M","L"]', colors: '["Black"]', brand: "TestBrand", productcondition: "like_new", inStock: true, stockCount: 5, featured: true, isNew: true, tags: null, createdAt: new Date(), updatedAt: new Date() });
    return Promise.resolve(undefined);
  }),
  getCartItems: vi.fn().mockResolvedValue([]),
  addToCart: vi.fn().mockResolvedValue(undefined),
  updateCartItem: vi.fn().mockResolvedValue(undefined),
  removeCartItem: vi.fn().mockResolvedValue(undefined),
  clearCart: vi.fn().mockResolvedValue(undefined),
  createOrder: vi.fn().mockResolvedValue({ id: 100, orderNumber: "LK-TEST-001", status: "pending", paymentStatus: "unpaid", total: "2550.00", createdAt: new Date() }),
  getOrderById: vi.fn().mockResolvedValue(undefined),
  getOrderWithItems: vi.fn().mockResolvedValue(undefined),
  getOrdersByUserId: vi.fn().mockResolvedValue([]),
  getAllOrders: vi.fn().mockResolvedValue([]),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  getOrderSummary: vi.fn().mockResolvedValue({ totalOrders: 5, totalRevenue: 12500, paidOrders: 3, pendingOrders: 2, deliveredOrders: 1 }),
  upsertCategory: vi.fn().mockResolvedValue(undefined),
  upsertProduct: vi.fn().mockResolvedValue(undefined),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserCtx(overrides: Partial<NonNullable<TrpcContext["user"]>> = {}): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "user-open-id",
      name: "Test User",
      email: "user@test.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return createUserCtx({ id: 1, role: "admin", email: "admin@luku.com", name: "Admin" });
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("user");
  });

  it("logout clears session cookie", async () => {
    const ctx = createUserCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect((ctx.res.clearCookie as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  });

  it("signup creates new user and sets cookie", async () => {
    const ctx = createPublicCtx();
    const dummy: any = {};
    ctx.res.cookie = vi.fn((name, val, opts) => { dummy[name] = val; });
    (db.getUserByEmail as any).mockResolvedValue(undefined);
    (db.getAllUsers as any).mockResolvedValue([]);
    (db.upsertUser as any).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(ctx as any);
    const user = await caller.auth.signup({ email: "a@b.com", password: "pass123", name: "foo" });
    expect(user.email).toBe("a@b.com");
    expect(ctx.res.cookie).toHaveBeenCalled();
  });

  it("login succeeds with correct credentials", async () => {
    const ctx = createPublicCtx();
    const dummy: any = {};
    ctx.res.cookie = vi.fn((name, val, opts) => { dummy[name] = val; });
    const fakeUser = { id: 5, email: "a@b.com", passwordHash: "hash" };
    (db.getUserByEmail as any).mockResolvedValue(fakeUser);
    vi.spyOn(bcrypt, "compare").mockResolvedValue(true as any);

    const caller = appRouter.createCaller(ctx as any);
    const user = await caller.auth.login({ email: "a@b.com", password: "pass123" });
    expect(user).toBe(fakeUser);
    expect(ctx.res.cookie).toHaveBeenCalled();
  });

  it("login rejects bad credentials", async () => {
    const ctx = createPublicCtx();
    const caller = appRouter.createCaller(ctx as any);
    (db.getUserByEmail as any).mockResolvedValue(null);
    await expect(caller.auth.login({ email: "no@one", password: "x" })).rejects.toThrow("Invalid credentials");
  });
});

// ─── Categories Tests ─────────────────────────────────────────────────────────
describe("categories", () => {
  it("list returns all categories", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const cats = await caller.categories.list();
    expect(cats).toHaveLength(2);
    expect(cats[0]?.slug).toBe("mens-collection");
  });

  it("bySlug returns category for valid slug", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const cat = await caller.categories.bySlug({ slug: "mens-collection" });
    expect(cat.name).toBe("Men's Collection");
  });

  it("bySlug throws NOT_FOUND for invalid slug", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.categories.bySlug({ slug: "nonexistent" })).rejects.toThrow("Category not found");
  });
});

// ─── Products Tests ───────────────────────────────────────────────────────────
describe("products", () => {
  it("list returns products", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const products = await caller.products.list({});
    expect(products).toHaveLength(1);
    expect(products[0]?.name).toBe("Test Jacket");
  });

  it("bySlug returns product for valid slug", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const product = await caller.products.bySlug({ slug: "test-product" });
    expect(product.name).toBe("Test Jacket");
    expect(product.price).toBe("2500.00");
  });

  it("bySlug throws NOT_FOUND for invalid slug", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.products.bySlug({ slug: "nonexistent" })).rejects.toThrow("Product not found");
  });

  it("byId returns product for valid id", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const product = await caller.products.byId({ id: 1 });
    expect(product.id).toBe(1);
  });

  it("featured returns featured products", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const featured = await caller.products.featured();
    expect(Array.isArray(featured)).toBe(true);
  });
});

// ─── Cart Tests ───────────────────────────────────────────────────────────────
describe("cart", () => {
  it("get requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.cart.get()).rejects.toThrow("Please login");
  });

  it("get returns cart items for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const items = await caller.cart.get();
    expect(Array.isArray(items)).toBe(true);
  });

  it("add requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.cart.add({ productId: 1, quantity: 1 })).rejects.toThrow("Please login");
  });

  it("add adds product to cart for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.cart.add({ productId: 1, quantity: 1, selectedSize: "M" });
    expect(result.success).toBe(true);
  });

  it("add throws NOT_FOUND for invalid product", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.cart.add({ productId: 999, quantity: 1 })).rejects.toThrow("Product not found");
  });

  it("clear clears cart for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.cart.clear();
    expect(result.success).toBe(true);
  });
});

// ─── Orders Tests ─────────────────────────────────────────────────────────────
describe("orders", () => {
  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.orders.create({
      customerName: "Test",
      needsDelivery: false,
      items: [{ productId: 1, productName: "Test Jacket", price: "2500.00", quantity: 1 }],
    })).rejects.toThrow("Please login");
  });

  it("create places order for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const order = await caller.orders.create({
      customerName: "Test User",
      customerEmail: "test@example.com",
      needsDelivery: false,
      items: [{ productId: 1, productName: "Test Jacket", price: "2500.00", quantity: 1 }],
    });
    expect(order).toBeDefined();
    expect(order.orderNumber).toBe("LK-TEST-001");
  });

  it("myOrders returns orders for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const orders = await caller.orders.myOrders();
    expect(Array.isArray(orders)).toBe(true);
  });
});

// ─── Admin Tests ──────────────────────────────────────────────────────────────
describe("admin", () => {
  it("allOrders requires admin role", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.admin.allOrders({})).rejects.toThrow("Admin access required");
  });

  it("allOrders works for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const orders = await caller.admin.allOrders({});
    expect(Array.isArray(orders)).toBe(true);
  });

  it("weeklySummary requires admin role", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.admin.weeklySummary()).rejects.toThrow("Admin access required");
  });

  it("weeklySummary returns summary for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const summary = await caller.admin.weeklySummary();
    expect(summary.current).toBeDefined();
    expect(summary.current.totalOrders).toBe(5);
    expect(summary.current.totalRevenue).toBe(12500);
  });

  it("monthlySummary returns summary for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const summary = await caller.admin.monthlySummary();
    expect(summary.period).toBe("monthly");
    expect(summary.current).toBeDefined();
  });

  it("updateOrderStatus requires admin role", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.admin.updateOrderStatus({ orderId: 1, status: "paid" })).rejects.toThrow("Admin access required");
  });

  it("updateOrderStatus works for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.admin.updateOrderStatus({ orderId: 1, status: "paid", paymentStatus: "paid" });
    expect(result.success).toBe(true);
  });

  it("createManualOrder creates WhatsApp order for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const order = await caller.admin.createManualOrder({
      customerName: "WhatsApp Customer",
      customerPhone: "+254712345678",
      needsDelivery: true,
      deliveryAddress: "123 Nairobi St",
      source: "whatsapp",
      items: [{ productName: "Vintage Jacket", price: "2800.00", quantity: 1 }],
    });
    expect(order).toBeDefined();
  });

  it("allUsers requires admin role", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.admin.allUsers()).rejects.toThrow("Admin access required");
  });

  it("allUsers returns users for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const users = await caller.admin.allUsers();
    expect(Array.isArray(users)).toBe(true);
  });
});
