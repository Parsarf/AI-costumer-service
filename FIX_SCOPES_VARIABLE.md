# 🚨 URGENT: Fix Missing SCOPES Variable

## The Problem
The `SCOPES` environment variable is missing from Railway, causing the app to crash.

## ✅ **IMMEDIATE FIX**

### **Step 1: Go to Railway Dashboard**
1. Open: https://railway.app/dashboard
2. Click: **AI-CustomerService** project
3. Click: **AI-CustomerService** service
4. Click: **"Variables"** tab

### **Step 2: Add Missing Variable**
Add this variable:
- **Name:** `SCOPES`
- **Value:** `read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory`

### **Step 3: Save and Redeploy**
1. Click **"Save"**
2. Go to **"Deployments"** tab
3. Click **"Redeploy"**

---

## 🎯 **Alternative: Use Railway CLI**

```powershell
railway variables --set SCOPES="read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory"
```

---

## ✅ **After Fix**

Your app will work! Test:
```
https://ai-customerservice-production.up.railway.app/health
```

---

**Add the SCOPES variable in Railway dashboard now!** 🚀

