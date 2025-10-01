# 🤖 Shopify AI Customer Support Bot

A production-ready Shopify app that provides AI-powered customer support using Claude (Anthropic). Handles order tracking, returns, product questions, and automatically escalates complex issues to human support.

## 🎯 Features

- **AI-Powered Support**: Uses Claude Sonnet 4.5 for intelligent, context-aware responses
- **Order Tracking**: Automatically fetches and shares order status from Shopify
- **Product Information**: Queries product catalog to answer customer questions
- **Smart Escalation**: Detects when human intervention is needed
- **24/7 Availability**: Always available to help customers
- **Customizable**: Store owners can customize policies, tone, and appearance
- **Analytics Dashboard**: Track conversations, escalations, and performance
- **GDPR Compliant**: Full data management and deletion capabilities

## 📋 Requirements

- Node.js 18+
- PostgreSQL 14+
- Shopify Partner Account
- Claude API Key (from Anthropic)
- Railway account (or similar hosting)

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/shopify-support-bot.git
cd shopify-support-bot

# Install backend dependencies
cd backend
npm install

# Install widget dependencies
cd ../chat-widget
npm install
```

### 2. Setup Environment Variables

Create `backend/.env` (copy from `backend/env.example`):

```bash
# Shopify Credentials
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_secret
SHOPIFY_SCOPES=read_orders,read_products,read_customers,write_script_tags

# App URL
APP_URL=http://localhost:3001

# Claude API
CLAUDE_API_KEY=sk-ant-api03-...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/shopify_support_bot

# Optional
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
JWT_SECRET=your_secret
WIDGET_URL=http://localhost:3000
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb shopify_support_bot

# Run migrations
cd backend
npm run migrate
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Widget
cd chat-widget
npm start

# Terminal 3 - Ngrok (for Shopify OAuth)
ngrok http 3001
```

### 5. Configure Shopify App

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com)
2. Create new app
3. Set App URL to your ngrok URL: `https://abc123.ngrok.io`
4. Set Redirect URL: `https://abc123.ngrok.io/auth/callback`
5. Request scopes: `read_orders`, `read_products`, `read_customers`, `write_script_tags`

### 6. Test Installation

Visit: `https://your-ngrok-url.ngrok.io/auth?shop=your-dev-store.myshopify.com`

## 📁 Project Structure

```
shopify-support-bot/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Shopify config
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, rate limiting, etc.
│   │   └── utils/           # Helper functions
│   ├── migrations/          # SQL migrations
│   └── server.js            # Entry point
│
├── chat-widget/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API calls
│   │   └── styles/          # CSS
│   └── public/
│       └── widget-loader.js # Script tag loader
│
└── docs/
    ├── API.md               # API documentation
    ├── DEPLOYMENT.md        # Deployment guide
    └── SHOPIFY_SUBMISSION.md # App Store submission
```

## 🔧 Configuration

### Store Settings (via API)

```javascript
PUT /api/settings/:shop
{
  "settings": {
    "welcomeMessage": "Hi! How can I help?",
    "returnPolicy": "30 day returns...",
    "shippingPolicy": "Ships in 1-2 days...",
    "supportEmail": "support@store.com",
    "botPersonality": "friendly", // friendly, professional, efficient
    "theme": {
      "primaryColor": "#4F46E5",
      "position": "bottom-right"
    }
  }
}
```

## 📊 API Endpoints

### Authentication
- `GET /auth` - Initiate OAuth
- `GET /auth/callback` - OAuth callback
- `GET /auth/verify` - Verify authentication

### Chat
- `POST /api/chat` - Send message
- `GET /api/chat/conversation/:id` - Get conversation
- `GET /api/chat/welcome` - Get welcome message

### Settings
- `GET /api/settings/:shop` - Get settings
- `PUT /api/settings/:shop` - Update settings

### Analytics
- `GET /api/analytics/:shop` - Get analytics
- `GET /api/analytics/:shop/conversations` - Get conversations
- `GET /api/analytics/:shop/dashboard` - Dashboard summary

### Webhooks (GDPR)
- `POST /webhooks/app/uninstalled` - App uninstalled
- `POST /webhooks/customers/data_request` - Data request
- `POST /webhooks/customers/redact` - Delete customer data
- `POST /webhooks/shop/redact` - Delete shop data

## 🚢 Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Add PostgreSQL
railway add

# Set environment variables
railway variables set SHOPIFY_API_KEY=xxx
railway variables set SHOPIFY_API_SECRET=xxx
railway variables set CLAUDE_API_KEY=xxx

# Deploy
railway up

# Get URL
railway domain
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Widget tests
cd chat-widget
npm test
```

## 📈 Monitoring

- **Logs**: View in Railway dashboard or via `railway logs`
- **Metrics**: Track conversation count, escalation rate, response time
- **Alerts**: Set up alerts for errors, high escalation rates

## 💰 Pricing Tiers

- **Starter ($199/mo)**: 1,000 conversations/month
- **Pro ($399/mo)**: 5,000 conversations/month
- **Scale ($799/mo)**: Unlimited conversations

## 🔒 Security

- HMAC verification for all Shopify webhooks
- Encrypted access tokens
- Rate limiting on all endpoints
- Input validation and sanitization
- GDPR compliance

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📞 Support

- Documentation: [Full docs](docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/shopify-support-bot/issues)
- Email: support@yourdomain.com

## 🎉 Acknowledgments

- [Anthropic Claude](https://anthropic.com) for AI capabilities
- [Shopify](https://shopify.dev) for e-commerce platform
- [Railway](https://railway.app) for hosting

---

Built with ❤️ for the Shopify merchant community

