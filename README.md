# 🤖 Shopify AI Support Bot

A production-ready Shopify app that provides AI-powered customer support using Claude (Anthropic). Features embedded admin UI, theme app extension, billing, and GDPR compliance.

## 🚀 Features

- **AI-Powered Support**: Uses Claude Sonnet 4.5 for intelligent, context-aware responses
- **Theme App Extension**: Native Shopify theme integration (no script tags)
- **Embedded Admin UI**: Built with Polaris and App Bridge
- **Billing Integration**: GraphQL billing with trials and subscriptions
- **GDPR Compliant**: Full data management and deletion capabilities
- **Production Ready**: Security, monitoring, and error handling

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Shopify Partner account
- Claude API key (Anthropic)
- Railway account (for hosting)

## 🛠️ Local Development

### 1. Clone and Setup

```bash
git clone https://github.com/Parsarf/AI-costumer-service.git
cd AI-costumer-service/backend
npm install
```

### 2. Environment Configuration

Create `.env` file:

```bash
cp env.example .env
```

Update `.env` with your credentials:

```env
# App Configuration
APP_URL=https://your-app.railway.app
NODE_ENV=development
PORT=3001

# Shopify App Credentials
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SCOPES=read_products,read_orders,read_customers,write_themes

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/shopify_support_bot

# AI Service
ANTHROPIC_API_KEY=sk-ant-api03-...

# Security
JWT_SECRET=your_jwt_secret_change_in_production
ENCRYPTION_KEY=your_32_character_encryption_key

# Billing Configuration
BILLING_PRICE=9.99
BILLING_TRIAL_DAYS=7
SHOPIFY_BILLING_TEST=true
FREE_PLAN=false
```

### 3. Database Setup

```bash
# Create database
createdb shopify_support_bot

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Setup Shopify App

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com)
2. Create new app
3. Set URLs:
   - **App URL**: `https://your-ngrok-url.ngrok.io`
   - **Allowed redirection URL**: `https://your-ngrok-url.ngrok.io/auth/callback`
4. Add webhook subscriptions:
   - `app/uninstalled` → `https://your-ngrok-url.ngrok.io/webhooks/app_uninstalled`
   - `customers/data_request` → `https://your-ngrok-url.ngrok.io/webhooks/customers/data_request`
   - `customers/redact` → `https://your-ngrok-url.ngrok.io/webhooks/customers/redact`
   - `shop/redact` → `https://your-ngrok-url.ngrok.io/webhooks/shop/redact`

### 6. Test Installation

Visit: `https://your-ngrok-url.ngrok.io/auth?shop=your-dev-store.myshopify.com`

## 🚢 Production Deployment

### Deploy to Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**:
   ```bash
   railway login
   cd backend
   railway init
   ```

3. **Add PostgreSQL**:
   ```bash
   railway add postgresql
   ```

4. **Set Environment Variables**:
   ```bash
   railway variables set SHOPIFY_API_KEY=your_key
   railway variables set SHOPIFY_API_SECRET=your_secret
   railway variables set ANTHROPIC_API_KEY=your_claude_key
   railway variables set JWT_SECRET=your_jwt_secret
   railway variables set ENCRYPTION_KEY=your_encryption_key
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

6. **Run Migrations**:
   ```bash
   railway run npx prisma migrate deploy
   ```

7. **Get Your URL**:
   ```bash
   railway domain
   ```

### Update Shopify App URLs

Update your app URLs in Shopify Partners Dashboard:
- **App URL**: `https://your-app.railway.app`
- **Redirect URL**: `https://your-app.railway.app/auth/callback`

## 🎨 Theme App Extension

### Deploy Extension

```bash
# Install Shopify CLI
npm install -g @shopify/cli

# Login to Shopify
shopify auth login

# Deploy extension
cd extensions/assistant-widget
shopify app generate extension
shopify app deploy
```

### Add to Theme

1. Go to **Online Store** → **Themes**
2. Click **Customize** on your active theme
3. Go to **App embeds**
4. Enable **AI Support Assistant**
5. Configure colors and position
6. Save

## 💰 Billing Configuration

The app uses Shopify's GraphQL Billing API:

- **Trial Period**: 7 days (configurable)
- **Price**: $9.99/month (configurable)
- **Test Mode**: Enabled in development

### Billing Endpoints

- `POST /billing/ensure` - Create subscription
- `GET /billing/status` - Check billing status

## 🔒 Security Features

- **HMAC Verification**: All webhooks verified
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS Protection**: Only allows Shopify domains
- **Input Validation**: All inputs sanitized
- **Error Handling**: Comprehensive error management

## 📊 API Endpoints

### Authentication
- `GET /auth` - Initiate OAuth
- `GET /auth/callback` - OAuth callback

### App
- `GET /app` - Embedded admin interface

### Chat API
- `POST /api/chat` - Send message (embedded app)
- `POST /aibot/chat` - Send message (storefront via app proxy)

### Billing
- `POST /billing/ensure` - Create subscription
- `GET /billing/status` - Get billing status

### Webhooks
- `POST /webhooks/app_uninstalled` - App uninstalled
- `POST /webhooks/customers/data_request` - GDPR data request
- `POST /webhooks/customers/redact` - GDPR customer redact
- `POST /webhooks/shop/redact` - GDPR shop redact

### Health
- `GET /health` - Health check
- `GET /ready` - Readiness check

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test Webhooks Locally

```bash
# Test app uninstalled
curl -X POST http://localhost:3001/webhooks/app_uninstalled \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: test_signature" \
  -d '{}'

# Test customer data request
curl -X POST http://localhost:3001/webhooks/customers/data_request \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: test_signature" \
  -d '{"customer": {"email": "test@example.com"}}'
```

## 📱 Mobile Support

The theme app extension is fully responsive and works on:
- Desktop browsers
- Mobile Safari (iOS)
- Mobile Chrome (Android)
- Tablet devices

## 🔧 Configuration

### Store Settings

Configure via the embedded admin app:

```javascript
{
  "welcomeMessage": "Hi! How can I help you today?",
  "returnPolicy": "30 day returns...",
  "shippingPolicy": "Ships in 1-2 days...",
  "supportEmail": "support@store.com",
  "botPersonality": "friendly", // friendly, professional, efficient
  "theme": {
    "primaryColor": "#4F46E5",
    "position": "bottom-right"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**OAuth fails**:
- Check APP_URL matches Shopify settings exactly
- Verify API keys are correct
- Ensure redirect URL is whitelisted

**Widget not loading**:
- Verify theme app extension is deployed
- Check app proxy configuration
- Ensure billing is active

**Database errors**:
- Run `npm run prisma:migrate`
- Check DATABASE_URL is correct
- Verify PostgreSQL is running

**Claude API errors**:
- Verify ANTHROPIC_API_KEY is correct
- Check API usage limits
- Ensure billing is active

### Debug Mode

Set `NODE_ENV=development` for detailed logging.

## 📈 Monitoring

### Health Checks

- **Health**: `GET /health` - Basic health check
- **Ready**: `GET /ready` - Database connectivity check

### Logging

Uses Winston for structured logging:
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Console output in development

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See `/docs` directory
- **Issues**: [GitHub Issues](https://github.com/Parsarf/AI-costumer-service/issues)
- **Email**: support@yourdomain.com

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Custom AI training
- [ ] Integration with other support tools
- [ ] Voice support
- [ ] Proactive messaging

---

**Built with ❤️ for the Shopify merchant community**