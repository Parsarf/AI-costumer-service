-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  shop VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT,
  store_name VARCHAR(255),
  settings JSONB DEFAULT '{"welcomeMessage":"Hi! 👋 I''m here to help you with any questions about your order, returns, or our products. How can I assist you today?","returnPolicy":"We accept returns within 30 days of purchase. Items must be unworn and in original packaging.","shippingPolicy":"We ship within 1-2 business days. Domestic orders typically arrive in 3-5 business days.","supportEmail":"support@example.com","botPersonality":"friendly","chatbotEnabled":true,"theme":{"primaryColor":"#4F46E5","position":"bottom-right"}}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  subscription_status VARCHAR(50) DEFAULT 'trial',
  charge_id VARCHAR(255),
  conversation_count INTEGER DEFAULT 0,
  conversation_limit INTEGER DEFAULT 1000,
  installed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Add columns if they don't exist (for existing tables from previous deployments)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS access_token TEXT

ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_name VARCHAR(255)

ALTER TABLE stores ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"welcomeMessage":"Hi! 👋 I''m here to help you with any questions about your order, returns, or our products. How can I assist you today?","returnPolicy":"We accept returns within 30 days of purchase. Items must be unworn and in original packaging.","shippingPolicy":"We ship within 1-2 business days. Domestic orders typically arrive in 3-5 business days.","supportEmail":"support@example.com","botPersonality":"friendly","chatbotEnabled":true,"theme":{"primaryColor":"#4F46E5","position":"bottom-right"}}'::jsonb

ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE

ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'starter'

ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial'

ALTER TABLE stores ADD COLUMN IF NOT EXISTS charge_id VARCHAR(255)

ALTER TABLE stores ADD COLUMN IF NOT EXISTS conversation_count INTEGER DEFAULT 0

ALTER TABLE stores ADD COLUMN IF NOT EXISTS conversation_limit INTEGER DEFAULT 1000

ALTER TABLE stores ADD COLUMN IF NOT EXISTS installed_at TIMESTAMP DEFAULT NOW()

ALTER TABLE stores ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()

ALTER TABLE stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()

-- Remove old duplicate columns if they exist
ALTER TABLE stores DROP COLUMN IF EXISTS active

ALTER TABLE stores DROP COLUMN IF EXISTS plan

-- Create indexes only after columns exist
CREATE INDEX IF NOT EXISTS idx_stores_shop ON stores(shop)

CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active)

CREATE INDEX IF NOT EXISTS idx_stores_subscription_tier ON stores(subscription_tier)

