# Alivella Boutique Local Development Complete Guide

This guide walks you through setting up Alivella Boutique on your local machine step-by-step, from cloning the repository to running the development server.

---

## Part 1: Prerequisites — What You Need to Install

Before starting, ensure your machine has the following tools installed. This section covers Windows, macOS, and Linux.

### 1.1 Node.js and pnpm

**Node.js** is the JavaScript runtime that powers both the frontend and backend. **pnpm** is the package manager (faster than npm).

**Windows:**
1. Download from https://nodejs.org (choose LTS version, e.g., 20.x)
2. Run the installer and follow the prompts
3. Open PowerShell and verify installation:
   ```powershell
   node --version
   npm --version
   ```
4. Install pnpm globally:
   ```powershell
   npm install -g pnpm
   pnpm --version
   ```

**macOS:**
1. If you have Homebrew installed, run:
   ```bash
   brew install node
   ```
2. Install pnpm:
   ```bash
   npm install -g pnpm
   ```
3. Verify:
   ```bash
   node --version
   pnpm --version
   ```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm
npm install -g pnpm
node --version
pnpm --version
```

### 1.2 MySQL Database

Alivella Boutique uses MySQL to store products, users, orders, and cart data.

**Windows:**
1. Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/
2. Run the installer
3. During setup, choose "MySQL Server" and "MySQL Workbench" (GUI tool)
4. Set root password (remember this!)
5. Complete installation
6. Open Command Prompt and verify:
   ```cmd
   mysql --version
   ```

**macOS:**
1. Install via Homebrew:
   ```bash
   brew install mysql
   brew services start mysql
   ```
2. Verify:
   ```bash
   mysql --version
   ```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
sudo systemctl start mysql
mysql --version
```

### 1.3 Git (Optional but Recommended)

To clone the repository from GitHub.

**Windows:** Download from https://git-scm.com

**macOS:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt install git
```

---

## Part 2: Clone the Repository

Navigate to where you want to store the project and clone it from GitHub.

```bash
git clone https://github.com/yourusername/Alivella Boutique.git
cd Alivella Boutique
```

If you don't have Git, download the ZIP from GitHub and extract it.

---

## Part 3: Install Dependencies

Inside the `Alivella Boutique` folder, install all required npm packages:

```bash
pnpm install
```

This reads `package.json` and downloads all dependencies (React, Express, tRPC, Tailwind, etc.). It may take 2-3 minutes.

**What's happening:** pnpm is creating a `node_modules` folder with all the code libraries your project needs.

---

## Part 4: Set Up Environment Variables

Create a `.env` file in the root of the `Alivella Boutique` folder. This file stores sensitive configuration like database credentials.

**Step 1:** In VS Code, right-click the `Alivella Boutique` folder in the Explorer and select "New File"

**Step 2:** Name it `.env` (note the dot at the start)

**Step 3:** Paste the following and fill in your values:

```env
# ─── Database ────────────────────────────────────────────────────────────
DATABASE_URL=mysql://root:yourpassword@localhost:3306/Alivella Boutique

# ─── Authentication (Manus OAuth) ────────────────────────────────────────
JWT_SECRET=your-random-secret-here-make-it-long-and-random
VITE_APP_ID=your-app-id-from-manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name

# ─── Optional: S3 File Storage ───────────────────────────────────────────
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# AWS_REGION=us-east-1
# S3_BUCKET=your-bucket-name
```

**Explanation of each variable:**

| Variable | What It Does | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string to MySQL | `mysql://root:password123@localhost:3306/Alivella Boutique` |
| `JWT_SECRET` | Secret key for signing session tokens | `super-secret-random-string-123` |
| `VITE_APP_ID` | Your Manus OAuth app ID (get from Manus dashboard) | `app_123456` |
| `OWNER_OPEN_ID` | Your unique Manus user ID | `user_abc123` |
| `OWNER_NAME` | Your name (appears as admin) | `John Doe` |

**For local development:** Use `root` as the MySQL username and the password you set during MySQL installation.

---

## Part 5: Create the MySQL Database

Open MySQL and create the `Alivella Boutique` database:

**Windows (Command Prompt):**
```cmd
mysql -u root -p
```

**macOS/Linux (Terminal):**
```bash
mysql -u root -p
```

Enter your MySQL root password when prompted. Then run:

