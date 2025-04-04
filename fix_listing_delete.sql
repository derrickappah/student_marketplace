-- Fix for the listing deletion constraint issue

-- 1. First check if the table exists and update the constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'listing_promotions'
  ) THEN
    -- Drop the constraint and recreate it with cascade
    ALTER TABLE listing_promotions 
    DROP CONSTRAINT IF EXISTS listing_promotions_listing_id_fkey;
    
    -- Add the constraint back with CASCADE DELETE
    ALTER TABLE listing_promotions
    ADD CONSTRAINT listing_promotions_listing_id_fkey 
    FOREIGN KEY (listing_id) 
    REFERENCES listings(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Updated listing_promotions constraint to use CASCADE DELETE';
  END IF;
END $$;

-- 2. Create safe delete listing function
CREATE OR REPLACE FUNCTION safe_delete_listing(listing_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  success BOOLEAN := false;
BEGIN
  BEGIN
    -- Try to delete any related promotion records first
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'listing_promotions'
    ) THEN
      EXECUTE 'DELETE FROM listing_promotions WHERE listing_id = $1' 
      USING listing_id_param;
    END IF;
    
    -- Check promotion_request_history
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'promotion_request_history'
    ) THEN
      DELETE FROM promotion_request_history WHERE listing_id = listing_id_param;
    END IF;
    
    -- Delete related offers
    DELETE FROM offers WHERE listing_id = listing_id_param;
    
    -- Delete related saved listings
    DELETE FROM saved_listings WHERE listing_id = listing_id_param;
    
    -- Delete related viewed listings
    DELETE FROM viewed_listings WHERE listing_id = listing_id_param;
    
    -- Finally, delete the listing itself
    DELETE FROM listings WHERE id = listing_id_param;
    
    success := true;
  EXCEPTION WHEN OTHERS THEN
    success := false;
  END;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to use the function
GRANT EXECUTE ON FUNCTION safe_delete_listing(UUID) TO authenticated;

-- Try to delete the problematic listing
DO $$
BEGIN
  PERFORM safe_delete_listing('3e73a449-b82b-4be2-b160-4d3113e67018');
END $$; 