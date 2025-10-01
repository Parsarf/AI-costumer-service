#!/bin/bash

# Test Shopify webhooks locally
# Usage: ./scripts/test-webhooks.sh [webhook_type]

WEBHOOK_TYPE=${1:-app_uninstalled}
APP_URL=${2:-http://localhost:3001}
SHOP="test-store.myshopify.com"

# Generate HMAC (simplified - in production, Shopify generates this)
SECRET=${SHOPIFY_API_SECRET:-"your_secret"}

echo "🧪 Testing webhook: $WEBHOOK_TYPE"
echo "📍 URL: $APP_URL"
echo ""

case $WEBHOOK_TYPE in
  "app_uninstalled")
    echo "Testing app uninstall webhook..."
    curl -X POST "$APP_URL/webhooks/app/uninstalled" \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Shop-Domain: $SHOP" \
      -H "X-Shopify-Hmac-Sha256: test_signature" \
      -d '{}'
    ;;
    
  "customer_data_request")
    echo "Testing customer data request webhook..."
    curl -X POST "$APP_URL/webhooks/customers/data_request" \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Shop-Domain: $SHOP" \
      -H "X-Shopify-Hmac-Sha256: test_signature" \
      -d '{
        "customer": {
          "id": 12345,
          "email": "customer@example.com",
          "first_name": "John",
          "last_name": "Doe"
        }
      }'
    ;;
    
  "customer_redact")
    echo "Testing customer redact webhook..."
    curl -X POST "$APP_URL/webhooks/customers/redact" \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Shop-Domain: $SHOP" \
      -H "X-Shopify-Hmac-Sha256: test_signature" \
      -d '{
        "customer": {
          "id": 12345,
          "email": "customer@example.com"
        }
      }'
    ;;
    
  "shop_redact")
    echo "Testing shop redact webhook..."
    curl -X POST "$APP_URL/webhooks/shop/redact" \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Shop-Domain: $SHOP" \
      -H "X-Shopify-Hmac-Sha256: test_signature" \
      -d '{
        "shop_domain": "'"$SHOP"'"
      }'
    ;;
    
  *)
    echo "Unknown webhook type: $WEBHOOK_TYPE"
    echo ""
    echo "Available types:"
    echo "  - app_uninstalled"
    echo "  - customer_data_request"
    echo "  - customer_redact"
    echo "  - shop_redact"
    exit 1
    ;;
esac

echo ""
echo "✅ Webhook test completed"

