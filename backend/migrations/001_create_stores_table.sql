-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  shop VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT,
  store_name VARCHAR(255),
  settings JSONB,
  active BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  plan VARCHAR(50) DEFAULT 'starter',
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  subscription_status VARCHAR(50) DEFAULT 'trial',
  charge_id VARCHAR(255),
  conversation_count INTEGER DEFAULT 0,
  conversation_limit INTEGER DEFAULT 1000,
  installed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables from previous deployments)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_name VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS settings JSONB;
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

-- Create indexes only after columns exist
CREATE INDEX IF NOT EXISTS idx_stores_shop ON stores(shop);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(active);
CREATE INDEX IF NOT EXISTS idx_stores_subscription_tier ON stores(subscription_tier);

