# 🚂 Railway Dashboard Guide - Step by Step

## 🎯 **Finding Your Way Around Railway**

### **Step 1: Access Your Project**
1. Go to: https://railway.app
2. Login
3. You should see your project: **"AI-CustomerService"** or similar
4. Click on it

---

## 📋 **Your Project Has 2 Services:**

1. **PostgreSQL** (database) - This is working ✅
2. **AI-CustomerService** (your app) - This needs environment variables

---

## 🔧 **How to Add Environment Variables:**

### **Method 1: Click on Your Service**
1. Click on the **service card** (not the database)
2. You'll see several tabs at the top:
   - **Deployments**
   - **Variables** ← Click this one
   - **Metrics**
   - **Settings**

### **Method 2: If You See a Different Layout**
1. Click on your service name
2. Look for **"Variables"** in the left sidebar or top tabs
3. Click it

### **In the Variables Tab:**
1. You'll see a button: **"New Variable"** or **"+ Add Variable"**
2. Click **"Raw Editor"** or **"Bulk Import"** (if available)
3. Paste all variables at once

---

## 🌐 **How to Get/Generate Domain:**

### **Option 1: Settings Tab**
1. Click on your service
2. Go to **"Settings"** tab
3. Scroll down to **"Networking"** or **"Domains"** section
4. Click **"Generate Domain"** or **"Add Domain"**

### **Option 2: If You Don't See Generate Domain**
Your service might already have a domain! Look for:
- A URL at the top of the service card
- Something like: `https://ai-costumer-service-production.up.railway.app`

### **Option 3: Check Deployment Logs**
1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Look for a URL in the deployment details

---

## 📝 **Add These Environment Variables:**

Click **"New Variable"** for each one, or use **"Raw Editor"**:

```
OPENAI_API_KEY=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

SHOPIFY_API_KEY=236a8ec4bab4aadc625ef47717361888

SHOPIFY_API_SECRET=0c8b288648f4aaf6bf87c52e86a935a9

SCOPES=read_products,read_orders,read_customers,write_themes

NODE_ENV=production

PORT=3001

BILLING_PRICE=9.99

BILLING_TRIAL_DAYS=7

SHOPIFY_BILLING_TEST=false

FREE_PLAN=false

LOG_LEVEL=info
```

### **Generate These Two:**

**In PowerShell, run:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy output, add as: `JWT_SECRET=<paste here>`

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy output, add as: `ENCRYPTION_KEY=<paste here>`

---

## 🔍 **Can't Find Something?**

### **Take a Screenshot and Look For:**

**Service Card** - Should show:
- Service name
- Status (Building/Running/Crashed)
- Maybe a URL

**Tabs** - Usually at the top:
- Deployments
- Variables ← You need this
- Metrics
- Settings ← Domain might be here

**Left Sidebar** - Might have:
- Overview
- Variables
- Settings
- Deployments

---

## 🎯 **Simple Alternative - Use Railway CLI:**

If the dashboard is confusing, try this in PowerShell:

```powershell
cd "C:\Users\owner\Desktop\AI assistant\AI-costumer-service\backend"

# Login to Railway
railway login

# Link to your project
railway link

# Add variables one by one
railway variables --set SCOPES=read_products,read_orders,read_customers,write_themes
railway variables --set OPENAI_API_KEY=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
railway variables --set SHOPIFY_API_KEY=236a8ec4bab4aadc625ef47717361888
railway variables --set SHOPIFY_API_SECRET=0c8b288648f4aaf6bf87c52e86a935a9
railway variables --set NODE_ENV=production
railway variables --set PORT=3001
railway variables --set BILLING_PRICE=9.99
railway variables --set BILLING_TRIAL_DAYS=7
railway variables --set SHOPIFY_BILLING_TEST=false
railway variables --set FREE_PLAN=false
railway variables --set LOG_LEVEL=info
```

---

## 📸 **What to Look For:**

Your Railway dashboard should look something like this:

```
┌─────────────────────────────┐
│  AI-CustomerService         │  ← Your service
│  Status: Crashed            │
│  Last deploy: 2 mins ago    │
└─────────────────────────────┘

Tabs:
[Deployments] [Variables] [Metrics] [Settings]
```

Click **Variables** tab and add the environment variables!

---

## 🆘 **Still Can't Find It?**

1. **Take a screenshot** of your Railway dashboard
2. **Or describe** what you see on the screen
3. I'll guide you exactly where to click!

**The app deployed successfully - it just needs those environment variables!** 🚀

