#!/bin/bash

# Deploy script for Shopify AI Support Bot
set -e

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd backend
npm ci

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test || {
    echo -e "${RED}❌ Tests failed. Aborting deployment.${NC}"
    exit 1
}

# Deploy to Railway
echo -e "${YELLOW}🚂 Deploying to Railway...${NC}"
railway up

# Run migrations
echo -e "${YELLOW}🗃️ Running database migrations...${NC}"
railway run npx prisma migrate deploy

# Get deployment URL
DEPLOY_URL=$(railway domain)
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 App URL: $DEPLOY_URL${NC}"

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 10

HEALTH_RESPONSE=$(curl -s "$DEPLOY_URL/health" || echo "failed")

if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️ Health check failed or pending. Check logs:${NC}"
    echo "railway logs"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update Shopify app URLs to: $DEPLOY_URL"
echo "2. Test installation on a development store"
echo "3. Deploy theme app extension"
echo "4. Monitor logs: railway logs --tail"
echo ""