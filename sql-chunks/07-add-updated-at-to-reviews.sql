-- Add updated_at column to reviews table
ALTER TABLE reviews
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;

-- Optional: Initialize existing rows' updated_at to their created_at value
UPDATE reviews
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Optional: Add a trigger to automatically update updated_at on changes
-- This is often a good practice to ensure it's always current
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 