```sql
CREATE DATABASE Alivella Boutique CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**What this does:** Creates a new empty database called `Alivella Boutique` with UTF-8 character support (handles emojis, special characters, etc.).

---

## Part 6: Run Database Migrations

Migrations create the tables (users, products, orders, cart_items, etc.) in your database.

```bash
pnpm db:push
```

**Expected output:**
```
✓ 6 tables created
✓ migrations applied successfully!
```

**What happened:** The schema from `drizzle/schema.ts` was converted into SQL and executed in your MySQL database.

---

## Part 7: Seed the Database with Products

Now populate the database with 35 products across 5 categories:

```bash
node scripts/seed.mjs
```

**Expected output:**
```
✓ 5 categories created
✓ 35 products seeded successfully!
```

**What's in the database now:**
- **Men's Collection**: Levi's jackets, Ralph Lauren polos, Supreme hoodies
- **Women's Collection**: Silk dresses, vintage blouses, designer co-ords
- **Shoes**: Chelsea boots, Timberlands, vintage sneakers
- **Accessories**: Designer hats, leather belts, vintage bags
- **Official Wear**: Men's suits, women's trousers, formal skirts

---

## Part 8: Start the Development Server

```bash
pnpm dev
```

**Expected output:**
```
[vite] ✓ client built in 2.5s
[express] Server running on http://localhost:3000/
```

Open your browser and go to: **http://localhost:3000**

You should see the Alivella Boutique homepage with the hero section, category grid, and card stack carousel.

---

## Part 9: Understanding the Project Structure

Once the server is running, familiarize yourself with the codebase:

```
Alivella Boutique/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx          ← Homepage with hero & carousel
│   │   │   ├── Category.tsx       ← Product listing page
│   │   │   ├── ProductDetail.tsx  ← Single product page
│   │   │   ├── Cart.tsx           ← Shopping cart
│   │   │   ├── Checkout.tsx       ← Order checkout
│   │   │   ├── AccountOrders.tsx  ← User order history
│   │   │   └── Admin.tsx          ← Admin dashboard
│   │   ├── components/
│   │   │   ├── Header.tsx         ← Navigation bar
│   │   │   ├── Footer.tsx         ← Footer
│   │   │   ├── ProductCard.tsx    ← Reusable product card
│   │   │   └── ui/               ← shadcn/ui components
│   │   ├── contexts/
│   │   │   └── CartContext.tsx    ← Global cart state
│   │   ├── lib/
│   │   │   └── trpc.ts           ← tRPC client setup
│   │   ├── App.tsx               ← Routes & layout
│   │   └── index.css             ← Global styles & theme
│   ├── index.html                ← HTML entry point
│   └── vite.config.ts            ← Vite bundler config
├── server/
│   ├── routers.ts                ← All API endpoints (tRPC)
│   ├── db.ts                     ← Database queries
│   ├── Alivella Boutique.test.ts              ← 31 vitest tests
│   └── _core/                    ← Framework internals
├── drizzle/
│   ├── schema.ts                 ← Database table definitions
│   └── migrations/               ← Auto-generated SQL migrations
├── scripts/
│   └── seed.mjs                  ← Product seeding script
├── package.json                  ← Dependencies & scripts
├── .env                          ← Your environment variables
└── README.local.md               ← This file
```

---

## Part 10: Making Your First Changes

Let's test that everything works by making a small change:

**Step 1:** Open `client/src/pages/Home.tsx`

**Step 2:** Find the line that says:
```tsx
<span className="text-accent">Story.</span>
```

**Step 3:** Change it to:
```tsx
<span className="text-accent">Your Story.</span>
```

**Step 4:** Save the file (Ctrl+S / Cmd+S)

**Step 5:** Look at your browser — it should automatically update without restarting!

This is **Hot Module Replacement (HMR)** — a feature that reloads code changes instantly.

---

## Part 11: Admin Access

To access the admin dashboard at `/admin`, you need to be an admin user.

**Step 1:** Sign in with your Manus account at http://localhost:3000

**Step 2:** Open MySQL and promote yourself to admin:

```bash
mysql -u root -p
```

Then:
```sql
USE Alivella Boutique;
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
EXIT;
```

**Step 3:** Refresh the browser and navigate to `/admin`

You'll see:
- **Overview** — Total orders, revenue, paid orders
- **Orders** — All orders with status management
- **Manual Entry** — Add WhatsApp orders manually
- **Reports** — Weekly/monthly revenue charts

---

## Part 12: Common Commands

Keep these commands handy:

| Command | What It Does |
|---------|-------------|
| `pnpm dev` | Start dev server (http://localhost:3000) |
| `pnpm test` | Run all 31 vitest tests |
| `pnpm db:push` | Apply database migrations |
| `node scripts/seed.mjs` | Seed products again |
| `pnpm build` | Build for production |
| `pnpm format` | Auto-format code |

---

## Part 13: Troubleshooting

### "Cannot find module" error
**Solution:** Run `pnpm install` again to ensure all dependencies are installed.

### "Connection refused" when starting server
**Solution:** Make sure MySQL is running:
- **Windows:** Open Services and check MySQL is running
- **macOS:** Run `brew services start mysql`
- **Linux:** Run `sudo systemctl start mysql`

### Database connection error
**Solution:** Check your `DATABASE_URL` in `.env`:
```env
DATABASE_URL=mysql://root:yourpassword@localhost:3306/Alivella Boutique
```
- Replace `yourpassword` with your actual MySQL root password
- Make sure the database `Alivella Boutique` exists (run Part 5 again if needed)

### Port 3000 already in use
**Solution:** Kill the process using port 3000:
- **Windows:** `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
- **macOS/Linux:** `lsof -i :3000` then `kill -9 <PID>`

Or change the port in `server/_core/index.ts` to 3001.

### Hot reload not working
**Solution:** Restart the dev server:
```bash
# Press Ctrl+C to stop
# Then run again
pnpm dev
```

---

## Part 14: Next Steps

Now that you're running locally, you can:

1. **Customize products** — Edit `scripts/seed.mjs` and run `node scripts/seed.mjs` again
2. **Change the WhatsApp number** — Edit `client/src/pages/ProductDetail.tsx` line with `WHATSAPP_NUMBER`
3. **Modify the theme** — Edit colors in `client/src/index.css` (search for `--primary`, `--accent`)
4. **Add new features** — Follow the "Build Loop" in the README

---

## Part 15: Deployment Checklist

Before deploying to Vercel (covered in next guide), ensure:

- [ ] All tests pass: `pnpm test`
- [ ] No TypeScript errors: `pnpm check`
- [ ] Database migrations applied: `pnpm db:push`
- [ ] Products seeded: `node scripts/seed.mjs`
- [ ] `.env` file is in `.gitignore` (don't commit secrets!)
- [ ] Code is committed to GitHub

---

You're now ready to run Alivella Boutique locally! In the next guide, I'll walk you through deploying to Vercel.
