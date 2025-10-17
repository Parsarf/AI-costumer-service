#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generate a secure .env file with all required variables
 */

// Generate secure random keys
function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

// .env content template
const envContent = `# App Configuration
APP_URL=https://your-app.railway.app
NODE_ENV=development
PORT=3001

# Shopify App Credentials
SHOPIFY_API_KEY=your_32_character_hex_api_key_here
SHOPIFY_API_SECRET=your_32_character_hex_secret_here
SCOPES=read_products,read_orders,read_customers,write_themes

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/shopify_support_bot

# AI Service
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# Security (Generated secure keys)
JWT_SECRET=${generateJWTSecret()}
ENCRYPTION_KEY=${generateEncryptionKey()}

# Billing Configuration
BILLING_PRICE=9.99
BILLING_TRIAL_DAYS=7
SHOPIFY_BILLING_TEST=true
FREE_PLAN=false

# Logging
LOG_LEVEL=info

# Instructions:
# 1. Replace SHOPIFY_API_KEY and SHOPIFY_API_SECRET with your actual Shopify app credentials
# 2. Replace OPENAI_API_KEY with your OpenAI API key from https://platform.openai.com
# 3. Update DATABASE_URL with your actual database connection string
# 4. Update APP_URL with your actual deployment URL
# 5. For production, set NODE_ENV=production and SHOPIFY_BILLING_TEST=false
`;

// Write .env file
const envPath = path.join(__dirname, '..', 'backend', '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Generated .env file at backend/.env');
  console.log('🔑 Generated secure JWT_SECRET and ENCRYPTION_KEY');
  console.log('📝 Please update the following with your actual values:');
  console.log('   - SHOPIFY_API_KEY');
  console.log('   - SHOPIFY_API_SECRET');
  console.log('   - OPENAI_API_KEY');
  console.log('   - DATABASE_URL');
  console.log('   - APP_URL');
} catch (error) {
  console.error('❌ Error generating .env file:', error.message);
  process.exit(1);
}

