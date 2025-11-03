-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(255) PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  escalated BOOLEAN DEFAULT FALSE,
  escalation_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_shop_id ON conversations(shop_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_escalated ON conversations(escalated);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_email ON conversations(customer_email);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- Add constraint for status
ALTER TABLE conversations ADD CONSTRAINT check_conversation_status 
  CHECK (status IN ('active', 'escalated', 'resolved', 'closed'));

-- Add constraint for email format
ALTER TABLE conversations ADD CONSTRAINT check_customer_email 
  CHECK (customer_email IS NULL OR customer_email ~ '^[^@]+@[^@]+\.[^@]+$');

-- Update updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

