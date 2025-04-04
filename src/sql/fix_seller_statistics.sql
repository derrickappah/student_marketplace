-- Fix the ambiguous seller_id reference in the update_seller_statistics function
CREATE OR REPLACE FUNCTION update_seller_statistics()
RETURNS TRIGGER AS $$
DECLARE
  user_id_param UUID;
  active_count INT;
  sold_count INT;
  total_count INT;
  total_offers INT;
  accepted_offers INT;
  declined_offers INT;
  response_rt DECIMAL(5,2);
BEGIN
  -- Set the user_id parameter to avoid ambiguity
  IF TG_OP = 'DELETE' THEN
    user_id_param := OLD.user_id;
  ELSE
    user_id_param := NEW.user_id;
  END IF;
  
  -- Count active listings for this seller
  SELECT COUNT(*) INTO active_count
  FROM listings
  WHERE listings.user_id = user_id_param AND listings.status = 'available';

  -- Count sold listings for this seller
  SELECT COUNT(*) INTO sold_count
  FROM listings
  WHERE listings.user_id = user_id_param AND listings.status = 'sold';

  -- Count total listings for this seller
  SELECT COUNT(*) INTO total_count
  FROM listings
  WHERE listings.user_id = user_id_param;

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

  -- Update or insert the statistics in seller_statistics table
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to use the updated function
DROP TRIGGER IF EXISTS update_seller_stats_trigger ON listings;
CREATE TRIGGER update_seller_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_seller_statistics(); 