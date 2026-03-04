# Luku - Local Development Setup Guide

This guide walks you through running the Luku thrift store locally from scratch.

---

## Prerequisites

Ensure the following are installed on your machine:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| pnpm | 10+ | `npm install -g pnpm` |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/ |

---

## Step 1 — Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd luku
pnpm install
```

---

## Step 2 — Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=mysql://root:yourpassword@localhost:3306/luku

# Auth (Manus OAuth - leave as-is for local dev)
JWT_SECRET=your-random-secret-here
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name

# Optional: S3 for file storage
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=...
# S3_BUCKET=...
```

> **Note:** For a quick local test without Manus OAuth, you can use the built-in dev server which auto-injects a test user.

---

## Step 3 — Create the Database

```bash
mysql -u root -p
CREATE DATABASE luku CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

---

## Step 4 — Run Database Migrations

```bash
pnpm db:push
```

This generates and applies all schema migrations. You should see:
```
6 tables
✓ migrations applied successfully!
```

---

## Step 5 — Seed the Database

```bash
node scripts/seed.mjs
```

This inserts:
- **5 categories**: Men's Collection, Women's Collection, Shoes, Accessories, Official Wear
- **35 products**: Designer shirts, dresses, boots, sweaters, suits, accessories, and more

---

## Step 6 — Start the Development Server

```bash
pnpm dev
```

The app will be available at: **http://localhost:3000**

---

## Step 7 — Set Up Admin Access

After signing in for the first time, promote your user to admin via SQL:

```sql
USE luku;
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Then navigate to **http://localhost:3000/admin** to access the admin dashboard.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (hot reload) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run all vitest tests |
| `pnpm db:push` | Generate and apply DB migrations |
| `node scripts/seed.mjs` | Seed product catalog |

---

## Project Structure

```
luku/
├── client/src/
│   ├── pages/          # Route pages (Home, Category, ProductDetail, Cart, Checkout, Admin...)
│   ├── components/     # Reusable components (Header, Footer, ProductCard...)
│   ├── contexts/       # CartContext
│   └── lib/trpc.ts     # tRPC client
├── server/
│   ├── routers.ts      # All tRPC procedures
│   ├── db.ts           # Database query helpers
│   └── luku.test.ts    # Vitest tests (31 tests)
├── drizzle/
│   └── schema.ts       # Database schema
└── scripts/
    └── seed.mjs        # Product seeding script
```

---

## Key Features

### For Users
- Browse 5 categories: Men, Women, Shoes, Accessories, Official Wear
- View product details with size/color selection
- Add to cart and checkout with delivery address
- Order on WhatsApp directly from any product page
- View order history in account

### For Admins
Navigate to `/admin` after signing in with an admin account:
- **Overview** — Total orders, revenue, paid orders at a glance
- **Orders** — View all orders, update status (pending → confirmed → paid → shipped → delivered)
- **Manual Entry** — Record orders placed via WhatsApp
- **Reports** — Weekly and monthly revenue charts and order statistics

---

## WhatsApp Configuration

To enable WhatsApp ordering, update the phone number in:

```
client/src/pages/ProductDetail.tsx
```

Change line:
```ts
const WHATSAPP_NUMBER = "254700000000"; // ← Replace with your number
```

Format: Country code + number, no `+` or spaces (e.g., `254712345678` for Kenya).

---

## Deployment

This project is ready to deploy on the Manus platform. Click the **Publish** button in the Management UI after saving a checkpoint.

For other platforms (Vercel, Railway, Render), ensure:
1. `DATABASE_URL` environment variable is set
2. Run `pnpm db:push` before first deploy
3. Run `node scripts/seed.mjs` to populate products
4. Build command: `pnpm build`
5. Start command: `pnpm start`
