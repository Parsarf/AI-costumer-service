# Deployment Guide

## Overview

This guide covers deploying the Shopify AI Support Bot to production using Railway.app, including database setup, environment configuration, and monitoring.

## Prerequisites

- Railway.app account
- GitHub repository with the code
- Shopify Partner account
- Anthropic API key
- PostgreSQL database (Railway provides this)

## 1. Railway Setup

### 1.1 Create New Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `Parsarf/AI-costumer-service`
5. Click "Deploy Now"

### 1.2 Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Wait for database to be provisioned
4. Note the connection details

## 2. Environment Configuration

### 2.1 Required Environment Variables

Set these in Railway's environment variables section:

```bash
# App Configuration
APP_URL=https://your-app.railway.app
NODE_ENV=production
PORT=3001

# Shopify App Credentials
SHOPIFY_API_KEY=your_32_character_hex_api_key
SHOPIFY_API_SECRET=your_32_character_hex_secret
SCOPES=read_products,read_orders,read_customers,write_themes

# Database (Auto-provided by Railway)
DATABASE_URL=postgresql://postgres:password@host:5432/railway

# AI Service
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here

# Security
JWT_SECRET=your_secure_jwt_secret_here
ENCRYPTION_KEY=your_64_character_hex_encryption_key

# Billing Configuration
BILLING_PRICE=9.99
BILLING_TRIAL_DAYS=7
SHOPIFY_BILLING_TEST=false
FREE_PLAN=false

# Logging
LOG_LEVEL=info
```

### 2.2 Generate Encryption Key

```bash
# Generate a 64-character hex encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 Generate JWT Secret

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 3. Database Setup

### 3.1 Run Migrations

The app will automatically run migrations on startup, but you can also run them manually:

```bash
# Connect to your Railway database
railway connect

# Run migrations
npm run migrate
```

### 3.2 Verify Database Schema

```bash
# Check migration status
npm run migrate:status

# Connect to database and verify tables
railway connect
psql -c "\dt"
```

## 4. Shopify App Configuration

### 4.1 Update App URLs

In your Shopify Partner Dashboard:

1. Go to your app settings
2. Update the following URLs:
   - **App URL:** `https://your-app.railway.app/app`
   - **Allowed redirection URLs:** `https://your-app.railway.app/auth/callback`
   - **Webhook API version:** `2024-10`

### 4.2 Configure Webhooks

The app automatically registers these webhooks:

- `APP_UNINSTALLED`: `https://your-app.railway.app/webhooks/app/uninstalled`
- `CUSTOMERS_DATA_REQUEST`: `https://your-app.railway.app/webhooks/customers/data_request`
- `CUSTOMERS_REDACT`: `https://your-app.railway.app/webhooks/customers/redact`
- `SHOP_REDACT`: `https://your-app.railway.app/webhooks/shop/redact`

### 4.3 App Proxy Configuration

1. In Partner Dashboard, go to "App setup"
2. Add App Proxy:
   - **Subpath prefix:** `aibot`
   - **Subpath:** `chat`
   - **URL:** `https://your-app.railway.app/aibot/chat`

## 5. Theme App Extension Deployment

### 5.1 Build Widget

```bash
# Navigate to chat widget directory
cd chat-widget

# Install dependencies
npm install

# Build for production
npm run build-extension
```

### 5.2 Deploy Extension

```bash
# Install Shopify CLI
npm install -g @shopify/cli

# Login to Shopify
shopify login

# Deploy the extension
shopify app deploy
```

## 6. Monitoring and Logs

### 6.1 Railway Monitoring

1. Go to your Railway project dashboard
2. Click on your service
3. View logs, metrics, and health status
4. Set up alerts for errors

### 6.2 Health Checks

Monitor these endpoints:

- **Health:** `https://your-app.railway.app/health`
- **Readiness:** `https://your-app.railway.app/ready`

### 6.3 Log Monitoring

```bash
# View real-time logs
railway logs

# View specific service logs
railway logs --service your-service-name
```

## 7. Security Checklist

### 7.1 Environment Security

- [ ] All environment variables are set
- [ ] `NODE_ENV=production`
- [ ] `SHOPIFY_BILLING_TEST=false`
- [ ] `FREE_PLAN=false`
- [ ] Strong `JWT_SECRET` generated
- [ ] Strong `ENCRYPTION_KEY` generated

### 7.2 App Security

- [ ] HTTPS enforced (Railway handles this)
- [ ] Rate limiting enabled
- [ ] Input validation enabled
- [ ] Access tokens encrypted
- [ ] CORS properly configured

### 7.3 Database Security

- [ ] Database credentials are secure
- [ ] Migrations have been run
- [ ] Access tokens are encrypted in database

## 8. Performance Optimization

### 8.1 Railway Configuration

1. **Scaling:**
   - Set minimum instances to 1
   - Enable auto-scaling based on CPU/memory
   - Set maximum instances based on expected load

2. **Resource Limits:**
   - Memory: 512MB minimum
   - CPU: 1 vCPU minimum

### 8.2 Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_conversations_shop_created ON conversations(shop, created_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_shops_shop_active ON shops(shop, is_active);
```

## 9. Backup and Recovery

### 9.1 Database Backups

Railway automatically handles database backups, but you can also:

```bash
# Create manual backup
railway connect
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 9.2 Environment Backup

Export your environment variables:

```bash
# Save environment variables
railway variables > .env.backup
```

## 10. Troubleshooting

### 10.1 Common Issues

**App not loading:**
- Check environment variables
- Verify database connection
- Check logs for errors

**Webhooks not working:**
- Verify webhook URLs in Partner Dashboard
- Check HMAC verification
- Ensure webhook endpoints are accessible

**Billing not working:**
- Verify `SHOPIFY_BILLING_TEST=false`
- Check billing webhook configuration
- Verify GraphQL permissions

### 10.2 Debug Commands

```bash
# Check app health
curl https://your-app.railway.app/health

# Check readiness
curl https://your-app.railway.app/ready

# Test database connection
railway connect
psql -c "SELECT 1;"

# View recent logs
railway logs --tail 100
```

### 10.3 Support

- **Railway Support:** [Railway Discord](https://discord.gg/railway)
- **Shopify Support:** [Shopify Partners](https://partners.shopify.com/support)
- **App Issues:** Check GitHub Issues

## 11. Production Checklist

### 11.1 Pre-Launch

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Theme extension deployed
- [ ] Webhooks registered
- [ ] Health checks passing
- [ ] Security review completed

### 11.2 Post-Launch

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify billing functionality
- [ ] Test webhook delivery
- [ ] Monitor resource usage
- [ ] Set up alerts

## 12. Scaling Considerations

### 12.1 Horizontal Scaling

- Railway automatically scales based on load
- Database connection pooling is handled by Prisma
- Stateless design allows multiple instances

### 12.2 Vertical Scaling

- Increase memory/CPU in Railway dashboard
- Monitor database performance
- Consider read replicas for high read loads

### 12.3 Cost Optimization

- Monitor resource usage
- Set appropriate scaling limits
- Use database connection pooling
- Implement caching where appropriate

## 13. Maintenance

### 13.1 Regular Tasks

- Monitor logs for errors
- Check database performance
- Update dependencies
- Review security settings
- Backup important data

### 13.2 Updates

```bash
# Update dependencies
npm update

# Run tests
npm test

# Deploy updates
git push origin main
```

This deployment guide ensures your Shopify AI Support Bot is production-ready and properly configured for the Shopify App Store.