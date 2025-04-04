-- Add promotion fields to listings table
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

-- Migration to implement automatic seller activity tracking
-- This will update user profile stats automatically when listings change

-- Create a table to store seller activity statistics
CREATE TABLE IF NOT EXISTS seller_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active_listings INT DEFAULT 0,
  sold_listings INT DEFAULT 0,
  total_listings INT DEFAULT 0, 
  total_offers_received INT DEFAULT 0,
  offers_accepted INT DEFAULT 0,
  offers_declined INT DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  avg_response_time_hours INT DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Allow users to view their own stats or admin to view all
ALTER TABLE seller_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own seller statistics" ON seller_statistics 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Admin can view all seller statistics" ON seller_statistics 
  FOR ALL USING (auth.role() = 'service_role');

-- Function to update seller statistics when a listing is created, updated, or deleted
CREATE OR REPLACE FUNCTION update_seller_statistics()
RETURNS TRIGGER AS $$
DECLARE
  seller_id UUID;
  active_count INT;
  sold_count INT;
  total_count INT;
  total_offers INT;
  accepted_offers INT;
  declined_offers INT;
  response_rt DECIMAL(5,2);
BEGIN
  -- Determine the seller ID based on the operation
  IF TG_OP = 'DELETE' THEN
    seller_id := OLD.user_id;
  ELSE
    seller_id := NEW.user_id;
  END IF;

  -- Count active listings for this seller
  SELECT COUNT(*) INTO active_count
  FROM listings
  WHERE user_id = seller_id AND status = 'available';

  -- Count sold listings for this seller
  SELECT COUNT(*) INTO sold_count
  FROM listings
  WHERE user_id = seller_id AND status = 'sold';

  -- Count total listings for this seller
  SELECT COUNT(*) INTO total_count
  FROM listings
  WHERE user_id = seller_id;

  -- Count offers for this seller
  SELECT COUNT(*) INTO total_offers
  FROM offers
  WHERE offers.seller_id = seller_id;

  -- Count accepted offers
  SELECT COUNT(*) INTO accepted_offers
  FROM offers
  WHERE offers.seller_id = seller_id AND status = 'accepted';

  -- Count declined offers
  SELECT COUNT(*) INTO declined_offers
  FROM offers
  WHERE offers.seller_id = seller_id AND status = 'declined';

  -- Calculate response rate if there are offers
  IF total_offers > 0 THEN
    response_rt := (accepted_offers + declined_offers)::DECIMAL / total_offers * 100;
  ELSE
    response_rt := 0;
  END IF;

  -- Update or insert the statistics
  INSERT INTO seller_statistics (
    user_id, 
    active_listings, 
    sold_listings, 
    total_listings,
    total_offers_received,
    offers_accepted,
    offers_declined,
    response_rate,
    last_updated
  ) VALUES (
    seller_id, 
    active_count, 
    sold_count, 
    total_count,
    total_offers,
    accepted_offers,
    declined_offers,
    response_rt,
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    active_listings = EXCLUDED.active_listings,
    sold_listings = EXCLUDED.sold_listings,
    total_listings = EXCLUDED.total_listings,
    total_offers_received = EXCLUDED.total_offers_received,
    offers_accepted = EXCLUDED.offers_accepted,
    offers_declined = EXCLUDED.offers_declined,
    response_rate = EXCLUDED.response_rate,
    last_updated = EXCLUDED.last_updated;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for listings table to update statistics when a listing changes
DROP TRIGGER IF EXISTS after_listing_change ON listings;
CREATE TRIGGER after_listing_change
AFTER INSERT OR UPDATE OR DELETE ON listings
FOR EACH ROW EXECUTE FUNCTION update_seller_statistics();

-- Function to update statistics when an offer status changes
CREATE OR REPLACE FUNCTION update_offer_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run on status changes for existing offers
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Update seller statistics
    PERFORM update_seller_statistics();
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for offers table to update statistics when an offer status changes
DROP TRIGGER IF EXISTS after_offer_change ON offers;
CREATE TRIGGER after_offer_change
AFTER UPDATE ON offers
FOR EACH ROW EXECUTE FUNCTION update_offer_statistics();

-- Function to get seller statistics (for use in API)
CREATE OR REPLACE FUNCTION get_seller_statistics(seller_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT json_build_object(
    'active_listings', active_listings,
    'sold_listings', sold_listings,
    'total_listings', total_listings,
    'total_offers_received', total_offers_received,
    'offers_accepted', offers_accepted,
    'offers_declined', offers_declined,
    'response_rate', response_rate,
    'avg_response_time_hours', avg_response_time_hours,
    'last_updated', last_updated
  ) INTO stats
  FROM seller_statistics
  WHERE user_id = seller_id;
  
  IF stats IS NULL THEN
    -- Create default stats structure if none exists
    stats := json_build_object(
      'active_listings', 0,
      'sold_listings', 0,
      'total_listings', 0,
      'total_offers_received', 0,
      'offers_accepted', 0,
      'offers_declined', 0,
      'response_rate', 0,
      'avg_response_time_hours', 0,
      'last_updated', NOW()
    );
  END IF;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Update existing users by adding their statistics based on current data
INSERT INTO seller_statistics (
  user_id, 
  active_listings, 
  sold_listings, 
  total_listings,
  total_offers_received,
  offers_accepted,
  offers_declined,
  response_rate,
  last_updated
)
SELECT 
  u.id, 
  COUNT(CASE WHEN l.status = 'available' THEN 1 END),
  COUNT(CASE WHEN l.status = 'sold' THEN 1 END),
  COUNT(l.id),
  COUNT(DISTINCT o.id),
  COUNT(DISTINCT CASE WHEN o.status = 'accepted' THEN o.id END),
  COUNT(DISTINCT CASE WHEN o.status = 'declined' THEN o.id END),
  CASE 
    WHEN COUNT(DISTINCT o.id) > 0 THEN 
      (COUNT(DISTINCT CASE WHEN o.status IN ('accepted', 'declined') THEN o.id END)::DECIMAL / COUNT(DISTINCT o.id) * 100)
    ELSE 0
  END,
  NOW()
FROM 
  users u
LEFT JOIN 
  listings l ON u.id = l.user_id
LEFT JOIN 
  offers o ON u.id = o.seller_id
GROUP BY 
  u.id
ON CONFLICT (user_id) DO NOTHING; 