# 🔧 Fix Database Connection - CRITICAL

## ❌ **Problem:**
Your app can't find the DATABASE_URL environment variable.

## ✅ **Solution:**

Railway has a PostgreSQL database, but it's not connected to your service.

---

## 🎯 **Fix Method 1: Railway Dashboard (Easiest)**

### **Step 1: Go to Railway Dashboard**
1. Open: https://railway.app
2. Click your **"AI-CustomerService"** project

### **Step 2: Connect Database to Service**
1. You should see **2 boxes/cards**:
   - One for **PostgreSQL** (database)
   - One for **AI-CustomerService** (your app)

2. **Look for a "Connect" or "Link" option**:
   - Hover over the PostgreSQL card
   - Look for a **"Connect"** button or **cable/plug icon**
   - Click it and select your service

### **Step 3: Or Add DATABASE_URL Manually**
1. Click on **PostgreSQL** database card
2. Go to **"Variables"** or **"Connect"** tab
3. Copy the **DATABASE_URL** (it looks like: `postgresql://postgres:...@...railway.app:5432/railway`)
4. Go to your **AI-CustomerService** card
5. Go to **"Variables"** tab
6. Add new variable:
   - Name: `DATABASE_URL`
   - Value: (paste the PostgreSQL URL you copied)

---

## 🎯 **Fix Method 2: Railway CLI**

Run this in PowerShell:

```powershell
cd "C:\Users\owner\Desktop\AI assistant\AI-costumer-service\backend"

# This will show you the database URL
railway variables

# Look for DATABASE_URL in the output from PostgreSQL service
# Then set it for your service:
railway variables --set DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
```

---

## 🎯 **Fix Method 3: Reference the Database**

In PowerShell:

```powershell
cd "C:\Users\owner\Desktop\AI assistant\AI-costumer-service\backend"

# Link database using Railway's reference syntax
railway variables --set DATABASE_URL='${{Postgres.DATABASE_URL}}'
```

---

## 📋 **Quick Steps:**

1. **Go to Railway Dashboard**: https://railway.app
2. **Find your PostgreSQL database**
3. **Copy the DATABASE_URL** from it
4. **Add it to your AI-CustomerService** variables
5. **App will auto-redeploy** and work!

---

## 🔍 **What to Look For in Dashboard:**

You should see something like:

```
┌─────────────────┐    ┌──────────────────────┐
│   PostgreSQL    │    │  AI-CustomerService  │
│   Running ✅    │    │  Crashed ❌          │
└─────────────────┘    └──────────────────────┘
```

Click on **PostgreSQL** → Copy **DATABASE_URL**  
Click on **AI-CustomerService** → Variables → Add **DATABASE_URL**

---

## ⚡ **Fastest Fix:**

In PowerShell, try this:

```powershell
cd backend
railway variables --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
```

This tells Railway to automatically use the PostgreSQL database URL!

**Try this command now!** 🚀

