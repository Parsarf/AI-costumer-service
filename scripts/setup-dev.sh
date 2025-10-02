#!/bin/bash

# Development setup script for Shopify AI Support Bot
set -e

echo "🛠️ Setting up development environment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version check passed${NC}"

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo -e "${YELLOW}⚠️ PostgreSQL not running. Please start PostgreSQL first.${NC}"
    echo "On macOS: brew services start postgresql"
    echo "On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd backend
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cp env.example .env
    echo -e "${YELLOW}⚠️ Please update .env with your actual credentials${NC}"
fi

# Create database
echo -e "${YELLOW}🗃️ Setting up database...${NC}"
DB_NAME="shopify_support_bot_dev"
createdb $DB_NAME 2>/dev/null || echo "Database $DB_NAME already exists"

# Update DATABASE_URL in .env
if grep -q "DATABASE_URL=" .env; then
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$(whoami)@localhost:5432/$DB_NAME|" .env
else
    echo "DATABASE_URL=postgresql://$(whoami)@localhost:5432/$DB_NAME" >> .env
fi

# Run migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
npx prisma migrate dev --name init

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Install Shopify CLI if not present
if ! command -v shopify &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Shopify CLI...${NC}"
    npm install -g @shopify/cli
fi

echo -e "${GREEN}✅ Development setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env with your actual credentials"
echo "2. Start ngrok: ngrok http 3001"
echo "3. Update Shopify app URLs with ngrok URL"
echo "4. Start development server: npm run dev"
echo "5. Test installation: http://localhost:3001/auth?shop=your-dev-store.myshopify.com"
echo ""
echo "Useful commands:"
echo "- View database: npx prisma studio"
echo "- Reset database: npx prisma migrate reset"
echo "- Run tests: npm test"
echo "- View logs: npm run dev"
echo ""