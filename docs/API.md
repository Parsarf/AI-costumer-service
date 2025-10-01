# API Documentation

Complete API reference for the Shopify AI Customer Support Bot.

## Base URL

```
Production: https://your-app.railway.app
Development: http://localhost:3001
```

## Authentication

Most endpoints require a valid Shopify shop parameter. OAuth authentication is handled via the `/auth` endpoints.

---

## Authentication Endpoints

### Initiate OAuth Flow

```http
GET /auth?shop={shop}
```

**Parameters:**
- `shop` (required): Shopify store domain (e.g., `example.myshopify.com`)

**Response:**
Redirects to Shopify OAuth authorization page.

---

### OAuth Callback

```http
GET /auth/callback?code={code}&shop={shop}&state={state}&hmac={hmac}
```

**Parameters:**
- `code` (required): Authorization code from Shopify
- `shop` (required): Shop domain
- `state` (required): CSRF token
- `hmac` (required): HMAC signature

**Response:**
HTML page confirming installation or error.

---

### Verify Authentication

```http
GET /auth/verify?shop={shop}
```

**Response:**
```json
{
  "authenticated": true,
  "shop": "example.myshopify.com",
  "storeName": "Example Store"
}
```

---

## Chat Endpoints

### Send Message

```http
POST /api/chat
```

**Request Body:**
```json
{
  "message": "Where is my order #1234?",
  "conversationId": "conv_1234567890_abc",
  "shop": "example.myshopify.com",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe"
}
```

**Response:**
```json
{
  "reply": "I found your order #1234! It was shipped on...",
  "conversationId": "conv_1234567890_abc",
  "needsEscalation": false,
  "metadata": {
    "orderData": {
      "orderNumber": "#1234",
      "status": "Fulfilled",
      "total": "99.99"
    },
    "intent": "order_tracking",
    "responseTime": 847
  }
}
```

**Error Response:**
```json
{
  "error": "Failed to process message",
  "reply": "Sorry, I'm having trouble..."
}
```

---

### Get Conversation

```http
GET /api/chat/conversation/{conversationId}?shop={shop}
```

