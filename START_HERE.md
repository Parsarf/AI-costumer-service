# 🚀 START HERE - Your Setup Guide

## ✅ **Your API Keys (Already Configured):**

### 1. OpenAI API Key ✅
```
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
```
✅ **Status**: Ready to use

### 2. Railway Token ✅
```
f630810a-7e80-4738-9000-f2c1d7212772
```
✅ **Status**: Ready to use

---

## ⏳ **What You Need to Get:**

### Shopify API Credentials (Takes 10 minutes)
You need two values from Shopify:
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`

**How to get them:**
1. Go to: https://partners.shopify.com/signup
2. Sign up (if needed)
3. Click **"Apps"** in top menu
4. Click **"Create app"** → **"Custom app"**
5. Fill in:
   - App name: "AI Support Bot"
   - App URL: http://localhost:3001 (for now)
   - Redirect URL: http://localhost:3001/auth/callback
6. Copy your **API Key** and **API Secret**

---

## 🎯 **Two Setup Options:**

### **Option A: Automated Setup (Recommended) ⚡**

Just run this command and follow the prompts:

```bash
node scripts/quick-setup-with-keys.js
```

This will:
- ✅ Ask for your Shopify credentials
- ✅ Create your `.env` file
- ✅ Configure OpenAI key (already set)
- ✅ Generate security keys
- ✅ Show you next steps

---

### **Option B: Manual Setup 📝**

#### **Step 1: Create .env file**
```bash
cd backend
copy env.example .env
notepad .env
```

#### **Step 2: Edit the .env file**

Replace these values:
```env
# Replace with your Shopify credentials
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here

# OpenAI is already set - DO NOT CHANGE
OPENAI_API_KEY=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
```

#### **Step 3: Generate security keys**
Run these commands:
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ENCRYPTION_KEY  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the outputs to your .env file.

---

## 🏃 **After Setup - Run Locally:**

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Setup database
createdb shopify_support_bot
npx prisma generate
npx prisma migrate deploy

# 3. Start dev server
npm run dev
```

Your app will be at: http://localhost:3001

---

## 🚂 **Deploy to Production (Railway):**

### **Option A: Automated Deployment ⚡**

```bash
node scripts/deploy-to-railway.js
```

This will:
- ✅ Setup Railway project
- ✅ Add PostgreSQL database
- ✅ Configure all environment variables
- ✅ Deploy your app
- ✅ Run database migrations

### **Option B: Manual Deployment 📝**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login with your token
railway login

# 3. Initialize project
cd backend
railway init

# 4. Add PostgreSQL
railway add postgresql

# 5. Set variables
railway variables set OPENAI_API_KEY=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
railway variables set SHOPIFY_API_KEY=your_key
railway variables set SHOPIFY_API_SECRET=your_secret
railway variables set NODE_ENV=production
railway variables set BILLING_TEST=false

# 6. Deploy
railway up

# 7. Run migrations
railway run npx prisma migrate deploy

# 8. Get URL
railway domain
```

---

## 📋 **Quick Reference**

### **Your Configured Keys:**
✅ OpenAI API Key - Ready  
✅ Railway Token - Ready  
⏳ Shopify API Key - Need to get  
⏳ Shopify API Secret - Need to get  

### **Setup Scripts Available:**
- `scripts/quick-setup-with-keys.js` - Automated local setup
- `scripts/deploy-to-railway.js` - Automated Railway deployment
- `scripts/generate-env.js` - Generate .env template
- `scripts/complete-setup.js` - Full setup automation

### **Important Files:**
- `YOUR_API_KEYS_SETUP.md` - Detailed setup guide
- `MIGRATION_TO_OPENAI.md` - OpenAI migration details
- `LAUNCH_READY_CHECKLIST.md` - Launch checklist
- `README.md` - Full documentation

---

## 🆘 **Get Shopify Credentials Now:**

### **Quick Steps:**
1. Open: https://partners.shopify.com
2. Sign up (if needed)
3. Apps → Create app → Custom app
4. Name it: "AI Support Bot"
5. Copy API Key and API Secret
6. Run: `node scripts/quick-setup-with-keys.js`
7. Paste your credentials when asked
8. Done! ✅

**Time required: 10 minutes**

---

## 🎉 **Summary:**

**Status**: 80% Complete

**You Have:**
- ✅ OpenAI API Key configured
- ✅ Railway Token configured  
- ✅ Project code ready
- ✅ Migration to OpenAI complete
- ✅ All scripts ready

**You Need:**
- ⏳ Shopify API credentials (10 min)

**Once you have Shopify credentials:**
1. Run `node scripts/quick-setup-with-keys.js`
2. Enter your Shopify keys
3. Run `npm run dev` to test locally
4. Run `node scripts/deploy-to-railway.js` to deploy

**Total time to launch: 30 minutes** ⏱️

---

## 🚀 **Let's Go!**

**Right now, do this:**

1. Open: https://partners.shopify.com/signup
2. Get your Shopify API credentials
3. Come back and run: `node scripts/quick-setup-with-keys.js`
4. That's it! Your app will be ready!

**Need help?** Check `YOUR_API_KEYS_SETUP.md` for detailed instructions.

