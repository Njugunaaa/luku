# Alivella Boutique Vercel Deployment Complete Guide

This guide walks you through deploying Alivella Boutique to Vercel, a platform that hosts your app on the internet so anyone can access it.

---

## Part 1: Understanding Vercel

**What is Vercel?** Vercel is a cloud platform that hosts web applications. It automatically builds and deploys your code whenever you push to GitHub.

**Why Vercel?** 
- Free tier available
- Automatic deployments from GitHub
- Fast global CDN
- Built-in analytics
- Easy environment variable management

---

## Part 2: Prerequisites

Before deploying, ensure:

1. ✅ Your code is on GitHub (pushed from your local machine)
2. ✅ You have a Vercel account (free at https://vercel.com)
3. ✅ You have a production MySQL database (not local)

If you haven't done these yet, follow the steps below.

---

## Part 3: Push Your Code to GitHub

If your code isn't on GitHub yet, do this first.

### 3.1 Create a GitHub Repository

1. Go to https://github.com/new
2. Name it `Alivella Boutique`
3. Choose "Private" (recommended for production)
4. Click "Create repository"

### 3.2 Push Your Local Code to GitHub

In your terminal (in the `Alivella Boutique` folder):

```bash
git init
git add .
git commit -m "Initial commit: Alivella Boutique thrift store"
git branch -M main
git remote add origin https://github.com/yourusername/Alivella Boutique.git
git push -u origin main
```

**What this does:**
- `git init` — Initialize git in your folder
- `git add .` — Stage all files for commit
- `git commit` — Create a snapshot of your code
- `git remote add origin` — Connect to your GitHub repository
- `git push` — Upload to GitHub

**Expected output:**
```
Enumerating objects: 150, done.
...
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

Now your code is on GitHub!

---

## Part 4: Set Up a Production Database

Vercel can't use your local MySQL. You need a cloud database.

### Option A: PlanetScale (Recommended for MySQL)

PlanetScale is a managed MySQL hosting service with a free tier.

**Step 1:** Sign up at https://planetscale.com

**Step 2:** Create a new database:
- Click "Create a new database"
- Name it `Alivella Boutique`
- Choose region closest to you
- Click "Create database"

**Step 3:** Get your connection string:
- Click on your database
- Go to "Connect" tab
- Select "Node.js"
- Copy the connection string (looks like: `mysql://xxx:yyy@zzz.psdb.cloud/Alivella Boutique?sslaccept=strict`)

**Step 4:** Save this for later — you'll paste it into Vercel

### Option B: Railway (Also Good)

Railway is another popular option with free tier.

**Step 1:** Sign up at https://railway.app

**Step 2:** Create a new project:
- Click "Create new project"
- Select "MySQL"
- Click "Deploy"

**Step 3:** Get your connection string:
- Go to "Variables" tab
- Copy `DATABASE_URL`

### Option C: Render

**Step 1:** Sign up at https://render.com

**Step 2:** Create a new MySQL database from the dashboard

**Step 3:** Copy the connection string from the database details

---

## Part 5: Create a Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

---

## Part 6: Deploy to Vercel

### 6.1 Import Your GitHub Repository

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Find and select your `Alivella Boutique` repository
5. Click "Import"

### 6.2 Configure Environment Variables

Vercel will ask for environment variables. Fill in:

| Variable | Value | Where to Get |
|----------|-------|-------------|
| `DATABASE_URL` | Your PlanetScale/Railway connection string | From Part 4 |
| `JWT_SECRET` | A random secret string | Generate: `openssl rand -base64 32` |
| `VITE_APP_ID` | Your Manus OAuth app ID | From Manus dashboard |
| `OAUTH_SERVER_URL` | `https://api.manus.im` | Copy as-is |
| `VITE_OAUTH_PORTAL_URL` | `https://manus.im` | Copy as-is |
| `OWNER_OPEN_ID` | Your Manus user ID | From Manus dashboard |
| `OWNER_NAME` | Your name | Your name |

**How to add them in Vercel:**

1. In the "Environment Variables" section, click "Add"
2. Paste each variable name and value
3. Click "Add" for each one

**Example:**
```
DATABASE_URL = mysql://user:pass@host/Alivella Boutique?sslaccept=strict
JWT_SECRET = abc123xyz789...
VITE_APP_ID = app_12345
```

### 6.3 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for the build to complete
3. You'll see "Congratulations! Your project has been successfully deployed"

**What Vercel is doing:**
- Building the React frontend
- Building the Express backend
- Running database migrations
- Starting the server

---

## Part 7: Run Database Migrations on Vercel

After deployment, you need to run migrations on your production database.

### 7.1 Connect via Vercel CLI

Install Vercel CLI:

```bash
npm install -g vercel
```

### 7.2 Link Your Project

```bash
vercel link
```

Select your `Alivella Boutique` project when prompted.

### 7.3 Run Migrations

```bash
vercel env pull
pnpm db:push
```

This pulls your production environment variables and runs migrations on your production database.

**Expected output:**
```
✓ 6 tables created
✓ migrations applied successfully!
```

### 7.4 Seed Products (Optional)

If you want products on your production site:

```bash
node scripts/seed.mjs
```

---

## Part 8: Access Your Live Site

Your site is now live! Find the URL:

1. Go to https://vercel.com/dashboard
2. Click your `Alivella Boutique` project
3. You'll see a URL like: `https://Alivella Boutique-xyz.vercel.app`

Click it to visit your live site!

---

## Part 9: Set Up Custom Domain (Optional)

To use a custom domain like `Alivella Boutique.com`:

### 9.1 Buy a Domain

1. Go to a domain registrar:
   - Namecheap (https://namecheap.com)
   - GoDaddy (https://godaddy.com)
   - Google Domains (https://domains.google.com)

2. Search for your domain and buy it

### 9.2 Connect to Vercel

1. In Vercel, go to your project settings
2. Click "Domains"
3. Enter your domain name
4. Vercel will show you nameservers to add to your domain registrar
5. Go to your domain registrar and update nameservers
6. Wait 24-48 hours for DNS to propagate

Your site will then be accessible at `https://yourdomain.com`

---

## Part 10: Automatic Deployments

Now whenever you push code to GitHub, Vercel automatically redeploys:

```bash
# Make a change locally
git add .
git commit -m "Update homepage"
git push origin main
```

Within 1-2 minutes, your changes will be live on Vercel!

---

## Part 11: Environment Variables in Vercel

If you need to change environment variables later:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Click the variable to edit it
4. Vercel will automatically redeploy

---

## Part 12: Monitoring Your Deployment

### 12.1 View Logs

To see what's happening on your server:

1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments"
4. Click the latest deployment
5. Click "Logs" to see server output

### 12.2 Check Analytics

1. Click "Analytics" tab
2. See visitor count, page views, response times

---

## Part 13: Troubleshooting Vercel Deployments

### Build Failed Error

**Problem:** Deployment fails with "Build failed"

**Solution:** Check the logs:
1. Go to Vercel dashboard → Deployments
2. Click the failed deployment
3. Click "Logs"
4. Look for the error message
5. Common issues:
   - Missing environment variable → Add it in Settings
   - Database connection error → Check `DATABASE_URL` is correct
   - TypeScript error → Run `pnpm check` locally and fix

### Database Connection Error

**Problem:** "Error: connect ECONNREFUSED"

**Solution:**
1. Verify your `DATABASE_URL` is correct
2. Check if your database is running (PlanetScale/Railway dashboard)
3. Try connecting locally first: `mysql -u root -p` with your connection string
4. If using PlanetScale, ensure SSL is enabled

### Site Shows "500 Error"

**Problem:** Visiting your Vercel URL shows an error

**Solution:**
1. Check Vercel logs (see Part 12.1)
2. Ensure database migrations ran (Part 7)
3. Ensure environment variables are set (Part 6.2)
4. Try redeploying: Go to Deployments → Click latest → Click "Redeploy"

### Slow Deployment

**Problem:** Deployment takes more than 5 minutes

**Solution:**
- This is normal for first deployment
- Subsequent deployments are faster
- Check if your database is responding slowly
- Consider upgrading PlanetScale plan if needed

---

## Part 14: Making Changes and Redeploying

The workflow is simple:

**Step 1:** Make changes locally
```bash
# Edit files in VS Code
```

**Step 2:** Test locally
```bash
pnpm dev
# Visit http://localhost:3000 and test
```

**Step 3:** Commit and push
```bash
git add .
git commit -m "Add new feature"
git push origin main
```

**Step 4:** Vercel automatically deploys
- Check https://vercel.com/dashboard
- Your site updates in 1-2 minutes

---

## Part 15: Scaling & Performance

As your store grows:

### Database Performance
- PlanetScale: Upgrade to paid plan for better performance
- Railway: Add more resources
- Monitor query performance in Vercel logs

### Site Speed
- Vercel automatically caches static files globally
- Images are optimized via Vercel's Image Optimization
- Check performance in Vercel Analytics

### Traffic Limits
- Vercel free tier: Unlimited bandwidth
- Database: Check your plan limits
- Scale up when needed

---

## Part 16: Backup & Security

### Backup Your Database

**PlanetScale:**
1. Go to your database
2. Click "Backups"
3. Create manual backup before major changes

**Railway:**
1. Go to your database
2. Click "Backups"
3. Enable automatic backups

### Protect Secrets

**Never commit `.env` file to GitHub!**

Check your `.gitignore`:
```
.env
.env.local
.env.*.local
```

If you accidentally committed secrets:
1. Rotate all secrets immediately
2. Run: `git rm --cached .env`
3. Commit: `git commit -m "Remove .env"`
4. Push: `git push`

---

## Part 17: Going Live Checklist

Before telling people about your site:

- [ ] Site loads without errors
- [ ] Products display correctly
- [ ] Cart works (add/remove items)
- [ ] Checkout works (place order)
- [ ] Admin dashboard accessible
- [ ] WhatsApp order button works
- [ ] Mobile responsive (test on phone)
- [ ] Custom domain set up (optional)
- [ ] Database backups enabled
- [ ] Analytics working

---

## Part 18: Support & Help

If you encounter issues:

1. **Check Vercel docs:** https://vercel.com/docs
2. **Check PlanetScale docs:** https://planetscale.com/docs
3. **Check Railway docs:** https://docs.railway.app
4. **Ask in communities:** 
   - Vercel Discord: https://discord.gg/vercel
   - Stack Overflow: Tag with `vercel`, `mysql`, `nodejs`

---

## Summary

You now have:

✅ Code on GitHub  
✅ App deployed on Vercel  
✅ Production database  
✅ Automatic deployments  
✅ Custom domain (optional)  

Your Alivella Boutique store is live on the internet!

---

## Next Steps

1. **Share your site** — Send the Vercel URL to friends
2. **Monitor performance** — Check Vercel Analytics regularly
3. **Add features** — Make changes locally, push to GitHub, auto-deploy
4. **Scale up** — Upgrade database plan as traffic grows
5. **Optimize** — Use Vercel's performance tools to speed up your site
