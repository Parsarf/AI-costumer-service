# 🔧 Railway Deployment - Error Fixes

## 🎯 **Alternative Method: Use Railway Dashboard (Easier)**

Instead of CLI, let's use the Railway web dashboard:

### **Step 1: Go to Railway Dashboard**
1. Open: https://railway.app
2. Click **"Login"**
3. Sign in with GitHub/Google/Email

### **Step 2: Create New Project**
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account
4. Select your repository: `AI-costumer-service`
5. Click **"Deploy Now"**

### **Step 3: Add PostgreSQL**
1. In your project, click **"New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Wait for it to provision

### **Step 4: Add Environment Variables**
1. Click on your **service** (backend)
2. Go to **"Variables"** tab
3. Click **"Raw Editor"**
4. Paste this entire block:

```env
OPENAI_API_KEY=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
SHOPIFY_API_KEY=236a8ec4bab4aadc625ef47717361888
SHOPIFY_API_SECRET=0c8b288648f4aaf6bf87c52e86a935a9
NODE_ENV=production
PORT=3001
SCOPES=read_products,read_orders,read_customers,write_themes
BILLING_PRICE=9.99
BILLING_TRIAL_DAYS=7
SHOPIFY_BILLING_TEST=false
FREE_PLAN=false
LOG_LEVEL=info
JWT_SECRET=GENERATE_THIS_BELOW
ENCRYPTION_KEY=GENERATE_THIS_BELOW
```

### **Step 5: Generate Security Keys**

Open PowerShell and run:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and replace `JWT_SECRET` value

Then run:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and replace `ENCRYPTION_KEY` value

### **Step 6: Set Root Directory**
1. In Railway, go to **"Settings"** tab
2. Find **"Root Directory"**
3. Set it to: `backend`
4. Click **"Save"**

### **Step 7: Set Start Command**
1. Still in **"Settings"**
2. Find **"Start Command"**
3. Set it to: `npm start`
4. Click **"Save"**

### **Step 8: Deploy**
1. Railway will auto-deploy
2. Wait 3-5 minutes
3. Check the **"Deployments"** tab for progress

### **Step 9: Run Migrations**
1. Once deployed, go to your service
2. Click on the **"..."** menu
3. Select **"Run Command"**
4. Type: `npx prisma migrate deploy`
5. Click **"Run"**

### **Step 10: Get Your URL**
1. Go to **"Settings"** tab
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://your-app.up.railway.app`)

### **Step 11: Set APP_URL**
1. Go back to **"Variables"** tab
2. Add: `APP_URL=https://your-generated-url.up.railway.app`

---

## 🔧 **If Railway CLI Login Failed:**

### **Common Errors & Fixes:**

#### **Error: "railway: command not found"**
```powershell
# Reinstall Railway CLI
npm uninstall -g @railway/cli
npm install -g @railway/cli
```

#### **Error: "Authentication failed"**
```powershell
# Clear Railway config
Remove-Item -Path "$env:USERPROFILE\.railway" -Recurse -Force
railway login
```

#### **Error: "browserless login failed"**
```powershell
# Use browser login instead
railway login
# This will open a browser window
```

#### **Error: "RAILWAY_TOKEN not recognized"**
```powershell
# Set token differently
railway login --token f630810a-7e80-4738-9000-f2c1d7212772
```

---

## 🎯 **Recommended: Use Railway Dashboard**

The web dashboard is easier and more reliable:

1. ✅ No CLI installation needed
2. ✅ Visual interface
3. ✅ Easier to debug
4. ✅ See logs in real-time
5. ✅ Manage everything in browser

**Just go to: https://railway.app and follow the steps above!**

---

## 📝 **Quick Checklist:**

- [ ] Go to https://railway.app
- [ ] Create new project
- [ ] Deploy from GitHub (or upload code)
- [ ] Add PostgreSQL database
- [ ] Add environment variables (copy from above)
- [ ] Generate JWT_SECRET and ENCRYPTION_KEY
- [ ] Set root directory to `backend`
- [ ] Wait for deployment
- [ ] Run migrations
- [ ] Generate domain
- [ ] Update Shopify app URLs

---

## 🆘 **Still Having Issues?**

### **Option 1: Share the Error**
Tell me the exact error message you're seeing

### **Option 2: Use Railway Dashboard**
It's much easier: https://railway.app

### **Option 3: Deploy to Vercel Instead**
I can help you deploy to Vercel if Railway isn't working

---

## 📞 **What Error Did You Get?**

Common errors:
1. "railway: command not found" → Reinstall CLI
2. "Authentication failed" → Use dashboard instead
3. "Project not found" → Run `railway init` first
4. "Permission denied" → Run PowerShell as Administrator

**Tell me your error and I'll help you fix it!** 🔧

