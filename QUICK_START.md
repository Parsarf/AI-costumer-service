# 🚀 Quick Start Guide

Get your Shopify AI Support Bot up and running in minutes!

## ⚡ Fast Track Setup

### 1. Prerequisites

Before starting, get these ready:

- ✅ [Shopify Partner Account](https://partners.shopify.com/signup)
- ✅ [Claude API Key](https://console.anthropic.com) 
- ✅ [Railway Account](https://railway.app) (for hosting)
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed (for local dev)

---

### 2. Get API Keys

#### Shopify API Keys

1. Go to https://partners.shopify.com
2. Apps → Create app → Custom app
3. Note your **API Key** and **API Secret**

#### Claude API Key

1. Go to https://console.anthropic.com
2. Get API access
3. Generate an API key (starts with `sk-ant-api03-...`)

---

### 3. Local Development Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd shopify-support-bot

# Install dependencies
cd backend && npm install
cd ../chat-widget && npm install

# Create environment file
cd backend
cp env.example .env

# Edit .env with your keys
# SHOPIFY_API_KEY=your_key
# SHOPIFY_API_SECRET=your_secret
# CLAUDE_API_KEY=sk-ant-api03-...
# DATABASE_URL=postgresql://localhost/shopify_support_bot

# Setup database
createdb shopify_support_bot
npm run migrate
```

---

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Widget:**
```bash
cd chat-widget
npm start
```

**Terminal 3 - Ngrok (for Shopify OAuth):**
```bash
ngrok http 3001
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

---

### 5. Configure Shopify App

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com)
2. Your App → App setup
3. Update URLs:
   - **App URL**: `https://abc123.ngrok.io`
   - **Allowed redirection URL**: `https://abc123.ngrok.io/auth/callback`
4. Scopes: `read_orders`, `read_products`, `read_customers`, `write_script_tags`

---

### 6. Test Installation

Visit: `https://abc123.ngrok.io/auth?shop=your-dev-store.myshopify.com`

You should:
1. See Shopify OAuth screen
2. Click "Install"
3. See success page
4. Widget appears on your store! 🎉

---

## 🚢 Deploy to Production

### Quick Deploy (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd backend
railway init
railway add  # Select PostgreSQL

# Set environment variables
railway variables set SHOPIFY_API_KEY=your_key
railway variables set SHOPIFY_API_SECRET=your_secret
railway variables set CLAUDE_API_KEY=your_claude_key
railway variables set SHOPIFY_SCOPES=read_orders,read_products,read_customers,write_script_tags

# Get your URL
railway domain
# Example output: shopify-bot-production.up.railway.app

# Set APP_URL
railway variables set APP_URL=https://shopify-bot-production.up.railway.app

# Deploy
railway up

# Run migrations
railway run npm run migrate
```

### Update Shopify URLs

Update your app URLs to the Railway domain:
- **App URL**: `https://your-app.railway.app`
- **Redirect URL**: `https://your-app.railway.app/auth/callback`

---

## ✅ Verify Everything Works

### 1. Health Check
```bash
curl https://your-app.railway.app/health
```

Expected:
```json
{"status": "healthy", "timestamp": "...", "version": "1.0.0"}
```

### 2. Install on Test Store

Visit: `https://your-app.railway.app/auth?shop=your-store.myshopify.com`

### 3. Test the Widget

1. Go to your store
2. Look for chat bubble (bottom-right)
3. Click and send a message
4. AI should respond!

### 4. Check Database

```bash
railway connect postgres

# In psql:
\dt                    # List tables
SELECT * FROM stores;  # View installed stores
```

---

## 🎨 Customize Your Bot

### Update Welcome Message

```bash
curl -X PUT https://your-app.railway.app/api/settings/your-store.myshopify.com \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "welcomeMessage": "Hi! 👋 How can I help you today?",
      "returnPolicy": "We accept returns within 30 days...",
      "shippingPolicy": "We ship within 1-2 business days...",
      "botPersonality": "friendly"
    }
  }'
```

### Change Widget Color

```bash
curl -X PUT https://your-app.railway.app/api/settings/your-store.myshopify.com/theme \
  -H "Content-Type: application/json" \
  -d '{
    "theme": {
      "primaryColor": "#10B981",
      "position": "bottom-left"
    }
  }'
```

---

## 📊 View Analytics

```bash
# Get dashboard summary
curl https://your-app.railway.app/api/analytics/your-store.myshopify.com/dashboard

# Get conversations
curl https://your-app.railway.app/api/analytics/your-store.myshopify.com/conversations
```

---

## 🐛 Troubleshooting

### Issue: OAuth fails

**Check:**
1. ✅ APP_URL matches Shopify settings exactly
2. ✅ Redirect URL is whitelisted
3. ✅ API keys are correct

**Debug:**
```bash
railway logs | grep "OAuth"
```

### Issue: Widget not loading

**Check:**
1. ✅ Script tag is installed
2. ✅ Widget is built (`cd chat-widget && npm run build`)
3. ✅ CORS is configured

**Debug:**
Visit: `https://your-app.railway.app/widget/loader.js`

### Issue: Claude not responding

**Check:**
1. ✅ CLAUDE_API_KEY is correct
2. ✅ API key has credits
3. ✅ No rate limits hit

**Debug:**
```bash
railway logs | grep "Claude"
```

### Issue: Database connection fails

**Check:**
1. ✅ DATABASE_URL is set
2. ✅ Migrations have run

**Fix:**
```bash
railway run npm run migrate
```

---

## 🎯 Next Steps

### Week 1: Polish & Test
- [ ] Test on multiple themes
- [ ] Test on mobile devices
- [ ] Customize welcome message
- [ ] Set up store policies
- [ ] Test order tracking
- [ ] Test escalation flow

### Week 2: Prepare for Launch
- [ ] Create screenshots (5-8)
- [ ] Record demo video (30-90 sec)
- [ ] Write app description
- [ ] Set up privacy policy
- [ ] Configure webhooks
- [ ] Set pricing tiers

### Week 3-4: Submit to Shopify
- [ ] Submit app listing
- [ ] Wait for review (2-4 weeks)
- [ ] Address feedback
- [ ] Get approved! 🎉

### Post-Launch
- [ ] Monitor performance
- [ ] Collect user feedback
- [ ] Add requested features
- [ ] Scale infrastructure
- [ ] Market your app

---

## 📚 Documentation

- **Full Documentation**: See [README.md](README.md)
- **API Reference**: See [docs/API.md](docs/API.md)
- **Deployment Guide**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **App Store Submission**: See [docs/SHOPIFY_SUBMISSION.md](docs/SHOPIFY_SUBMISSION.md)

---

## 🆘 Get Help

### Resources
- Shopify Dev Docs: https://shopify.dev
- Claude API Docs: https://docs.anthropic.com
- Railway Docs: https://docs.railway.app

### Issues
- Check existing issues on GitHub
- Create new issue with details
- Email: support@yourdomain.com

---

## 🎉 Success Checklist

- [ ] Local development working
- [ ] Deployed to Railway
- [ ] Installed on test store
- [ ] Widget appears and works
- [ ] Messages sent and received
- [ ] Order tracking tested
- [ ] Settings customized
- [ ] Analytics showing data
- [ ] Mobile tested
- [ ] Ready for Shopify submission!

---

**You're ready to go! Build something amazing! 🚀**

Need help? See the full docs or reach out to support.

