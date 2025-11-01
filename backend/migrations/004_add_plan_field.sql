-- Add missing fields to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan VARCHAR(255) DEFAULT 'starter';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to have the new fields
UPDATE stores SET plan = 'starter' WHERE plan IS NULL;
UPDATE stores SET is_active = true WHERE is_active IS NULL;
