# 🔑 Your API Keys Setup Guide

## ✅ **Keys Received:**

### 1. OpenAI API Key
```
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
```

### 2. Railway Token
```
f630810a-7e80-4738-9000-f2c1d7212772
```

---

## 📋 **Additional Keys You Need:**

### 🛍️ **Shopify App Credentials**
You need to create a Shopify Partner account and app:

1. **Go to**: https://partners.shopify.com/signup
2. **Create account** (if you don't have one)
3. **Create new app**:
   - Apps → Create app → Custom app
4. **Get your credentials**:
   - `SHOPIFY_API_KEY` (32 character hex string)
   - `SHOPIFY_API_SECRET` (32 character hex string)

### 🗄️ **Database URL**
For local development:
```
postgresql://postgres:password@localhost:5432/shopify_support_bot
```

For Railway (auto-generated when you add PostgreSQL):
```
Will be auto-set by Railway
```

---

## 🚀 **Setup Instructions**

### **Option 1: Local Development Setup**

1. **Edit the .env file manually**:
```bash
cd backend
notepad .env
```

2. **Copy and paste this configuration**:
```env
# App Configuration
APP_URL=http://localhost:3001
NODE_ENV=development
PORT=3001

# Shopify App Credentials (GET THESE FROM SHOPIFY PARTNERS)
SHOPIFY_API_KEY=YOUR_SHOPIFY_API_KEY_HERE
SHOPIFY_API_SECRET=YOUR_SHOPIFY_API_SECRET_HERE
SCOPES=read_products,read_orders,read_customers,write_themes

# Database (for local development)
DATABASE_URL=postgresql://postgres:password@localhost:5432/shopify_support_bot

# AI Service (YOUR KEY - ALREADY ADDED)
OPENAI_API_KEY=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

# Security (auto-generated - already set)
JWT_SECRET=[WILL BE AUTO-GENERATED]
ENCRYPTION_KEY=[WILL BE AUTO-GENERATED]

# Billing Configuration
BILLING_PRICE=9.99
BILLING_TRIAL_DAYS=7
SHOPIFY_BILLING_TEST=true
FREE_PLAN=false

# Logging
LOG_LEVEL=info
```

3. **Replace placeholders**:
   - `YOUR_SHOPIFY_API_KEY_HERE` → Your Shopify API key
   - `YOUR_SHOPIFY_API_SECRET_HERE` → Your Shopify API secret

---

### **Option 2: Railway Production Deployment**

#### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

#### **Step 2: Login to Railway**
```bash
railway login
```

When prompted, use this token:
```
f630810a-7e80-4738-9000-f2c1d7212772
```

#### **Step 3: Initialize Project**
```bash
cd "C:\Users\owner\Desktop\AI assistant\AI-costumer-service\backend"
railway init
```

#### **Step 4: Add PostgreSQL Database**
```bash
railway add postgresql
```

#### **Step 5: Set Environment Variables**
```bash
# OpenAI API Key (ALREADY SET FOR YOU)
railway variables set OPENAI_API_KEY=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

# Shopify Credentials (YOU NEED TO GET THESE)
railway variables set SHOPIFY_API_KEY=your_shopify_api_key
railway variables set SHOPIFY_API_SECRET=your_shopify_api_secret

# App Configuration
railway variables set APP_URL=https://your-app.railway.app
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set SCOPES=read_products,read_orders,read_customers,write_themes

# Security (generate these)
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
railway variables set ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Billing
railway variables set BILLING_PRICE=9.99
railway variables set BILLING_TRIAL_DAYS=7
railway variables set SHOPIFY_BILLING_TEST=false
railway variables set FREE_PLAN=false

# Logging
railway variables set LOG_LEVEL=info
```

#### **Step 6: Deploy**
```bash
railway up
```

#### **Step 7: Run Database Migrations**
```bash
railway run npx prisma migrate deploy
```

#### **Step 8: Get Your App URL**
```bash
railway domain
```

---

## 📝 **Complete Checklist**

### ✅ **What You Have:**
- [x] OpenAI API Key
- [x] Railway Token
- [x] Project code ready
- [x] Dependencies configuration

### ⏳ **What You Need:**
- [ ] Shopify Partner account
- [ ] Shopify API Key
- [ ] Shopify API Secret
- [ ] PostgreSQL database (local or Railway)

### 🎯 **What To Do:**

#### **For Local Testing:**
1. Install PostgreSQL locally
2. Create Shopify Partner account
3. Get Shopify API credentials
4. Update `backend/.env` file
5. Run `npm install` in backend folder
6. Run `npx prisma migrate deploy`
7. Run `npm run dev`

#### **For Production Deployment:**
1. Create Shopify Partner account
2. Get Shopify API credentials
3. Follow Railway deployment steps above
4. Update Shopify app URLs with Railway domain
5. Test the installation

---

## 🔗 **Important URLs**

### **To Get Shopify Credentials:**
1. Shopify Partners: https://partners.shopify.com
2. Create App: https://partners.shopify.com/organizations
3. API Credentials: Found in your app settings

### **To Manage Railway:**
1. Railway Dashboard: https://railway.app
2. Railway Docs: https://docs.railway.app

### **To Manage OpenAI:**
1. OpenAI Dashboard: https://platform.openai.com
2. API Keys: https://platform.openai.com/api-keys
3. Usage: https://platform.openai.com/usage

---

## 🎬 **Quick Start (After Getting Shopify Keys)**

### **Local Development:**
```bash
# 1. Update .env with Shopify keys
cd backend
notepad .env

# 2. Install dependencies
npm install

# 3. Setup database
createdb shopify_support_bot
npx prisma migrate deploy
npx prisma generate

# 4. Start dev server
npm run dev
```

### **Production Deployment:**
```bash
# 1. Login to Railway
railway login

# 2. Set all variables (see Step 5 above)
railway variables set SHOPIFY_API_KEY=your_key
railway variables set SHOPIFY_API_SECRET=your_secret
# ... etc

# 3. Deploy
railway up

# 4. Run migrations
railway run npx prisma migrate deploy
```

---

## 🆘 **Need Help?**

### **Get Shopify API Keys:**
1. Go to: https://partners.shopify.com
2. Click "Apps" in top menu
3. Click "Create app"
4. Choose "Custom app"
5. Fill in app details
6. Copy API key and API secret from "Client credentials"

### **Test Your OpenAI Key:**
```bash
curl https://api.openai.com/v1/models ^
  -H "Authorization: Bearer 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"
```

If this returns a list of models, your OpenAI key is working! ✅

---

## 🎉 **Summary**

**You have:**
- ✅ OpenAI API key (configured)
- ✅ Railway token (configured)
- ✅ Project code (ready)

**You need:**
- ⏳ Shopify Partner account
- ⏳ Shopify API credentials (15 minutes to setup)

**Once you have Shopify credentials:**
- Update `.env` file OR
- Set Railway variables
- Deploy and test!

**Estimated time to complete setup: 30 minutes** ⏱️

