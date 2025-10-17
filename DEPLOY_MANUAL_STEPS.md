# 🚀 Manual Deployment Steps - Copy & Paste

## ✅ **Your Credentials (Ready to Use):**

```
SHOPIFY_API_KEY: 236a8ec4bab4aadc625ef47717361888
SHOPIFY_API_SECRET: 0c8b288648f4aaf6bf87c52e86a935a9
OPENAI_API_KEY: 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
RAILWAY_TOKEN: f630810a-7e80-4738-9000-f2c1d7212772
```

---

## 📝 **Open YOUR OWN PowerShell:**

1. Press `Windows Key + X`
2. Click **"Windows PowerShell"** or **"Terminal"**
3. Copy and paste each command below, one at a time

---

## 🎯 **Step-by-Step Commands:**

### **Step 1: Navigate to Project**
```powershell
cd "C:\Users\owner\Desktop\AI assistant\AI-costumer-service"
```

### **Step 2: Install Railway CLI**
```powershell
npm install -g @railway/cli
```

### **Step 3: Set Railway Token**
```powershell
$env:RAILWAY_TOKEN="f630810a-7e80-4738-9000-f2c1d7212772"
```

### **Step 4: Login to Railway**
```powershell
railway login --browserless
```

### **Step 5: Go to Backend Folder**
```powershell
cd backend
```

### **Step 6: Initialize Railway Project**
```powershell
railway init
```
*(Press Enter when prompted, accept defaults)*

### **Step 7: Add PostgreSQL Database**
```powershell
railway add postgresql
```

### **Step 8: Set Environment Variables (Copy ALL at once)**
```powershell
railway variables set OPENAI_API_KEY=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
railway variables set SHOPIFY_API_KEY=236a8ec4bab4aadc625ef47717361888
railway variables set SHOPIFY_API_SECRET=0c8b288648f4aaf6bf87c52e86a935a9
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set SCOPES=read_products,read_orders,read_customers,write_themes
railway variables set BILLING_PRICE=9.99
railway variables set BILLING_TRIAL_DAYS=7
railway variables set SHOPIFY_BILLING_TEST=false
railway variables set FREE_PLAN=false
railway variables set LOG_LEVEL=info
```

### **Step 9: Generate and Set Security Keys**
```powershell
$JWT_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
$ENCRYPTION_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
railway variables set JWT_SECRET=$JWT_SECRET
railway variables set ENCRYPTION_KEY=$ENCRYPTION_KEY
```

### **Step 10: Deploy Application**
```powershell
railway up
```
*(This will take 3-5 minutes)*

### **Step 11: Run Database Migrations**
```powershell
railway run npx prisma migrate deploy
```

### **Step 12: Get Your App URL**
```powershell
railway domain
```

### **Step 13: Set APP_URL Variable**
```powershell
# Replace YOUR-URL with the URL from step 12
railway variables set APP_URL=https://YOUR-URL.railway.app
```

---

## 🎉 **After Deployment:**

### **You'll get a URL like:**
```
https://ai-costumer-service-production.up.railway.app
```

### **Update Shopify App:**

1. Go to: https://partners.shopify.com
2. Click your app
3. Update URLs:
   - **App URL**: `https://YOUR-URL.railway.app/app`
   - **Redirect URL**: `https://YOUR-URL.railway.app/auth/callback`

### **Test Installation:**
```
https://YOUR-URL.railway.app/auth?shop=your-dev-store.myshopify.com
```

---

## 🆘 **If Something Goes Wrong:**

### **Check Deployment Status:**
```powershell
railway status
```

### **View Logs:**
```powershell
railway logs
```

### **Open Railway Dashboard:**
```powershell
railway open
```

---

## ⚡ **Quick Copy-Paste Version:**

**Just copy this entire block and paste into PowerShell:**

```powershell
cd "C:\Users\owner\Desktop\AI assistant\AI-costumer-service"
npm install -g @railway/cli
$env:RAILWAY_TOKEN="f630810a-7e80-4738-9000-f2c1d7212772"
railway login --browserless
cd backend
railway init
railway add postgresql
railway variables set OPENAI_API_KEY=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
railway variables set SHOPIFY_API_KEY=236a8ec4bab4aadc625ef47717361888
railway variables set SHOPIFY_API_SECRET=0c8b288648f4aaf6bf87c52e86a935a9
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set SCOPES=read_products,read_orders,read_customers,write_themes
railway variables set BILLING_PRICE=9.99
railway variables set BILLING_TRIAL_DAYS=7
railway variables set SHOPIFY_BILLING_TEST=false
railway variables set FREE_PLAN=false
railway variables set LOG_LEVEL=info
$JWT_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
$ENCRYPTION_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
railway variables set JWT_SECRET=$JWT_SECRET
railway variables set ENCRYPTION_KEY=$ENCRYPTION_KEY
railway up
railway run npx prisma migrate deploy
railway domain
```

**That's it! Your app will be deployed!** 🚀

---

## 📞 **Need Help?**

- Railway Dashboard: https://railway.app
- Check logs: `railway logs`
- Check status: `railway status`

