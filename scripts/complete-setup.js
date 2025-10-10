#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Complete setup script for Shopify AI Support Bot
 */

console.log('🚀 Shopify AI Support Bot - Complete Setup');
console.log('==========================================');
console.log('');

// Colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`📦 ${description}...`, 'yellow');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const projectRoot = path.join(__dirname, '..');
  
  // Step 1: Install backend dependencies
  log('Step 1: Installing backend dependencies', 'blue');
  if (!runCommand('cd backend && npm install', 'Installing backend dependencies')) {
    log('Failed to install backend dependencies', 'red');
    return;
  }
  
  // Step 2: Install widget dependencies
  log('\nStep 2: Installing widget dependencies', 'blue');
  if (!runCommand('cd chat-widget && npm install', 'Installing widget dependencies')) {
    log('Failed to install widget dependencies', 'red');
    return;
  }
  
  // Step 3: Generate Prisma client
  log('\nStep 3: Generating Prisma client', 'blue');
  if (!runCommand('cd backend && npx prisma generate', 'Generating Prisma client')) {
    log('Failed to generate Prisma client', 'red');
    return;
  }
  
  // Step 4: Build widget
  log('\nStep 4: Building chat widget', 'blue');
  if (!runCommand('cd chat-widget && npm run build-extension', 'Building chat widget')) {
    log('Failed to build chat widget', 'red');
    return;
  }
  
  // Step 5: Check .env file
  log('\nStep 5: Checking environment configuration', 'blue');
  const envPath = path.join(projectRoot, 'backend', '.env');
  if (fs.existsSync(envPath)) {
    log('✅ .env file exists', 'green');
    
    // Check if it has placeholder values
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('your_32_character_hex_api_key_here')) {
      log('⚠️  .env file contains placeholder values - please update with real credentials', 'yellow');
    }
  } else {
    log('❌ .env file not found - please run: node scripts/generate-env.js', 'red');
  }
  
  // Step 6: Summary
  log('\n🎉 Setup completed successfully!', 'green');
  log('\nNext steps:', 'blue');
  log('1. Update backend/.env with your actual API keys:', 'yellow');
  log('   - SHOPIFY_API_KEY (from Shopify Partners)', 'yellow');
  log('   - SHOPIFY_API_SECRET (from Shopify Partners)', 'yellow');
  log('   - ANTHROPIC_API_KEY (from https://console.anthropic.com)', 'yellow');
  log('   - DATABASE_URL (your PostgreSQL connection string)', 'yellow');
  log('   - APP_URL (your deployment URL)', 'yellow');
  log('');
  log('2. Start development server:', 'yellow');
  log('   cd backend && npm run dev', 'yellow');
  log('');
  log('3. Test the application:', 'yellow');
  log('   node scripts/health-check.js', 'yellow');
  log('');
  log('4. Deploy to production:', 'yellow');
  log('   ./scripts/setup-production.sh', 'yellow');
  log('');
  log('📚 Documentation:', 'blue');
  log('- README.md - Project overview and setup', 'yellow');
  log('- QUICK_START.md - Fast track setup guide', 'yellow');
  log('- docs/DEPLOYMENT.md - Production deployment guide', 'yellow');
  log('- docs/SHOPIFY_SUBMISSION.md - App Store submission guide', 'yellow');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

