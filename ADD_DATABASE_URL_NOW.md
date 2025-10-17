# 🚨 CRITICAL - Add DATABASE_URL via Railway Dashboard

## 🎯 **Do This Right Now:**

### **Step 1: Open Railway Dashboard**
1. Go to: https://railway.app/project/b8786ab2-39fe-4c4c-933e-b61a81b3291f
   *(This is your project URL from the logs)*

### **Step 2: Find Your PostgreSQL Database**
You should see 2 services:
- **Postgres** (or PostgreSQL)
- **AI-CustomerService**

### **Step 3: Get Database URL**
1. Click on the **Postgres** card/box
2. Look for **"Variables"** or **"Connect"** tab
3. You'll see a variable called **DATABASE_URL**
4. It looks like: `postgresql://postgres:xxxxx@containers-us-west-xxx.railway.app:5432/railway`
5. **Copy this entire URL**

### **Step 4: Add to Your Service**
1. Go back (click back arrow or project name)
2. Click on **AI-CustomerService** card/box
3. Go to **"Variables"** tab
4. Click **"New Variable"** or **"+ Add"**
5. Name: `DATABASE_URL`
6. Value: (paste the URL you copied)
7. Click **"Add"** or **"Save"**

### **Step 5: Wait for Redeploy**
- Railway will automatically redeploy (2-3 minutes)
- Watch the **"Deployments"** tab

---

## 🎯 **Alternative: Use Railway CLI with Correct Syntax**

In PowerShell:

```powershell
cd "C:\Users\owner\Desktop\AI assistant\AI-costumer-service\backend"

# Get the database URL from Postgres service
railway variables --service Postgres

# Copy the DATABASE_URL value, then set it for your service
railway variables --service AI-CustomerService --set DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
```

---

## 🎯 **Or Use Railway's Reference Syntax:**

```powershell
cd backend

# This references the Postgres service automatically
railway variables --set DATABASE_URL='${{Postgres.DATABASE_URL}}'
```

If that doesn't work, try without quotes:

```powershell
railway variables --set DATABASE_URL=${{Postgres.DATABASE_URL}}
```

---

## 📸 **Visual Guide:**

### **What You Should See:**

```
Railway Dashboard
├── AI-CustomerService Project
    ├── Postgres (Database)
    │   └── Variables
    │       └── DATABASE_URL: postgresql://...
    │
    └── AI-CustomerService (App)
        └── Variables ← Add DATABASE_URL here
```

---

## ✅ **After Adding DATABASE_URL:**

The logs should show:
```
✅ Database connected successfully
🚀 Shopify AI Support Bot running on port 3001
```

---

## 🆘 **Can't Find It?**

### **Try This CLI Command:**

```powershell
cd backend
railway variables
```

This shows ALL variables. Look for DATABASE_URL in the list.

If you don't see it, the database might not be created. Run:

```powershell
railway add
```

Select **PostgreSQL** from the list.

---

## 🎯 **Simplest Solution:**

1. **Go to**: https://railway.app
2. **Click**: Your project
3. **Click**: Postgres box
4. **Copy**: DATABASE_URL value
5. **Click**: AI-CustomerService box  
6. **Click**: Variables tab
7. **Click**: New Variable
8. **Paste**: DATABASE_URL

**That's it!** 🚀

