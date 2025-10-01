# Deployment Guide

Complete guide to deploying the Shopify AI Customer Support Bot to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Deployment](#railway-deployment)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Domain Configuration](#domain-configuration)
6. [Shopify App Configuration](#shopify-app-configuration)
7. [Post-Deployment](#post-deployment)
8. [Alternative Hosting](#alternative-hosting)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Railway account (or alternative hosting provider)
- ✅ Shopify Partners account
- ✅ Claude API key from Anthropic
- ✅ Domain name (optional, but recommended)
- ✅ Git repository with your code

---

## Railway Deployment

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open a browser window for authentication.

### Step 3: Initialize Project

```bash
cd backend
railway init
```

Select "Create new project" and name it (e.g., "shopify-support-bot").

### Step 4: Add PostgreSQL Database

```bash
railway add
```

Select **PostgreSQL** from the list. Railway will automatically:
- Provision a PostgreSQL database
- Set the `DATABASE_URL` environment variable

### Step 5: Set Environment Variables

```bash
# Required variables
railway variables set SHOPIFY_API_KEY=your_shopify_api_key
railway variables set SHOPIFY_API_SECRET=your_shopify_api_secret
railway variables set CLAUDE_API_KEY=sk-ant-api03-your_claude_key
railway variables set SHOPIFY_SCOPES=read_orders,read_products,read_customers,write_script_tags

# Optional variables
railway variables set NODE_ENV=production
railway variables set LOG_LEVEL=info
railway variables set JWT_SECRET=$(openssl rand -hex 32)
```

### Step 6: Get Your Public URL

```bash
railway domain
```

This will show your Railway-provided domain (e.g., `shopify-bot-production.up.railway.app`).

### Step 7: Set APP_URL

```bash
railway variables set APP_URL=https://shopify-bot-production.up.railway.app
```

### Step 8: Deploy

```bash
railway up
```

This will:
- Build your application
- Push to Railway
- Deploy automatically

### Step 9: Run Database Migrations

```bash
railway run npm run migrate
```

### Step 10: Monitor Deployment

```bash
# View logs
railway logs

# Check status
railway status
```

---

## Environment Variables

Complete list of environment variables:

### Required

```bash
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_orders,read_products,read_customers,write_script_tags
APP_URL=https://your-app.railway.app
CLAUDE_API_KEY=sk-ant-api03-...
DATABASE_URL=postgresql://... (auto-set by Railway)
```

### Optional

```bash
NODE_ENV=production
PORT=3001 (auto-set by Railway)
LOG_LEVEL=info
JWT_SECRET=your_secret
WIDGET_URL=https://your-app.railway.app/widget
```

---

## Database Setup

### Automatic Setup (Railway)

Railway automatically provisions and connects PostgreSQL. The `DATABASE_URL` is set automatically.

### Manual Migration

If migrations don't run automatically:

```bash
railway run npm run migrate
```

### Verify Database

```bash
railway connect postgres

# In psql shell
\dt  -- List tables
SELECT * FROM stores LIMIT 5;
```

---

## Domain Configuration

### Using Railway Domain (Default)

Railway provides: `your-app-name.up.railway.app`

No additional configuration needed!

### Custom Domain (Recommended)

1. **Add Domain in Railway:**

```bash
railway domain add yourdomain.com
```

2. **Update DNS Records:**

Add these records to your domain registrar:

```
Type: CNAME
Name: @ (or subdomain)
Value: your-app-name.up.railway.app
```

3. **Wait for DNS Propagation** (5-60 minutes)

4. **Update Environment Variable:**

```bash
railway variables set APP_URL=https://yourdomain.com
```

5. **Redeploy:**

```bash
railway up
```

### SSL Certificate

Railway automatically provisions SSL certificates via Let's Encrypt. No action needed!

---

## Shopify App Configuration

### Update App URLs

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com)
2. Navigate to Apps → Your App → App setup
3. Update URLs:

```
App URL: https://your-app.railway.app
Allowed redirection URL(s):
  https://your-app.railway.app/auth/callback
```

### Configure Webhooks

Add webhook subscriptions (App setup → Webhooks):

| Event | URL |
|-------|-----|
| `app/uninstalled` | `https://your-app.railway.app/webhooks/app/uninstalled` |
| `customers/data_request` | `https://your-app.railway.app/webhooks/customers/data_request` |
| `customers/redact` | `https://your-app.railway.app/webhooks/customers/redact` |
| `shop/redact` | `https://your-app.railway.app/webhooks/shop/redact` |

### Update OAuth Scopes

Ensure these scopes are requested:
- `read_orders`
- `read_products`
- `read_customers`
- `write_script_tags`

---

## Post-Deployment

### 1. Test Installation

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 2. Test OAuth Flow

Visit: `https://your-app.railway.app/auth?shop=your-dev-store.myshopify.com`

Should redirect to Shopify authorization page.

### 3. Install on Test Store

1. Complete OAuth flow
2. Verify widget appears on storefront
3. Send test messages
4. Check database for stored conversations

### 4. Monitor Logs

```bash
railway logs --tail
```

Look for:
- ✅ `Database connected successfully`
- ✅ `Shopify Support Bot API running on port...`
- ❌ Any error messages

### 5. Setup Monitoring

Consider adding:
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Log Aggregation**: Logtail, Papertrail

---

## Widget Deployment

### Build Widget for Production

```bash
cd chat-widget
npm run build
```

### Deploy Widget with Backend

The built widget is served from `backend/public/widget/`.

Ensure your backend serves static files:

```javascript
// In server.js
app.use('/widget', express.static('../chat-widget/build'));
```

### Verify Widget Loading

1. Install app on test store
2. Visit storefront
3. Open browser console
4. Look for: "Support Bot Widget initialized"

---

## Alternative Hosting

### Heroku

```bash
# Install Heroku CLI
heroku create shopify-support-bot

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SHOPIFY_API_KEY=xxx
heroku config:set SHOPIFY_API_SECRET=xxx
heroku config:set CLAUDE_API_KEY=xxx

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate

# View logs
heroku logs --tail
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Select Node.js environment
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

### AWS (EC2 + RDS)

Requires more setup:
1. Launch EC2 instance
2. Setup RDS PostgreSQL
3. Configure security groups
4. Install Node.js
5. Setup PM2 or systemd
6. Configure nginx reverse proxy
7. Setup SSL with Let's Encrypt

---

## Continuous Deployment

### Railway (Automatic)

Railway auto-deploys on git push to main branch.

```bash
git push origin main
```

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Database Backups

### Railway Backups

Railway automatically backs up databases daily.

### Manual Backup

```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

### Restore Backup

```bash
railway run psql $DATABASE_URL < backup.sql
```

---

## Scaling

### Vertical Scaling (Railway)

1. Go to Railway dashboard
2. Select your project
3. Settings → Resources
4. Increase memory/CPU

### Horizontal Scaling

For high traffic:
1. Add Redis for session storage
2. Use load balancer
3. Deploy multiple instances
4. Setup database read replicas

---

## Troubleshooting

### Issue: Can't connect to database

**Solution:**
```bash
railway variables get DATABASE_URL
# Verify connection string is correct
railway logs | grep "database"
```

### Issue: Shopify OAuth fails

**Check:**
1. APP_URL matches Shopify settings
2. HMAC verification is working
3. Redirect URL is whitelisted

**Debug:**
```bash
railway logs | grep "OAuth"
```

### Issue: Widget not loading

**Check:**
1. Script tag is installed: Visit Shopify Admin → Online Store → Themes → Actions → Edit code → Search for your script
2. CORS is configured correctly
3. Widget bundle is built

**Debug:**
```bash
# Verify script tag URL
curl https://your-app.railway.app/widget/loader.js
```

### Issue: Claude API errors

**Check:**
1. API key is valid
2. No rate limits hit
3. Billing is active

**Debug:**
```bash
railway logs | grep "Claude"
```

### Issue: High response times

**Solutions:**
1. Enable caching (Redis)
2. Optimize database queries
3. Scale up resources
4. Use connection pooling

---

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] HMAC verification is working
- [ ] Rate limiting is enabled
- [ ] Access tokens are encrypted
- [ ] SSL/HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Input validation is working
- [ ] Webhooks are verified
- [ ] Logs don't contain sensitive data
- [ ] Database backups are enabled

---

## Monitoring Checklist

- [ ] Uptime monitoring setup
- [ ] Error tracking (Sentry) configured
- [ ] Log aggregation working
- [ ] Database metrics tracked
- [ ] API response times monitored
- [ ] Conversation metrics tracked
- [ ] Escalation rate alerts setup

---

## Next Steps

1. ✅ Deploy to production
2. ✅ Test thoroughly on dev store
3. 📝 Prepare App Store submission (see SHOPIFY_SUBMISSION.md)
4. 🚀 Launch!

---

## Support

- Railway Docs: https://docs.railway.app
- Shopify Dev Docs: https://shopify.dev
- Claude API Docs: https://docs.anthropic.com

For issues, contact: support@yourdomain.com

