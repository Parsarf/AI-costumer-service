const { PrismaClient } = require('@prisma/client');

async function runMigrations() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting database migration...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Run migrations using raw SQL
    console.log('🔄 Creating stores table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "stores" (
        "id" SERIAL PRIMARY KEY,
        "shop" VARCHAR(255) NOT NULL UNIQUE,
        "access_token" TEXT,
        "scope" TEXT,
        "store_name" VARCHAR(255),
        "settings" JSONB,
        "active" BOOLEAN DEFAULT true,
        "subscription_tier" VARCHAR(50) DEFAULT 'free',
        "subscription_status" VARCHAR(50) DEFAULT 'active',
        "charge_id" VARCHAR(255),
        "conversation_count" INTEGER DEFAULT 0,
        "conversation_limit" INTEGER DEFAULT 100,
        "installed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('🔄 Creating sessions table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" VARCHAR(255) PRIMARY KEY,
        "shop_id" INTEGER NOT NULL,
        "state" VARCHAR(255),
        "is_online" BOOLEAN DEFAULT false,
        "scope" TEXT,
        "expires" TIMESTAMP,
        "access_token" TEXT,
        "user_id" BIGINT,
        "first_name" VARCHAR(255),
        "last_name" VARCHAR(255),
        "email" VARCHAR(255),
        "locale" VARCHAR(10),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("shop_id") REFERENCES "stores"("id") ON DELETE CASCADE
      );
    `;
    
    console.log('🔄 Creating conversations table...');
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
    
    console.log('🔄 Creating messages table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" VARCHAR(255) PRIMARY KEY,
        "conversation_id" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "content" TEXT NOT NULL,
        "metadata" JSONB,
        "tokens" INTEGER,
        "response_time" INTEGER,
        "ai_model" VARCHAR(100),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE
      );
    `;
    
    console.log('🔄 Creating billing_subscriptions table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "billing_subscriptions" (
        "id" VARCHAR(255) PRIMARY KEY,
        "shop_id" INTEGER NOT NULL,
        "subscription_id" VARCHAR(255),
        "plan_name" VARCHAR(100),
        "status" VARCHAR(50),
        "price" DECIMAL(10,2),
        "currency" VARCHAR(3),
        "trial_days" INTEGER,
        "trial_ends_at" TIMESTAMP,
        "billing_on" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("shop_id") REFERENCES "stores"("id") ON DELETE CASCADE
      );
    `;
    
    console.log('✅ All tables created successfully!');
    console.log('🎉 Database migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigrations();

