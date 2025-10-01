#!/bin/bash

# Deployment script for Shopify Support Bot
# Usage: ./scripts/deploy.sh [environment]

set -e  # Exit on error

ENVIRONMENT=${1:-production}

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Verify we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}"

# Build chat widget
echo -e "${YELLOW}📦 Building chat widget...${NC}"
cd chat-widget
npm run build
cd ..
echo -e "${GREEN}✓ Widget built successfully${NC}"

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
cd backend
npm test || {
    echo -e "${RED}❌ Tests failed. Aborting deployment.${NC}"
    exit 1
}
cd ..
echo -e "${GREEN}✓ Tests passed${NC}"

# Deploy to Railway
echo -e "${YELLOW}🚂 Deploying to Railway...${NC}"
cd backend
railway up
echo -e "${GREEN}✓ Deployed successfully${NC}"

# Run migrations
echo -e "${YELLOW}🗃️  Running database migrations...${NC}"
railway run npm run migrate
echo -e "${GREEN}✓ Migrations completed${NC}"

# Get deployment URL
DEPLOY_URL=$(railway domain)
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 App URL: $DEPLOY_URL${NC}"

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5  # Wait for deployment to be ready

HEALTH_RESPONSE=$(curl -s "$DEPLOY_URL/health" || echo "failed")

if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed or pending. Check logs:${NC}"
    echo "railway logs"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update Shopify app URLs to: $DEPLOY_URL"
echo "2. Test installation on a development store"
echo "3. Monitor logs: railway logs --tail"
echo ""

