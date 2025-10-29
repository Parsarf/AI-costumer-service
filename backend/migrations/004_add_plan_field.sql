-- Add plan field to stores table
ALTER TABLE stores ADD COLUMN plan VARCHAR(255) DEFAULT 'starter';

-- Update existing records to have plan field
UPDATE stores SET plan = 'starter' WHERE plan IS NULL;
