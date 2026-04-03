# Alivella Boutique Codebase Architecture Guide

This guide explains how the Alivella Boutique codebase is organized and how different parts work together.

---

## Part 1: High-Level Architecture

Alivella Boutique uses a **full-stack architecture** with three main layers:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  - User interface (pages, components)                   │
│  - Runs in the browser                                  │
│  - Communicates with backend via tRPC                   │
└─────────────────────────────────────────────────────────┘
                          ↕ (tRPC API calls)
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Express)                     │
│  - Business logic (tRPC routers)                        │
│  - Database queries                                     │
│  - Authentication & authorization                       │
│  - Runs on Node.js server                               │
└─────────────────────────────────────────────────────────┘
                          ↕ (SQL queries)
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (MySQL)                       │
│  - Stores all data (products, users, orders)            │
│  - Runs on database server                              │
└─────────────────────────────────────────────────────────┘
```

---

## Part 2: Frontend Structure

The frontend is a React application that runs in the browser.

### 2.1 Pages (User-Facing Screens)

Each file in `client/src/pages/` is a complete page:

| File | Purpose | Route |
|------|---------|-------|
| `Home.tsx` | Homepage with hero, carousel, categories | `/` |
| `Category.tsx` | Product listing for a category | `/category/:slug` |
| `ProductDetail.tsx` | Single product page | `/product/:slug` |
| `Cart.tsx` | Shopping cart | `/cart` |
| `Checkout.tsx` | Order checkout form | `/checkout` |
| `AccountOrders.tsx` | User's order history | `/account/orders` |
| `Admin.tsx` | Admin dashboard | `/admin` |
| `NotFound.tsx` | 404 page | `*` (any unmatched route) |

**How pages work:**

```tsx
// Example: ProductDetail.tsx
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";

export default function ProductDetail() {
  const { slug } = useParams();
  
  // Fetch product from backend
  const { data: product } = trpc.products.bySlug.useQuery({ slug });
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* Add to cart button, WhatsApp button, etc. */}
    </div>
  );
}
```

### 2.2 Components (Reusable UI Pieces)

Components in `client/src/components/` are reused across pages:

| Component | What It Does |
|-----------|-------------|
| `Header.tsx` | Navigation bar at top of every page |
| `Footer.tsx` | Footer at bottom of every page |
| `ProductCard.tsx` | Card showing one product (used in grids) |
| `ui/button.tsx` | Reusable button component |
| `ui/card.tsx` | Reusable card container |
| `ui/input.tsx` | Reusable text input |
| `ui/dialog.tsx` | Modal popup |

**How components work:**

```tsx
// ProductCard.tsx - reusable component
export default function ProductCard({ product }) {
  return (
    <div className="border rounded-lg p-4">
      <img src={product.imageUrl} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={() => addToCart(product)}>Add to Cart</button>
    </div>
  );
}

