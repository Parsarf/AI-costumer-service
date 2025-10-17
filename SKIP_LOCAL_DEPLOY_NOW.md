# 🚀 Skip Local Setup - Deploy to Railway Now!

## ✅ **You Don't Need PostgreSQL Locally!**

Since you have your Railway token, you can deploy directly to production. Railway will provide the database for you.

---

## 🎯 **Quick Deploy (No Local Database Needed):**

### **Step 1: Get Shopify Credentials (10 minutes)**

1. Go to: https://partners.shopify.com/signup
2. Sign up (if needed)
3. Click **"Apps"** → **"Create app"** → **"Custom app"**
4. Fill in:
   - **App name**: AI Support Bot
   - **App URL**: https://temporary-url.com (we'll update this)
   - **Redirect URL**: https://temporary-url.com/auth/callback
5. Copy your **API Key** and **API Secret**

---

### **Step 2: Deploy to Railway (5 minutes)**

Run this command and follow the prompts:

```bash
node scripts/deploy-to-railway.js
```

**OR manually:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login (use your token when prompted)
railway login

# Go to backend folder
cd backend

# Initialize project
railway init

# Add PostgreSQL (Railway provides this!)
railway add postgresql

# Set your variables
railway variables set OPENAI_API_KEY=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

railway variables set SHOPIFY_API_KEY=your_shopify_key_here
railway variables set SHOPIFY_API_SECRET=your_shopify_secret_here
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set SCOPES=read_products,read_orders,read_customers,write_themes
railway variables set BILLING_PRICE=9.99
railway variables set BILLING_TRIAL_DAYS=7
railway variables set SHOPIFY_BILLING_TEST=false
railway variables set FREE_PLAN=false
railway variables set LOG_LEVEL=info

# Generate and set security keys
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
railway variables set ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Deploy!
railway up

# Run migrations
railway run npx prisma migrate deploy

# Get your URL
railway domain
```

---

### **Step 3: Update Shopify App URLs**

After deployment, Railway will give you a URL like: `https://your-app.railway.app`

1. Go back to: https://partners.shopify.com
2. Click your app
3. Update:
   - **App URL**: `https://your-app.railway.app/app`
   - **Redirect URL**: `https://your-app.railway.app/auth/callback`

---

### **Step 4: Test Installation**

Visit: `https://your-app.railway.app/auth?shop=your-dev-store.myshopify.com`

Done! ✅

---

## 🎉 **Why This is Better:**

- ✅ No need to install PostgreSQL locally
- ✅ Railway provides production database
- ✅ Faster to get started
- ✅ Production-ready immediately
- ✅ Free tier available

---

## 📞 **Quick Commands:**

```bash
# Deploy everything
node scripts/deploy-to-railway.js

# Check status
railway status

# View logs
railway logs

# Open dashboard
railway open
```

**That's it! Skip local setup and go straight to production!** 🚀

