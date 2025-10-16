const logger = require('../utils/logger');

/**
 * Required environment variables
 */
const REQUIRED_VARS = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET',
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'APP_URL',
  'ENCRYPTION_KEY'
];

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_VARS = {
  'NODE_ENV': 'development',
  'PORT': '3001',
  'JWT_SECRET': 'your_jwt_secret_change_in_production',
  'BILLING_PRICE': '9.99',
  'BILLING_TRIAL_DAYS': '7',
  'SHOPIFY_BILLING_TEST': 'true',
  'FREE_PLAN': 'false',
  'LOG_LEVEL': 'info'
};

/**
 * Validate environment variables
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Set optional variables with defaults
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_VARS)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      logger.info(`Set default value for ${varName}: ${defaultValue}`);
    }
  }

  // Validate specific formats
  validateSpecificFormats(errors, warnings);

  // Log warnings
  warnings.forEach(warning => logger.warn(warning));

  // Handle errors
  if (errors.length > 0) {
    logger.error('Environment validation failed:');
    errors.forEach(error => logger.error(`  - ${error}`));
    
    logger.error('\nPlease check your .env file and ensure all required variables are set.');
    logger.error('See env.example for reference.');
    
    process.exit(1);
  }

  logger.info('Environment validation passed');
}

/**
 * Validate specific variable formats
 */
function validateSpecificFormats(errors, warnings) {
  // Validate SHOPIFY_API_KEY format
  if (process.env.SHOPIFY_API_KEY && !process.env.SHOPIFY_API_KEY.match(/^[a-f0-9]{32}$/)) {
    errors.push('SHOPIFY_API_KEY must be a 32-character hex string');
  }

  // Validate SHOPIFY_API_SECRET format
  if (process.env.SHOPIFY_API_SECRET && !process.env.SHOPIFY_API_SECRET.match(/^[a-f0-9]{32}$/)) {
    errors.push('SHOPIFY_API_SECRET must be a 32-character hex string');
  }

  // Validate OPENAI_API_KEY format
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    errors.push('OPENAI_API_KEY must start with "sk-"');
  }

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Validate APP_URL format
  if (process.env.APP_URL && !process.env.APP_URL.startsWith('http')) {
    errors.push('APP_URL must be a valid HTTP/HTTPS URL');
  }

  // Validate ENCRYPTION_KEY format
  if (process.env.ENCRYPTION_KEY) {
    if (process.env.ENCRYPTION_KEY.length !== 64) {
      errors.push('ENCRYPTION_KEY must be 64 characters (32 bytes in hex)');
    } else if (!process.env.ENCRYPTION_KEY.match(/^[a-f0-9]{64}$/)) {
      errors.push('ENCRYPTION_KEY must be a valid hex string');
    }
  }

  // Validate PORT
  if (process.env.PORT && (isNaN(process.env.PORT) || process.env.PORT < 1 || process.env.PORT > 65535)) {
    errors.push('PORT must be a number between 1 and 65535');
  }

  // Validate BILLING_PRICE
  if (process.env.BILLING_PRICE && isNaN(parseFloat(process.env.BILLING_PRICE))) {
    errors.push('BILLING_PRICE must be a valid number');
  }

  // Validate BILLING_TRIAL_DAYS
  if (process.env.BILLING_TRIAL_DAYS && (isNaN(process.env.BILLING_TRIAL_DAYS) || process.env.BILLING_TRIAL_DAYS < 0)) {
    errors.push('BILLING_TRIAL_DAYS must be a non-negative number');
  }

  // Validate boolean values
  const booleanVars = ['SHOPIFY_BILLING_TEST', 'FREE_PLAN'];
  booleanVars.forEach(varName => {
    if (process.env[varName] && !['true', 'false'].includes(process.env[varName].toLowerCase())) {
      errors.push(`${varName} must be "true" or "false"`);
    }
  });

  // Production warnings
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your_jwt_secret_change_in_production') {
      warnings.push('JWT_SECRET is using default value in production - this is insecure!');
    }

    if (process.env.SHOPIFY_BILLING_TEST === 'true') {
      warnings.push('SHOPIFY_BILLING_TEST is enabled in production - billing will be in test mode');
    }

    if (process.env.FREE_PLAN === 'true') {
      warnings.push('FREE_PLAN is enabled in production - no billing will be enforced');
    }

    if (!process.env.APP_URL.startsWith('https://')) {
      warnings.push('APP_URL should use HTTPS in production');
    }
  }
}

/**
 * Generate a sample .env file
 */
function generateEnvExample() {
  const exampleContent = `# App Configuration
APP_URL=https://your-app.railway.app
NODE_ENV=production
PORT=3001

# Shopify App Credentials
SHOPIFY_API_KEY=your_32_character_hex_api_key
SHOPIFY_API_SECRET=your_32_character_hex_secret
SCOPES=read_products,read_orders,read_customers,write_themes

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# AI Service
OPENAI_API_KEY=sk-proj-your_key_here

# Security
JWT_SECRET=your_jwt_secret_change_in_production
ENCRYPTION_KEY=your_64_character_hex_encryption_key

# Billing Configuration
BILLING_PRICE=9.99
BILLING_TRIAL_DAYS=7
SHOPIFY_BILLING_TEST=true
FREE_PLAN=false

# Logging
LOG_LEVEL=info
`;

  return exampleContent;
}

module.exports = {
  validateEnvironment,
  generateEnvExample
};
