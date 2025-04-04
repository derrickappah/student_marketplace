-- Fix the constraint issue with listing_promotions table
-- This prevents listings from being deleted due to foreign key constraints

-- First, let's check if the listing_promotions table exists
DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'listing_promotions'
  ) THEN
    RAISE NOTICE 'listing_promotions table exists, proceeding with fix';
    
    -- Check if promotions exist for the specific listing
    -- Using COUNT instead of pg_typeof to avoid multi-column issue
    IF EXISTS (
      SELECT 1 FROM listing_promotions 
      WHERE listing_id = '3e73a449-b82b-4be2-b160-4d3113e67018' 
      LIMIT 1
    ) THEN
      RAISE NOTICE 'Found promotion record for the problematic listing';
    ELSE
      RAISE NOTICE 'No promotion record found for the problematic listing';
    END IF;
    
    -- Check for existing constraint
    IF EXISTS (
      SELECT FROM information_schema.table_constraints
      WHERE constraint_name = 'listing_promotions_listing_id_fkey'
      AND table_name = 'listing_promotions'
    ) THEN
      -- Add cascade delete to the constraint if it doesn't have it
      ALTER TABLE listing_promotions 
      DROP CONSTRAINT IF EXISTS listing_promotions_listing_id_fkey;
      
      ALTER TABLE listing_promotions
      ADD CONSTRAINT listing_promotions_listing_id_fkey 
      FOREIGN KEY (listing_id) 
      REFERENCES listings(id)
      ON DELETE CASCADE;
      
      RAISE NOTICE 'Fixed listing_promotions constraint to use CASCADE DELETE';
    END IF;
    
    -- Delete any orphaned records (if the listing doesn't exist)
    DELETE FROM listing_promotions 
    WHERE NOT EXISTS (
      SELECT 1 FROM listings WHERE listings.id = listing_promotions.listing_id
    );
    
    RAISE NOTICE 'Cleaned up orphaned records in listing_promotions';
  ELSE
    RAISE NOTICE 'listing_promotions table not found, looking for other tables with listings references';
    
    -- Look for all foreign keys referencing listings
    FOR r IN 
      SELECT tc.table_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'listings'
    LOOP
      EXECUTE format('
        ALTER TABLE %I 
        DROP CONSTRAINT IF EXISTS %I;
      ', r.table_name, r.constraint_name);
      
      EXECUTE format('
        ALTER TABLE %I
        ADD CONSTRAINT %I 
        FOREIGN KEY (listing_id) 
        REFERENCES listings(id)
        ON DELETE CASCADE;
      ', r.table_name, r.constraint_name || '_cascade');
      
      RAISE NOTICE 'Fixed constraint % on table % to use CASCADE DELETE', 
        r.constraint_name, r.table_name;
    END LOOP;
  END IF;
END $$;

-- Create a function to safely delete a listing by handling all dependencies
CREATE OR REPLACE FUNCTION safe_delete_listing(listing_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  success BOOLEAN := false;
  error_message TEXT;
BEGIN
  -- Begin a transaction
  BEGIN
    -- First, try to delete any related promotion records
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'listing_promotions'
    ) THEN
      EXECUTE 'DELETE FROM listing_promotions WHERE listing_id = $1' 
      USING listing_id_param;
    END IF;
    
    -- Also check promotion_request_history
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
    error_message := SQLERRM;
    RAISE NOTICE 'Error deleting listing: %', error_message;
    success := false;
  END;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION safe_delete_listing(UUID) TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION safe_delete_listing(UUID) IS 
  'Safely delete a listing by first removing all dependencies (promotions, offers, etc.)';

-- Create a trigger to clean up related records when a listing is deleted
CREATE OR REPLACE FUNCTION clean_listing_dependencies()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up from listing_promotions if it exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'listing_promotions'
  ) THEN
    EXECUTE 'DELETE FROM listing_promotions WHERE listing_id = $1' 
    USING OLD.id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Only create the trigger if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger
    WHERE tgname = 'before_listing_delete'
  ) THEN
    CREATE TRIGGER before_listing_delete
    BEFORE DELETE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION clean_listing_dependencies();
    
    RAISE NOTICE 'Created before_listing_delete trigger';
  END IF;
END $$; 