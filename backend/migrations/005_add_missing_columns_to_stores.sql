-- Add missing columns to stores table if they don't exist
-- This migration ensures existing tables have all required columns

ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'starter';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'starter';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS charge_id VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS conversation_count INTEGER DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS conversation_limit INTEGER DEFAULT 1000;

-- Update existing NULL values
UPDATE stores SET is_active = TRUE WHERE is_active IS NULL;
UPDATE stores SET plan = 'starter' WHERE plan IS NULL;
UPDATE stores SET subscription_tier = 'starter' WHERE subscription_tier IS NULL;
UPDATE stores SET subscription_status = 'trial' WHERE subscription_status IS NULL;
UPDATE stores SET conversation_count = 0 WHERE conversation_count IS NULL;
UPDATE stores SET conversation_limit = 1000 WHERE conversation_limit IS NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_stores_subscription_tier ON stores(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(active);
CREATE INDEX IF NOT EXISTS idx_stores_shop ON stores(shop);

-- Add constraints if they don't exist (using DO block to handle "already exists" errors)
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
