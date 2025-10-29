-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  shop VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  store_name VARCHAR(255),
  settings JSONB DEFAULT '{
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stores_shop ON stores(shop);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(active);
CREATE INDEX IF NOT EXISTS idx_stores_subscription_tier ON stores(subscription_tier);

-- Add constraint for shop domain format
ALTER TABLE stores ADD CONSTRAINT check_shop_domain 
  CHECK (shop ~ '^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$');

-- Add constraint for subscription tier
ALTER TABLE stores ADD CONSTRAINT check_subscription_tier 
  CHECK (subscription_tier IN ('starter', 'pro', 'scale', 'trial'));

-- Add constraint for subscription status
ALTER TABLE stores ADD CONSTRAINT check_subscription_status 
  CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired'));

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

