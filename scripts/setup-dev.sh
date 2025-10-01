#!/bin/bash

# Development environment setup script
# Usage: ./scripts/setup-dev.sh

set -e

echo "🔧 Setting up development environment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Install PostgreSQL 14+ to run locally."
else
    echo -e "${GREEN}✓ PostgreSQL $(psql --version | cut -d' ' -f3)${NC}"
fi

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Install widget dependencies
echo -e "${YELLOW}📦 Installing widget dependencies...${NC}"
cd ../chat-widget
npm install
cd ..
echo -e "${GREEN}✓ Widget dependencies installed${NC}"

# Setup .env file
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp backend/env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env${NC}"
    echo ""
    echo "⚠️  IMPORTANT: Update backend/.env with your credentials:"
    echo "   - SHOPIFY_API_KEY"
    echo "   - SHOPIFY_API_SECRET"
    echo "   - CLAUDE_API_KEY"
    echo "   - DATABASE_URL"
    echo ""
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Setup database
echo -e "${YELLOW}Setting up database...${NC}"
echo "Run these commands to create and setup the database:"
echo ""
echo "  createdb shopify_support_bot"
echo "  cd backend && npm run migrate"
echo ""

# Create logs directory
mkdir -p backend/logs
echo -e "${GREEN}✓ Created logs directory${NC}"

echo ""
echo -e "${GREEN}✅ Development environment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your credentials"
echo "2. Create database: createdb shopify_support_bot"
echo "3. Run migrations: cd backend && npm run migrate"
echo "4. Start development:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd chat-widget && npm start"
echo "   Terminal 3: ngrok http 3001"
echo ""

