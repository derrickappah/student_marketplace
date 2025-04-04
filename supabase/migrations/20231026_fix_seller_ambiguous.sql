-- Migration to fix ambiguous seller_id reference in triggers

-- Fix the update_seller_statistics function
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

  -- Count offers for this seller (FIX: qualify seller_id with table name)
  SELECT COUNT(*) INTO total_offers
  FROM offers
  WHERE offers.seller_id = seller_id;

  -- Count accepted offers (FIX: qualify seller_id with table name)
  SELECT COUNT(*) INTO accepted_offers
  FROM offers
  WHERE offers.seller_id = seller_id AND status = 'accepted';

  -- Count declined offers (FIX: qualify seller_id with table name)
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

-- Fix the update_offer_statistics function (explicitly create a local param to avoid ambiguity)
CREATE OR REPLACE FUNCTION update_offer_statistics()
RETURNS TRIGGER AS $$
DECLARE
  user_seller_id UUID;
BEGIN
  -- Get the seller ID to avoid ambiguity
  user_seller_id := NEW.seller_id;
  
  -- Only run on status changes for existing offers
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Directly update stats for this specific seller
    PERFORM update_seller_stats_for_user(user_seller_id);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function to update stats for a specific user
CREATE OR REPLACE FUNCTION update_seller_stats_for_user(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  active_count INT;
  sold_count INT;
  total_count INT;
  total_offers INT;
  accepted_offers INT;
  declined_offers INT;
  response_rt DECIMAL(5,2);
BEGIN
  -- Count active listings for this seller
  SELECT COUNT(*) INTO active_count
  FROM listings
  WHERE user_id = user_id_param AND status = 'available';

  -- Count sold listings for this seller
  SELECT COUNT(*) INTO sold_count
  FROM listings
  WHERE user_id = user_id_param AND status = 'sold';

  -- Count total listings for this seller
  SELECT COUNT(*) INTO total_count
  FROM listings
  WHERE user_id = user_id_param;

  -- Count offers for this seller
  SELECT COUNT(*) INTO total_offers
  FROM offers
  WHERE offers.seller_id = user_id_param;

  -- Count accepted offers
  SELECT COUNT(*) INTO accepted_offers
  FROM offers
  WHERE offers.seller_id = user_id_param AND status = 'accepted';

  -- Count declined offers
  SELECT COUNT(*) INTO declined_offers
  FROM offers
  WHERE offers.seller_id = user_id_param AND status = 'declined';

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
    user_id_param, 
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
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers to ensure they use the updated functions
DROP TRIGGER IF EXISTS after_listing_change ON listings;
CREATE TRIGGER after_listing_change
AFTER INSERT OR UPDATE OR DELETE ON listings
FOR EACH ROW EXECUTE FUNCTION update_seller_statistics();

DROP TRIGGER IF EXISTS after_offer_change ON offers;
CREATE TRIGGER after_offer_change
AFTER UPDATE ON offers
FOR EACH ROW EXECUTE FUNCTION update_offer_statistics(); 