-- Add related_id column to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id UUID;

-- Update the type check constraint to include promotion and other notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('message', 'offer', 'offer_response', 'review', 'listing_status', 'promotion', 'system'));

-- Comment on the new column
COMMENT ON COLUMN notifications.related_id IS 'Generic reference ID for various entity types';

-- Add index for performance
CREATE INDEX IF NOT EXISTS notifications_related_id_idx ON notifications(related_id); 