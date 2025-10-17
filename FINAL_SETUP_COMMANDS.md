# 🎉 Your App is Deployed!

## ✅ **Your App URL:**
```
https://ai-customerservice-production.up.railway.app
```

---

## 🔧 **Fix the Crash - Add Environment Variables:**

### **Copy and paste these commands in PowerShell:**

```powershell
cd "C:\Users\owner\Desktop\AI assistant\AI-costumer-service\backend"

railway variables --set SCOPES=read_products,read_orders,read_customers,write_themes

railway variables --set OPENAI_API_KEY=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

railway variables --set SHOPIFY_API_KEY=236a8ec4bab4aadc625ef47717361888

railway variables --set SHOPIFY_API_SECRET=0c8b288648f4aaf6bf87c52e86a935a9

railway variables --set APP_URL=https://ai-customerservice-production.up.railway.app

railway variables --set NODE_ENV=production

railway variables --set PORT=3001

railway variables --set BILLING_PRICE=9.99

railway variables --set BILLING_TRIAL_DAYS=7

railway variables --set SHOPIFY_BILLING_TEST=false

railway variables --set FREE_PLAN=false

railway variables --set LOG_LEVEL=info
```

### **Generate and add security keys:**

```powershell
$JWT_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
railway variables --set JWT_SECRET=$JWT_SECRET

$ENCRYPTION_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
railway variables --set ENCRYPTION_KEY=$ENCRYPTION_KEY
```

---

## ⏱️ **Wait for Redeployment:**

After adding variables, Railway will automatically redeploy (2-3 minutes).

Check status:
```powershell
railway status
```

View logs:
```powershell
railway logs
```

---

## 🗄️ **Run Database Migrations:**

Once the app is running, run:
```powershell
railway run npx prisma migrate deploy
```

---

## 🎯 **Update Shopify App URLs:**

Now go to: https://partners.shopify.com

1. Find your app
2. Go to **"App setup"**
3. Update these URLs:
   - **App URL**: `https://ai-customerservice-production.up.railway.app/app`
   - **Allowed redirection URL(s)**: `https://ai-customerservice-production.up.railway.app/auth/callback`
4. Click **"Save"**

---

## ✅ **Test Your App:**

Visit:
```
https://ai-customerservice-production.up.railway.app/health
```

Should show:
```json
{"status": "healthy", "timestamp": "..."}
```

---

## 🎉 **Install on a Test Store:**

```
https://ai-customerservice-production.up.railway.app/auth?shop=your-dev-store.myshopify.com
```

Replace `your-dev-store` with your actual Shopify development store name.

---

## 📋 **Quick Checklist:**

- [ ] Run the commands above to add environment variables
- [ ] Wait 3 minutes for redeployment
- [ ] Run database migrations
- [ ] Update Shopify app URLs
- [ ] Test health endpoint
- [ ] Install on test store
- [ ] Test the chat widget

**You're almost there!** 🚀

