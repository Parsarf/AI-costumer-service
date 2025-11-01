const { PrismaClient } = require('@prisma/client');

async function initializeDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Create tables using raw SQL
    console.log('🔄 Creating database tables...');
    
    // Create stores table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "stores" (
        "id" SERIAL PRIMARY KEY,
        "shop" VARCHAR(255) NOT NULL UNIQUE,
        "access_token" TEXT NOT NULL,
        "store_name" VARCHAR(255),
        "settings" JSONB DEFAULT '{
          "welcomeMessage": "Hi! 👋 I''m here to help you with any questions about your order, returns, or our products. How can I assist you today?",
          "returnPolicy": "We accept returns within 30 days of purchase. Items must be unworn and in original packaging.",
          "shippingPolicy": "We ship within 1-2 business days. Domestic orders typically arrive in 3-5 business days.",
          "supportEmail": "support@example.com",
          "botPersonality": "friendly",
          "chatbotEnabled": true,
          "theme": {
            "primaryColor": "#4F46E5",
            "position": "bottom-right"
          }
        }'::jsonb,
        "active" BOOLEAN DEFAULT true,
        "is_active" BOOLEAN DEFAULT true,
        "plan" VARCHAR(50) DEFAULT 'starter',
        "subscription_tier" VARCHAR(50) DEFAULT 'starter',
        "subscription_status" VARCHAR(50) DEFAULT 'trial',
        "charge_id" VARCHAR(255),
        "conversation_count" INTEGER DEFAULT 0,
        "conversation_limit" INTEGER DEFAULT 1000,
        "installed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create sessions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" VARCHAR(255) PRIMARY KEY,
        "shop" VARCHAR(255) NOT NULL,
        "state" VARCHAR(255) NOT NULL,
        "is_online" BOOLEAN DEFAULT false,
        "expires" TIMESTAMP,
        "data" JSONB NOT NULL,
        "shop_id" INTEGER NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("shop_id") REFERENCES "stores"("id") ON DELETE CASCADE
      );
    `;
    
    // Create conversations table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" VARCHAR(255) PRIMARY KEY,
        "shop_id" INTEGER NOT NULL,
        "customer_email" VARCHAR(255),
        "customer_name" VARCHAR(255),
        "customer_id" VARCHAR(255),
        "status" VARCHAR(50) DEFAULT 'active',
        "escalated" BOOLEAN DEFAULT false,
        "escalation_reason" TEXT,
        "metadata" JSONB,
        "message_count" INTEGER DEFAULT 0,
        "last_message_at" TIMESTAMP,
        "resolved_at" TIMESTAMP,
        "session_id" VARCHAR(255),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("shop_id") REFERENCES "stores"("id") ON DELETE CASCADE
      );
    `;
    
    // Create messages table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" SERIAL PRIMARY KEY,
        "conversation_id" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "content" TEXT NOT NULL,
        "metadata" JSONB DEFAULT '{}'::jsonb,
        "tokens" INTEGER,
        "response_time" INTEGER,
        "ai_model" VARCHAR(100),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE
      );
    `;
    
    // Create billing_subscriptions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "billing_subscriptions" (
        "id" VARCHAR(255) PRIMARY KEY,
        "shop_id" INTEGER NOT NULL UNIQUE,
        "subscription_id" VARCHAR(255) UNIQUE,
        "plan_name" VARCHAR(100),
        "status" VARCHAR(50),
        "price" DECIMAL(10,2),
        "currency" VARCHAR(3) DEFAULT 'USD',
        "trial_days" INTEGER DEFAULT 7,
        "trial_ends_at" TIMESTAMP,
        "current_period_end" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("shop_id") REFERENCES "stores"("id") ON DELETE CASCADE
      );
    `;
    
    console.log('✅ All database tables created successfully!');
    console.log('🎉 Database initialization completed!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };

