# API Documentation

## Overview

The Shopify AI Support Bot API provides endpoints for chat functionality, settings management, billing, analytics, and webhooks.

**Base URL:** `https://your-app.railway.app`

## Authentication

### OAuth Flow

1. **Initiate OAuth**
   ```
   GET /auth?shop=example.myshopify.com
   ```
   - Redirects to Shopify OAuth
   - Returns: Redirect to Shopify authorization page

2. **OAuth Callback**
   ```
   GET /auth/callback?code=xxx&shop=example.myshopify.com&state=xxx
   ```
   - Handled automatically by Shopify
   - Returns: Redirect to embedded app

3. **Verify Authentication**
   ```
   GET /auth/verify?shop=example.myshopify.com
   ```
   - Returns: `{ authenticated: boolean, shop: string, storeName: string }`

## Chat API

### Send Message (Embedded App)
```
POST /api/chat?shop=example.myshopify.com
```

**Request Body:**
```json
{
  "message": "I need help with my order",
  "conversationId": "optional-conversation-id"
}
```

**Response:**
```json
{
  "reply": "I'd be happy to help you with your order!",
  "conversationId": "conv_123456",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 75
  }
}
```

**Rate Limits:** 20 requests per minute per shop

### Send Message (Storefront via App Proxy)
```
POST /apps/aibot/chat?shop=example.myshopify.com&timestamp=1234567890&signature=xxx
```

**Request Body:** Same as embedded app

**Response:** Same as embedded app

**Rate Limits:** 20 requests per minute per shop

## Settings API

### Get Settings
```
GET /api/settings?shop=example.myshopify.com
```

**Response:**
```json
{
  "shop": "example.myshopify.com",
  "plan": "paid",
  "settings": {
    "welcomeMessage": "Hi! How can I help you today?",
    "returnPolicy": "30 day returns...",
    "shippingPolicy": "Ships in 1-2 days...",
    "supportEmail": "support@store.com",
    "botPersonality": "friendly",
    "primaryColor": "#4F46E5"
  },
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Settings
```
PUT /api/settings?shop=example.myshopify.com
```

**Request Body:**
```json
{
  "settings": {
    "welcomeMessage": "Hello! How can I assist you?",
    "returnPolicy": "Updated return policy...",
    "shippingPolicy": "Updated shipping policy...",
    "supportEmail": "help@store.com",
    "botPersonality": "professional",
    "primaryColor": "#FF6B6B"
  }
}
```

**Response:**
```json
{
  "success": true,
  "settings": { /* updated settings */ }
}
```

## Billing API

### Create Subscription
```
POST /billing/create?shop=example.myshopify.com&plan=starter
```

**Query Parameters:**
- `plan`: `starter` | `pro` | `scale` (default: `starter`)

**Response:**
```json
{
  "hasActiveSubscription": false,
  "confirmationUrl": "https://shopify.com/...",
  "subscription": {
    "id": "sub_123456",
    "name": "AI Support Bot - Starter Plan",
    "status": "PENDING",
    "price": 19.99,
    "currency": "USD",
    "trialDays": 7,
    "test": true
  }
}
```

### Billing Callback
```
GET /billing/callback?shop=example.myshopify.com
```

**Response:** Redirect to embedded app with billing status

### Cancel Subscription
```
POST /billing/cancel?shop=example.myshopify.com
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

### Get Billing Status
```
GET /billing/status?shop=example.myshopify.com
```

**Response:**
```json
{
  "hasAccess": true,
  "plan": "starter",
  "status": "active",
  "trialEndsAt": "2024-01-08T00:00:00.000Z",
  "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
  "price": 19.99,
  "currency": "USD",
  "message": "Subscription active"
}
```

## Analytics API

### Get Analytics
```
GET /api/analytics?shop=example.myshopify.com
```

