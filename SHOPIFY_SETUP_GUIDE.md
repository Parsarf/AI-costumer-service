# 🛍️ Shopify App Setup Guide

## 🎯 **Quick Setup for Shopify Partners Dashboard**

### **Step 1: Create Shopify Partners Account**
1. **Go to**: https://partners.shopify.com/
2. **Sign up** or **login** with your Shopify account
3. **Verify** your email if required

### **Step 2: Create Your App**
1. **Click "Apps"** in the left sidebar
2. **Click "Create app"**
3. **Choose "Custom app"**
4. **Fill in the details**:
   - **App name**: AI Support Bot
   - **App URL**: `https://ai-customerservice-production.up.railway.app`
   - **Allowed redirection URLs**: 
     - `https://ai-customerservice-production.up.railway.app/auth/callback`
     - `https://ai-customerservice-production.up.railway.app/auth/shopify/callback`

### **Step 3: Configure App Settings**
1. **Go to "App setup"** tab
2. **Set the following URLs**:
   - **App URL**: `https://ai-customerservice-production.up.railway.app/app`
   - **Allowed redirection URLs**: 
     - `https://ai-customerservice-production.up.railway.app/auth/callback`
     - `https://ai-customerservice-production.up.railway.app/auth/shopify/callback`

### **Step 4: Get Your Credentials**
1. **Copy your Client ID** (this is your `SHOPIFY_API_KEY`)
2. **Copy your Client Secret** (this is your `SHOPIFY_API_SECRET`)
3. **Save these values** - you'll need them for Railway

### **Step 5: Update Railway Environment Variables**
Run these commands with your actual credentials:

```bash
railway variables --set SHOPIFY_API_KEY=your_client_id_here
railway variables --set SHOPIFY_API_SECRET=your_client_secret_here
```

### **Step 6: Install App on Your Store**
1. **Go to your Shopify admin**
2. **Navigate to Apps**
3. **Click "Develop apps"**
4. **Find your app** and click "Install"
5. **Grant permissions** when prompted

## ✅ **That's It!**

Your AI Support Bot will now work on your Shopify store. The chat widget will appear automatically on your storefront.

## 🆘 **Need Help?**

If you encounter any issues:
1. **Check Railway logs**: `railway logs`
2. **Verify environment variables**: `railway variables`
3. **Test the app URL**: Visit your Railway app URL in a browser

## 📞 **Quick Commands**

```bash
# Check Railway status
railway status

# View logs
railway logs

# Update variables
railway variables --set VARIABLE_NAME=value

# Open Railway dashboard
railway open
```