**Response:**
```json
{
  "id": "conv_1234567890_abc",
  "status": "active",
  "escalated": false,
  "customerEmail": "customer@example.com",
  "messages": [
    {
      "role": "user",
      "content": "Where is my order?",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "Let me check that for you...",
      "createdAt": "2024-01-15T10:30:02Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Get Welcome Message

```http
GET /api/chat/welcome?shop={shop}&customerName={name}
```

**Response:**
```json
{
  "message": "Hi John! 👋 Welcome to Example Store...",
  "theme": {
    "primaryColor": "#4F46E5",
    "position": "bottom-right"
  }
}
```

---

## Settings Endpoints

### Get Settings

```http
GET /api/settings/{shop}
```

**Response:**
```json
{
  "shop": "example.myshopify.com",
  "storeName": "Example Store",
  "settings": {
    "welcomeMessage": "Hi! How can I help?",
    "returnPolicy": "30 day returns...",
    "shippingPolicy": "Ships in 1-2 days...",
    "supportEmail": "support@example.com",
    "botPersonality": "friendly",
    "escalationEmail": "escalations@example.com",
    "chatbotEnabled": true,
    "theme": {
      "primaryColor": "#4F46E5",
      "position": "bottom-right"
    }
  },
  "subscription": {
    "tier": "pro",
    "conversationCount": 342,
    "conversationLimit": 5000
  }
}
```

---

### Update Settings

```http
PUT /api/settings/{shop}
```

**Request Body:**
```json
{
  "settings": {
    "welcomeMessage": "Hello! How can we help you today?",
    "botPersonality": "professional",
    "theme": {
      "primaryColor": "#10B981"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "settings": { /* updated settings */ },
  "message": "Settings updated successfully"
}
```

---

### Update Theme

```http
PUT /api/settings/{shop}/theme
```

**Request Body:**
```json
{
  "theme": {
    "primaryColor": "#EF4444",
    "position": "bottom-left"
  }
}
```

---

### Reset Settings

```http
POST /api/settings/{shop}/reset
```

**Response:**
```json
{
  "success": true,
  "settings": { /* default settings */ },
  "message": "Settings reset to default values"
}
```

---

## Analytics Endpoints

### Get Analytics

```http
GET /api/analytics/{shop}?startDate={date}&endDate={date}
```

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "shop": "example.myshopify.com",
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  },
  "analytics": {
    "totalConversations": 1250,
    "escalatedConversations": 85,
    "resolvedConversations": 1100,
    "activeConversations": 65,
    "escalationRate": "6.80",
    "resolutionRate": "88.00",
    "avgMessagesPerConversation": "4.2",
    "avgResponseTime": 823,
    "subscription": {
      "tier": "pro",
      "conversationCount": 1250,
      "conversationLimit": 5000,
      "usagePercentage": "25.00"
    }
  }
}
```

---

### Get Conversations

```http
GET /api/analytics/{shop}/conversations?status={status}&escalated={boolean}&limit={n}&offset={n}
```

**Query Parameters:**
- `status` (optional): `active`, `escalated`, `resolved`, `closed`
- `escalated` (optional): `true` or `false`
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "shop": "example.myshopify.com",
  "conversations": [
    {
      "id": "conv_1234567890_abc",
      "customerEmail": "customer@example.com",
      "customerName": "John Doe",
      "status": "resolved",
      "escalated": false,
      "messageCount": 5,
      "lastMessageAt": "2024-01-15T10:35:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastMessage": {
        "content": "Thank you for your help!",
        "role": "user",
        "createdAt": "2024-01-15T10:35:00Z"
      }
    }
  ],
  "total": 1250
}
```

---

### Get Dashboard Summary

```http
GET /api/analytics/{shop}/dashboard
```

**Response:**
```json
{
  "shop": "example.myshopify.com",
  "storeName": "Example Store",
  "subscription": {
    "tier": "pro",
    "status": "active",
    "conversationCount": 342,
    "conversationLimit": 5000,
    "usagePercentage": "6.84"
  },
  "analytics": {
    "period": "30 days",
    "totalConversations": 342,
    "escalatedConversations": 23,
    "resolvedConversations": 298,
    "activeConversations": 21,
    "escalationRate": "6.73",
    "resolutionRate": "87.13",
    "avgMessagesPerConversation": "4.1",
    "avgResponseTime": 789
  },
  "recentEscalations": [
    {
      "id": "conv_1234567890_abc",
      "customerEmail": "frustrated@customer.com",
      "reason": "Customer explicitly requested human support",
      "createdAt": "2024-01-15T14:20:00Z"
    }
  ]
}
```

---

## Webhook Endpoints

### App Uninstalled

```http
POST /webhooks/app/uninstalled
```

**Headers:**
- `X-Shopify-Shop-Domain`: Shop domain
- `X-Shopify-Hmac-Sha256`: HMAC signature

**Response:**
```json
{
  "message": "Uninstall processed successfully"
}
```

---

### Customer Data Request (GDPR)

```http
POST /webhooks/customers/data_request
```

**Request Body:**
```json
{
  "shop_id": 12345,
  "shop_domain": "example.myshopify.com",
  "customer": {
    "id": 67890,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Response:**
```json
{
  "message": "Data request processed",
  "data": { /* customer data */ }
}
```

---

### Customer Redact (GDPR)

```http
POST /webhooks/customers/redact
```

**Response:**
```json
{
  "message": "Customer data redacted successfully",
  "deletedConversations": 5
}
```

---

### Shop Redact (GDPR)

```http
POST /webhooks/shop/redact
```

**Response:**
```json
{
  "message": "Shop data redacted successfully",
  "deletedConversations": 1250
}
```

---

## Rate Limits

- **Chat Endpoint**: 20 requests/minute per shop
- **API Endpoints**: 100 requests/15 minutes per IP
- **Auth Endpoints**: 10 requests/15 minutes per IP
- **Webhooks**: 60 requests/minute

## Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid authentication)
- `403` - Forbidden (rate limit exceeded, quota exceeded)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Error Response Format

```json
{
  "error": "Error message here",
  "details": "Additional context (development only)"
}
```

---

## Webhooks Setup

Register webhooks in Shopify Partners Dashboard:

1. App Setup → Webhooks
2. Add webhook subscriptions:
   - `app/uninstalled` → `{APP_URL}/webhooks/app/uninstalled`
   - `customers/data_request` → `{APP_URL}/webhooks/customers/data_request`
   - `customers/redact` → `{APP_URL}/webhooks/customers/redact`
   - `shop/redact` → `{APP_URL}/webhooks/shop/redact`

