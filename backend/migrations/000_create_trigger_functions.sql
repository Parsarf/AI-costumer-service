-- Create trigger function for automatically updating updated_at timestamps
-- This function must be created before any migrations that reference it

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
