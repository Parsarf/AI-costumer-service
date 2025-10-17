#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

/**
 * Deploy to Railway with your token pre-configured
 */

const RAILWAY_TOKEN = 'f630810a-7e80-4738-9000-f2c1d7212772';
const OPENAI_API_KEY = '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';

console.log('🚂 Railway Deployment Script');
console.log('============================\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', env: { ...process.env, RAILWAY_TOKEN } });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed`);
    return false;
  }
}

async function main() {
  console.log('This script will help you deploy to Railway.\n');
  
  // Check if Railway CLI is installed
  try {
    execSync('railway --version', { stdio: 'pipe' });
    console.log('✅ Railway CLI is installed\n');
  } catch (error) {
    console.log('📦 Railway CLI not found. Installing...\n');
    runCommand('npm install -g @railway/cli', 'Installing Railway CLI');
  }

  // Get Shopify credentials
  console.log('\n📝 I need your Shopify API credentials for production.\n');
  console.log('To get these:');
  console.log('1. Go to: https://partners.shopify.com');
  console.log('2. Click "Apps" → Your App → "Client credentials"\n');

  const shopifyApiKey = await question('Enter your SHOPIFY_API_KEY: ');
  const shopifyApiSecret = await question('Enter your SHOPIFY_API_SECRET: ');

  if (!shopifyApiKey || !shopifyApiSecret) {
    console.log('\n❌ Shopify credentials are required!');
    rl.close();
    process.exit(1);
  }

  console.log('\n🔐 Logging into Railway...');
  console.log('Using your Railway token...\n');

  // Set Railway token
  process.env.RAILWAY_TOKEN = RAILWAY_TOKEN;

  // Login to Railway
  if (!runCommand(`railway login --browserless`, 'Railway login')) {
    console.log('\n⚠️  If automatic login failed, use: railway login');
    rl.close();
    process.exit(1);
  }

  console.log('\n📦 Setting up project...');
  
  // Initialize project
  runCommand('cd backend && railway init', 'Initialize Railway project');

  // Add PostgreSQL
  console.log('\n📊 Adding PostgreSQL database...');
  runCommand('railway add postgresql', 'Add PostgreSQL');

  console.log('\n🔧 Setting environment variables...');

  // Set all environment variables
  const variables = [
    `OPENAI_API_KEY=${OPENAI_API_KEY}`,
    `SHOPIFY_API_KEY=${shopifyApiKey}`,
    `SHOPIFY_API_SECRET=${shopifyApiSecret}`,
    `NODE_ENV=production`,
    `PORT=3001`,
    `SCOPES=read_products,read_orders,read_customers,write_themes`,
    `BILLING_PRICE=9.99`,
    `BILLING_TRIAL_DAYS=7`,
    `SHOPIFY_BILLING_TEST=false`,
    `FREE_PLAN=false`,
    `LOG_LEVEL=info`
  ];

  for (const variable of variables) {
    runCommand(`railway variables set ${variable}`, `Setting ${variable.split('=')[0]}`);
  }

  // Generate and set JWT_SECRET
  const crypto = require('crypto');
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  const encryptionKey = crypto.randomBytes(32).toString('hex');

  runCommand(`railway variables set JWT_SECRET=${jwtSecret}`, 'Setting JWT_SECRET');
  runCommand(`railway variables set ENCRYPTION_KEY=${encryptionKey}`, 'Setting ENCRYPTION_KEY');

  console.log('\n🚀 Deploying application...');
  runCommand('cd backend && railway up', 'Deploy to Railway');

  console.log('\n🗃️  Running database migrations...');
  runCommand('cd backend && railway run npx prisma migrate deploy', 'Run migrations');

  console.log('\n🌐 Getting your app URL...');
  try {
    const domain = execSync('cd backend && railway domain', { encoding: 'utf-8' }).trim();
    console.log(`\n✅ Your app is deployed at: ${domain}`);
    
    // Set APP_URL
    runCommand(`railway variables set APP_URL=https://${domain}`, 'Setting APP_URL');

    console.log('\n📋 Next steps:\n');
    console.log(`1. Update your Shopify app URLs to:`);
    console.log(`   - App URL: https://${domain}/app`);
    console.log(`   - Redirect URL: https://${domain}/auth/callback\n`);
    
    console.log('2. Configure webhooks in Shopify Partners Dashboard\n');
    
    console.log('3. Test installation:');
    console.log(`   https://${domain}/auth?shop=your-dev-store.myshopify.com\n`);

    console.log('🎉 Deployment complete!\n');

  } catch (error) {
    console.error('\n⚠️  Could not get domain. Run: railway domain');
  }

  rl.close();
}

main().catch(console.error);


