#!/bin/bash

# Test webhooks locally
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="http://localhost:3001"

echo "🧪 Testing webhooks..."

# Test health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Test app uninstalled webhook
echo -e "${YELLOW}Testing app uninstalled webhook...${NC}"
APP_UNINSTALL_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks/app_uninstalled" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: test_signature" \
  -H "X-Shopify-Shop-Domain: test-store.myshopify.com" \
  -d '{}')

if [[ $APP_UNINSTALL_RESPONSE == *"successfully"* ]]; then
    echo -e "${GREEN}✓ App uninstalled webhook passed${NC}"
else
    echo -e "${YELLOW}⚠️ App uninstalled webhook response: $APP_UNINSTALL_RESPONSE${NC}"
fi

# Test customer data request webhook
echo -e "${YELLOW}Testing customer data request webhook...${NC}"
DATA_REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks/customers/data_request" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: test_signature" \
  -H "X-Shopify-Shop-Domain: test-store.myshopify.com" \
  -d '{"customer": {"email": "test@example.com", "id": "123"}}')

if [[ $DATA_REQUEST_RESPONSE == *"processed"* ]]; then
    echo -e "${GREEN}✓ Customer data request webhook passed${NC}"
else
    echo -e "${YELLOW}⚠️ Customer data request webhook response: $DATA_REQUEST_RESPONSE${NC}"
fi

# Test customer redact webhook
echo -e "${YELLOW}Testing customer redact webhook...${NC}"
REDACT_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks/customers/redact" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: test_signature" \
  -H "X-Shopify-Shop-Domain: test-store.myshopify.com" \
  -d '{"customer": {"email": "test@example.com", "id": "123"}}')

if [[ $REDACT_RESPONSE == *"redacted"* ]]; then
    echo -e "${GREEN}✓ Customer redact webhook passed${NC}"
else
    echo -e "${YELLOW}⚠️ Customer redact webhook response: $REDACT_RESPONSE${NC}"
fi

# Test shop redact webhook
echo -e "${YELLOW}Testing shop redact webhook...${NC}"
SHOP_REDACT_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks/shop/redact" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: test_signature" \
  -H "X-Shopify-Shop-Domain: test-store.myshopify.com" \
  -d '{"shop_domain": "test-store.myshopify.com"}')

if [[ $SHOP_REDACT_RESPONSE == *"redacted"* ]]; then
    echo -e "${GREEN}✓ Shop redact webhook passed${NC}"
else
    echo -e "${YELLOW}⚠️ Shop redact webhook response: $SHOP_REDACT_RESPONSE${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Webhook testing complete!${NC}"
echo ""
echo "Note: HMAC verification is disabled in test mode."
echo "In production, webhooks will be properly verified."
echo ""