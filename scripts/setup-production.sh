#!/bin/bash

# Production setup script for Shopify AI Support Bot
set -e

echo "🚀 Setting up production environment..."

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

echo -e "${GREEN}✓ Railway CLI is available${NC}"

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project structure verified${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd backend && npm ci
cd ../chat-widget && npm ci

# Build widget
echo -e "${YELLOW}🔨 Building chat widget...${NC}"
npm run build

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
cd ../backend
npx prisma generate

echo -e "${GREEN}✅ Production setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Login to Railway: railway login"
echo "2. Initialize project: railway init"
echo "3. Add PostgreSQL: railway add postgresql"
echo "4. Set environment variables: railway variables set KEY=value"
echo "5. Deploy: railway up"
echo "6. Run migrations: railway run npx prisma migrate deploy"
echo ""
echo "Required environment variables:"
echo "- SHOPIFY_API_KEY"
echo "- SHOPIFY_API_SECRET"
echo "- OPENAI_API_KEY"
echo "- JWT_SECRET"
echo "- ENCRYPTION_KEY"
echo "- APP_URL"

