-- Listing Promotion Approvals System
-- This file adds the necessary structure to handle listing promotion approvals

-- Ensure promotion fields exist in listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS promotion_status TEXT DEFAULT 'none';

-- Add check constraint for promotion_status if it doesn't have one already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'listings_promotion_status_check'
  ) THEN
    ALTER TABLE listings 
    ADD CONSTRAINT listings_promotion_status_check 
    CHECK (promotion_status IN ('none', 'pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Create a table to track promotion request history
CREATE TABLE IF NOT EXISTS promotion_request_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('featured', 'priority', 'both')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on the promotion history table
ALTER TABLE promotion_request_history ENABLE ROW LEVEL SECURITY;

-- Create policies for the promotion history table
CREATE POLICY "Users can view their own promotion requests" ON promotion_request_history
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Admin can view all promotion requests" ON promotion_request_history
  FOR ALL USING (auth.role() = 'service_role');

-- Create a function to update promotion history
CREATE OR REPLACE FUNCTION update_promotion_history()
RETURNS TRIGGER AS $$
BEGIN
  -- If promotion status changed from 'none' to 'pending'
  IF OLD.promotion_status = 'none' AND NEW.promotion_status = 'pending' THEN
    -- Determine promotion type
    DECLARE
      promo_type TEXT;
    BEGIN
      IF NEW.is_featured AND NEW.is_priority THEN
        promo_type := 'both';
      ELSIF NEW.is_featured THEN
        promo_type := 'featured';
      ELSIF NEW.is_priority THEN
        promo_type := 'priority';
      ELSE
        promo_type := 'unknown';
      END IF;
      
      -- Insert new record to promotion history
      INSERT INTO promotion_request_history (
        listing_id, 
        user_id, 
        promotion_type, 
        status, 
        requested_at
      ) VALUES (
        NEW.id,
        NEW.user_id,
        promo_type,
        'pending',
        NOW()
      );
    END;
  -- If promotion status changed from 'pending' to 'approved' or 'rejected'
  ELSIF OLD.promotion_status = 'pending' AND (NEW.promotion_status = 'approved' OR NEW.promotion_status = 'rejected') THEN
    -- Update existing record
    UPDATE promotion_request_history
    SET 
      status = NEW.promotion_status,
      processed_at = NOW(),
      processed_by = auth.uid(),
      expires_at = NEW.promotion_expires_at
    WHERE 
      listing_id = NEW.id AND 
      status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the promotion history
DROP TRIGGER IF EXISTS promotion_history_trigger ON listings;
CREATE TRIGGER promotion_history_trigger
AFTER UPDATE ON listings
FOR EACH ROW
WHEN (OLD.promotion_status IS DISTINCT FROM NEW.promotion_status)
EXECUTE FUNCTION update_promotion_history();

-- Create views for featured and priority listings
CREATE OR REPLACE VIEW featured_listings AS
SELECT l.*, u.name as seller_name, u.university as seller_university, c.name as category_name
FROM listings l
JOIN users u ON l.user_id = u.id
LEFT JOIN categories c ON l.category_id = c.id
WHERE l.status = 'available' 
AND l.is_featured = true 
AND (l.promotion_status = 'approved')
AND (l.promotion_expires_at IS NULL OR l.promotion_expires_at > NOW());

CREATE OR REPLACE VIEW priority_listings AS
SELECT l.*, u.name as seller_name, u.university as seller_university, c.name as category_name
FROM listings l
JOIN users u ON l.user_id = u.id
LEFT JOIN categories c ON l.category_id = c.id
WHERE l.status = 'available' 
AND l.is_priority = true 
AND (l.promotion_status = 'approved')
AND (l.promotion_expires_at IS NULL OR l.promotion_expires_at > NOW());

-- Create a function to get promotion requests statistics
CREATE OR REPLACE FUNCTION get_promotion_stats()
RETURNS TABLE (
  total_pending INT,
  total_approved INT,
  total_rejected INT,
  featured_pending INT,
  featured_approved INT,
  priority_pending INT,
  priority_approved INT,
  both_pending INT,
  both_approved INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM listings WHERE promotion_status = 'pending')::INT as total_pending,
    (SELECT COUNT(*) FROM listings WHERE promotion_status = 'approved')::INT as total_approved,
    (SELECT COUNT(*) FROM listings WHERE promotion_status = 'rejected')::INT as total_rejected,
    (SELECT COUNT(*) FROM listings WHERE promotion_status = 'pending' AND is_featured AND NOT is_priority)::INT as featured_pending,
    (SELECT COUNT(*) FROM listings WHERE promotion_status = 'approved' AND is_featured AND NOT is_priority)::INT as featured_approved,
    (SELECT COUNT(*) FROM listings WHERE promotion_status = 'pending' AND is_priority AND NOT is_featured)::INT as priority_pending,
    (SELECT COUNT(*) FROM listings WHERE promotion_status = 'approved' AND is_priority AND NOT is_featured)::INT as priority_approved,
    (SELECT COUNT(*) FROM listings WHERE promotion_status = 'pending' AND is_featured AND is_priority)::INT as both_pending,
    (SELECT COUNT(*) FROM listings WHERE promotion_status = 'approved' AND is_featured AND is_priority)::INT as both_approved;
END;
$$ LANGUAGE plpgsql; 