// Category.tsx - uses ProductCard
export default function Category() {
  const { data: products } = trpc.products.list.useQuery();
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### 2.3 Contexts (Global State)

`client/src/contexts/CartContext.tsx` manages the shopping cart globally:

```tsx
// Any component can access cart
import { useCart } from "@/contexts/CartContext";

export default function MyComponent() {
  const { items, addItem, removeItem, subtotal } = useCart();
  
  return (
    <div>
      <p>Cart has {items.length} items</p>
      <p>Total: ${subtotal}</p>
    </div>
  );
}
```

### 2.4 Styling

`client/src/index.css` contains:

- **CSS Variables** for theme colors:
  ```css
  :root {
    --primary: oklch(0.18 0.015 60);    /* Dark charcoal */
    --accent: oklch(0.73 0.2 70);       /* Gold */
  }
  ```

- **Tailwind CSS** utility classes:
  ```tsx
  <div className="bg-primary text-primary-foreground p-4 rounded-lg">
    Styled with Tailwind
  </div>
  ```

---

## Part 3: Backend Structure

The backend is an Express server that handles all business logic.

### 3.1 tRPC Routers (`server/routers.ts`)

tRPC is a framework for building type-safe APIs. Instead of REST endpoints, you define "procedures":

```ts
// server/routers.ts
export const appRouter = router({
  // Public procedure (anyone can call)
  products: router({
    list: publicProcedure
      .input(z.object({ categoryId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getProducts(input.categoryId);
      }),
  }),
  
  // Protected procedure (only logged-in users)
  cart: router({
    add: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.addToCart(ctx.user.id, input.productId, input.quantity);
      }),
  }),
  
  // Admin-only procedure
  admin: router({
    allOrders: adminProcedure
      .query(async () => {
        return db.getAllOrders();
      }),
  }),
});
```

**Key concepts:**

| Term | Meaning |
|------|---------|
| `publicProcedure` | Anyone can call (no login required) |
| `protectedProcedure` | Only logged-in users can call |
| `adminProcedure` | Only admins can call |
| `.query()` | Read-only operation (like GET) |
| `.mutation()` | Write operation (like POST/PUT/DELETE) |
| `ctx` | Context object with `ctx.user` (current user) |

### 3.2 Database Queries (`server/db.ts`)

Database helpers that actually fetch/store data:

```ts
// server/db.ts
export async function getProducts(categoryId?: number) {
  const db = await getDb();
  return db.select().from(products)
    .where(categoryId ? eq(products.categoryId, categoryId) : undefined);
}

export async function createOrder(userId: number, items: OrderItem[]) {
  const db = await getDb();
  const order = await db.insert(orders).values({
    userId,
    total: calculateTotal(items),
    status: "pending",
  });
  return order;
}
```

### 3.3 How Frontend Calls Backend

The frontend uses tRPC hooks to call backend procedures:

```tsx
// Frontend (client/src/pages/Home.tsx)
import { trpc } from "@/lib/trpc";

export default function Home() {
  // Query (read)
  const { data: products, isLoading } = trpc.products.list.useQuery({});
  
  // Mutation (write)
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
    },
  });
  
  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {products?.map(p => (
        <button onClick={() => addToCart.mutate({ productId: p.id, quantity: 1 })}>
          Add {p.name}
        </button>
      ))}
    </div>
  );
}
```

---

## Part 4: Database Schema

The database has 6 main tables:

### 4.1 Users Table

Stores user accounts:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE,          -- Manus OAuth ID
  name TEXT,
  email VARCHAR(320),
  role ENUM('user', 'admin'),         -- Access level
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Categories Table

Product categories:

```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(100) UNIQUE,           -- URL-friendly name
  name VARCHAR(255),                  -- Display name
  description TEXT,
  gender ENUM('men', 'women', 'unisex'),
  sortOrder INT
);
```

**Example rows:**
- `mens-collection` → Men's Collection
- `womens-collection` → Women's Collection
- `shoes` → Shoes
- `accessories` → Accessories
- `official-wear` → Official Wear

### 4.3 Products Table

Individual items for sale:

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(100) UNIQUE,           -- URL: /product/vintage-jacket
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),               -- e.g., 2500.00
  originalPrice DECIMAL(10, 2),       -- For discounts
  categoryId INT,                     -- Foreign key to categories
  imageUrl VARCHAR(500),
  brand VARCHAR(100),
  condition ENUM('like_new', 'excellent', 'good', 'fair'),
  inStock BOOLEAN,
  stockCount INT,
  featured BOOLEAN,                   -- Show on homepage
  createdAt TIMESTAMP DEFAULT NOW()
);
```

**Example row:**
```
id: 1
name: "Vintage Levi's 501 Jacket"
price: 2500.00
categoryId: 1 (Men's Collection)
brand: "Levi's"
condition: "like_new"
inStock: true
featured: true
```

### 4.4 CartItems Table

Items in user's shopping cart:

```sql
CREATE TABLE cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,                         -- Foreign key to users
  productId INT,                      -- Foreign key to products
  quantity INT,
  selectedSize VARCHAR(10),           -- e.g., "M", "L"
  selectedColor VARCHAR(50),          -- e.g., "Black"
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### 4.5 Orders Table

Customer orders:

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderNumber VARCHAR(50) UNIQUE,     -- e.g., "LK-001-2024"
  userId INT,                         -- Foreign key to users
  status ENUM('pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
  paymentStatus ENUM('unpaid', 'paid'),
  total DECIMAL(10, 2),
  customerName VARCHAR(255),
  customerEmail VARCHAR(320),
  customerPhone VARCHAR(20),
  needsDelivery BOOLEAN,
  deliveryAddress TEXT,
  deliveryCity VARCHAR(100),
  deliveryFee DECIMAL(10, 2),
  deliveryNotes TEXT,
  source ENUM('website', 'whatsapp', 'manual'),  -- How order was placed
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### 4.6 OrderItems Table

Individual products in an order:

```sql
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT,                        -- Foreign key to orders
  productId INT,                      -- Foreign key to products
  productName VARCHAR(255),           -- Snapshot of product name
  price DECIMAL(10, 2),               -- Price at time of order
  quantity INT,
  selectedSize VARCHAR(10),
  selectedColor VARCHAR(50)
);
```

---

## Part 5: Authentication Flow

How users log in and stay logged in:

```
1. User clicks "Sign In" button
   ↓
2. Redirected to Manus OAuth login page
   ↓
3. User enters credentials
   ↓
4. Manus redirects back to /api/oauth/callback
   ↓
5. Backend receives OAuth token, creates/updates user in database
   ↓
6. Backend sets session cookie in browser
   ↓
7. User is logged in! Cookie sent with every request
   ↓
8. Backend verifies cookie, gets user from database
   ↓
9. User can access protected pages (cart, checkout, account)
```

**Code flow:**

```tsx
// Frontend: useAuth hook
const { user, isAuthenticated, logout } = useAuth();

if (!isAuthenticated) {
  return <a href={getLoginUrl()}>Sign In</a>;
}

// Backend: protectedProcedure
const myOrders = protectedProcedure.query(({ ctx }) => {
  // ctx.user is the current logged-in user
  return db.getOrdersByUserId(ctx.user.id);
});
```

---

## Part 6: Adding a New Feature

Let's say you want to add a **Wishlist** feature. Here's the process:

### Step 1: Update Database Schema

Edit `drizzle/schema.ts`:

```ts
export const wishlists = mysqlTable("wishlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

### Step 2: Add Database Queries

Edit `server/db.ts`:

```ts
export async function addToWishlist(userId: number, productId: number) {
  const db = await getDb();
  return db.insert(wishlists).values({ userId, productId });
}

export async function getWishlist(userId: number) {
  const db = await getDb();
  return db.select().from(wishlists).where(eq(wishlists.userId, userId));
}
```

### Step 3: Add tRPC Procedures

Edit `server/routers.ts`:

```ts
wishlist: router({
  add: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(({ ctx, input }) => db.addToWishlist(ctx.user.id, input.productId)),
  
  get: protectedProcedure
    .query(({ ctx }) => db.getWishlist(ctx.user.id)),
}),
```

### Step 4: Use in Frontend

Create `client/src/pages/Wishlist.tsx`:

```tsx
import { trpc } from "@/lib/trpc";

export default function Wishlist() {
  const { data: items } = trpc.wishlist.get.useQuery();
  
  return (
    <div>
      <h1>My Wishlist</h1>
      {items?.map(item => (
        <div key={item.id}>{item.productName}</div>
      ))}
    </div>
  );
}
```

### Step 5: Run Migrations

```bash
pnpm db:push
```

### Step 6: Test

```bash
pnpm test
```

---

## Part 7: Common Patterns

### 7.1 Loading States

```tsx
const { data, isLoading, error } = trpc.products.list.useQuery();

if (isLoading) return <p>Loading...</p>;
if (error) return <p>Error: {error.message}</p>;
if (!data?.length) return <p>No products found</p>;

return <div>{/* render data */}</div>;
```

### 7.2 Mutations with Optimistic Updates

```tsx
const updateOrder = trpc.admin.updateOrderStatus.useMutation({
  onMutate: async (newData) => {
    // Optimistically update UI before server responds
    await utils.admin.allOrders.cancel();
    const previous = utils.admin.allOrders.getData();
    
    utils.admin.allOrders.setData({}, (old) => 
      old?.map(o => o.id === newData.orderId ? { ...o, status: newData.status } : o)
    );
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback if error
    utils.admin.allOrders.setData({}, context?.previous);
  },
  onSuccess: () => {
    // Refetch from server
    utils.admin.allOrders.invalidate();
  },
});
```

### 7.3 Form Submission

```tsx
const [form, setForm] = useState({ name: "", email: "" });

const submit = trpc.orders.create.useMutation({
  onSuccess: () => {
    toast.success("Order placed!");
    navigate("/account/orders");
  },
  onError: (err) => {
    toast.error(err.message);
  },
});

const handleSubmit = (e) => {
  e.preventDefault();
  submit.mutate(form);
};

return (
  <form onSubmit={handleSubmit}>
    <input 
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
    />
    <button disabled={submit.isPending}>
      {submit.isPending ? "Submitting..." : "Submit"}
    </button>
  </form>
);
```

---

## Part 8: File Naming Conventions

| Type | Location | Naming |
|------|----------|--------|
| Page | `client/src/pages/` | PascalCase (e.g., `ProductDetail.tsx`) |
| Component | `client/src/components/` | PascalCase (e.g., `ProductCard.tsx`) |
| Hook | `client/src/hooks/` | camelCase with `use` prefix (e.g., `useCart.ts`) |
| Context | `client/src/contexts/` | PascalCase (e.g., `CartContext.tsx`) |
| Type | `shared/types.ts` | PascalCase (e.g., `Product`, `Order`) |
| Utility | `client/src/lib/` | camelCase (e.g., `trpc.ts`) |

---

## Part 9: Debugging Tips

### 9.1 Frontend Debugging

```tsx
// Log data in component
const { data } = trpc.products.list.useQuery();
console.log("Products:", data);

// Use React DevTools browser extension
// Inspect component props and state

// Use VS Code debugger
// Set breakpoints and step through code
```

### 9.2 Backend Debugging

```ts
// Log in tRPC procedure
export const list = publicProcedure.query(async () => {
  console.log("Fetching products...");
  const products = await db.getProducts();
  console.log("Found:", products.length);
  return products;
});

// Check server logs in terminal
// Look for [error], [warn], [info] messages
```

### 9.3 Database Debugging

```bash
# Connect to MySQL
mysql -u root -p

# View data
USE Alivella Boutique;
SELECT * FROM products LIMIT 5;
SELECT * FROM orders WHERE userId = 1;

# Check table structure
DESCRIBE products;
```

---

## Part 10: Performance Tips

### 10.1 Optimize Queries

```ts
// ❌ Bad: Fetches all products
const products = await db.select().from(products);

// ✅ Good: Fetches only needed fields
const products = await db.select({
  id: products.id,
  name: products.name,
  price: products.price,
}).from(products);
```

### 10.2 Cache Results

```tsx
// ✅ Good: Caches query result
const { data } = trpc.products.list.useQuery({}, {
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});
```

### 10.3 Lazy Load Images

```tsx
// ✅ Good: Images load only when visible
<img src={product.imageUrl} loading="lazy" />
```

---

You now understand how Alivella Boutique is built! Start with the local setup guide, then explore the codebase.
