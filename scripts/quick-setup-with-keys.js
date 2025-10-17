#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Quick setup script with your API keys pre-configured
 */

console.log('🔑 Quick Setup with Your API Keys');
console.log('==================================\n');

// Your API keys
const OPENAI_API_KEY = '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';
const RAILWAY_TOKEN = 'f630810a-7e80-4738-9000-f2c1d7212772';

// Generate secure keys
const JWT_SECRET = crypto.randomBytes(64).toString('hex');
const ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

// Prompt for Shopify credentials
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('📝 I need your Shopify API credentials.\n');
  console.log('To get these:');
  console.log('1. Go to: https://partners.shopify.com');
  console.log('2. Click "Apps" → "Create app" → "Custom app"');
  console.log('3. Copy your API key and API secret\n');

  const shopifyApiKey = await question('Enter your SHOPIFY_API_KEY: ');
  const shopifyApiSecret = await question('Enter your SHOPIFY_API_SECRET: ');
  
  if (!shopifyApiKey || !shopifyApiSecret) {
    console.log('\n❌ Error: Shopify credentials are required!');
    console.log('Please get them from: https://partners.shopify.com\n');
    rl.close();
    process.exit(1);
  }

  console.log('\n✅ Got it! Creating your .env file...\n');

  // Create .env content
  const envContent = `# App Configuration
APP_URL=http://localhost:3001
NODE_ENV=development
PORT=3001

# Shopify App Credentials
SHOPIFY_API_KEY=${shopifyApiKey}
SHOPIFY_API_SECRET=${shopifyApiSecret}
SCOPES=read_products,read_orders,read_customers,write_themes

# Database (for local development)
DATABASE_URL=postgresql://postgres:password@localhost:5432/shopify_support_bot

# AI Service (OpenAI - Already Configured)
OPENAI_API_KEY=${OPENAI_API_KEY}

# Security (Auto-generated secure keys)
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Billing Configuration
BILLING_PRICE=9.99
BILLING_TRIAL_DAYS=7
SHOPIFY_BILLING_TEST=true
FREE_PLAN=false

# Logging
LOG_LEVEL=info
`;

  // Write .env file
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created backend/.env file');
    console.log('🔑 Generated secure JWT_SECRET and ENCRYPTION_KEY');
    console.log('✅ OpenAI API key configured');
    console.log('✅ Shopify credentials configured\n');

    console.log('📋 Next steps:\n');
    console.log('1. Setup database:');
    console.log('   cd backend');
    console.log('   createdb shopify_support_bot');
    console.log('   npx prisma migrate deploy\n');
    
    console.log('2. Install dependencies:');
    console.log('   npm install\n');
    
    console.log('3. Start development server:');
    console.log('   npm run dev\n');

    console.log('4. For production deployment:');
    console.log('   See: YOUR_API_KEYS_SETUP.md\n');

    console.log('🎉 Setup complete! You\'re ready to start developing!\n');

  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    process.exit(1);
  }

  rl.close();
}

main().catch(console.error);


