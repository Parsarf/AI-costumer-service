-- Comprehensive migration to ensure all required columns exist in stores table
-- This handles the case where the database has an incomplete or old schema

-- Add ALL missing columns that Prisma expects (via @map decorators)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_name VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
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
}'::jsonb;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'starter';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'starter';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS charge_id VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS conversation_count INTEGER DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS conversation_limit INTEGER DEFAULT 1000;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS installed_at TIMESTAMP DEFAULT NOW();
ALTER TABLE stores ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update NULL values with appropriate defaults
UPDATE stores SET access_token = '' WHERE access_token IS NULL;
UPDATE stores SET active = TRUE WHERE active IS NULL;
UPDATE stores SET is_active = TRUE WHERE is_active IS NULL;
UPDATE stores SET plan = 'starter' WHERE plan IS NULL;
UPDATE stores SET subscription_tier = 'starter' WHERE subscription_tier IS NULL;
UPDATE stores SET subscription_status = 'trial' WHERE subscription_status IS NULL;
UPDATE stores SET conversation_count = 0 WHERE conversation_count IS NULL;
UPDATE stores SET conversation_limit = 1000 WHERE conversation_limit IS NULL;
UPDATE stores SET installed_at = NOW() WHERE installed_at IS NULL;
UPDATE stores SET created_at = NOW() WHERE created_at IS NULL;
UPDATE stores SET updated_at = NOW() WHERE updated_at IS NULL;

-- Make access_token NOT NULL after setting defaults
ALTER TABLE stores ALTER COLUMN access_token SET NOT NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_stores_shop ON stores(shop);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(active);
CREATE INDEX IF NOT EXISTS idx_stores_subscription_tier ON stores(subscription_tier);

-- Add constraints using DO blocks to avoid errors
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_subscription_tier') THEN
    ALTER TABLE stores ADD CONSTRAINT check_subscription_tier
      CHECK (subscription_tier IN ('starter', 'pro', 'scale', 'trial'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_subscription_status') THEN
    ALTER TABLE stores ADD CONSTRAINT check_subscription_status
      CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired'));
  END IF;
END $$;

-- Ensure trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stores_updated_at') THEN
    CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