**Response:**
```json
{
  "totalConversations": 150,
  "escalatedConversations": 12,
  "escalationRate": "8.0",
  "averageResponseTime": 2.5,
  "recentConversations": 45,
  "dailyData": [
    { "date": "2024-01-01", "count": 5 },
    { "date": "2024-01-02", "count": 8 },
    // ... last 7 days
  ],
  "topIssues": [
    {
      "prompt": "I need to return my order...",
      "count": 15
    }
  ],
  "lastUpdated": "2024-01-08T12:00:00.000Z"
}
```

### Get Conversations
```
GET /api/analytics/conversations?shop=example.myshopify.com&limit=10&offset=0
```

**Query Parameters:**
- `limit`: Number of conversations to return (default: 10)
- `offset`: Number of conversations to skip (default: 0)

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv_123456",
      "prompt": "I need help with my order",
      "reply": "I'd be happy to help...",
      "createdAt": "2024-01-08T12:00:00.000Z",
      "updatedAt": "2024-01-08T12:01:00.000Z",
      "metadata": {
        "escalated": false,
        "orderNumber": "1001"
      }
    }
  ],
  "totalCount": 150,
  "hasMore": true
}
```

## Webhooks

All webhooks require HMAC verification using the `X-Shopify-Hmac-Sha256` header.

### App Uninstalled
```
POST /webhooks/app/uninstalled
```

**Headers:**
- `X-Shopify-Hmac-Sha256`: HMAC signature
- `X-Shopify-Shop-Domain`: Shop domain

**Response:** `200 OK`

### Customer Data Request (GDPR)
```
POST /webhooks/customers/data_request
```

**Headers:**
- `X-Shopify-Hmac-Sha256`: HMAC signature
- `X-Shopify-Shop-Domain`: Shop domain

**Request Body:**
```json
{
  "customer": {
    "id": 123456,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Response:** `200 OK`

### Customer Redact (GDPR)
```
POST /webhooks/customers/redact
```

**Headers:** Same as data request

**Request Body:** Same as data request

**Response:** `200 OK`

### Shop Redact (GDPR)
```
POST /webhooks/shop/redact
```

**Headers:**
- `X-Shopify-Hmac-Sha256`: HMAC signature

**Request Body:**
```json
{
  "shop_domain": "example.myshopify.com",
  "shop_id": 123456
}
```

**Response:** `200 OK`

## Health Checks

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-08T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {
    "rss": 50000000,
    "heapTotal": 20000000,
    "heapUsed": 15000000
  },
  "environment": "production"
}
```

### Readiness Check
```
GET /ready
```

**Response:**
```json
{
  "status": "ready",
  "checks": {
    "database": true,
    "claude": true,
    "timestamp": "2024-01-08T12:00:00.000Z"
  },
  "message": "All dependencies are healthy"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required parameters",
  "details": "shop parameter is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid webhook signature"
}
```

### 402 Payment Required
```json
{
  "error": "Payment Required",
  "message": "Please upgrade your plan to use the AI support bot.",
  "plan": "free",
  "status": "inactive",
  "upgradeUrl": "https://your-app.railway.app/app?shop=example.myshopify.com&billing=upgrade"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "Please try again later",
  "retryAfter": "15 minutes"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message (development only)"
}
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/*` | 100 requests | 15 minutes |
| `/api/chat` | 20 requests | 1 minute |
| `/auth/*` | 10 requests | 15 minutes |
| `/webhooks/*` | 60 requests | 1 minute |
| `/billing/*` | 3 requests | 5 minutes |

## Security

- All requests must use HTTPS in production
- Webhooks require HMAC verification
- Access tokens are encrypted in the database
- Rate limiting prevents abuse
- Input validation prevents XSS and injection attacks
- CORS is configured for Shopify domains only

## Examples

### cURL Examples

**Send Chat Message:**
```bash
curl -X POST "https://your-app.railway.app/api/chat?shop=example.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{"message": "I need help with my order"}'
```

**Get Settings:**
```bash
curl "https://your-app.railway.app/api/settings?shop=example.myshopify.com"
```

**Create Subscription:**
```bash
curl -X POST "https://your-app.railway.app/billing/create?shop=example.myshopify.com&plan=starter"
```

**Health Check:**
```bash
curl "https://your-app.railway.app/health"
```