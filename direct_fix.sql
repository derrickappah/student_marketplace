-- Direct fix script that can be run in Supabase dashboard SQL Editor
-- This doesn't require Node.js

-- 1. First, fix the admin_logs constraint issue
ALTER TABLE admin_logs ALTER COLUMN admin_id DROP NOT NULL;

-- 2. Fix the exec_sql function to handle NULL admin_id
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS SETOF json AS $$
DECLARE 
  result json;
BEGIN
  -- Log the SQL action first (without requiring admin_id)
  INSERT INTO admin_logs (
    action, 
    details, 
    performed_at
  ) VALUES (
    'execute_sql',
    json_build_object('query', sql_query),
    now()
  );
  
  -- Execute the query
  FOR result IN EXECUTE sql_query LOOP
    RETURN NEXT result;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the cached stats function
CREATE OR REPLACE FUNCTION get_promotion_stats_cached()
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
) 
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be enhanced later to use a cache table
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO anon;

-- 4. Create safe delete listing function
CREATE OR REPLACE FUNCTION safe_delete_listing(listing_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  success BOOLEAN := false;
BEGIN
  BEGIN
    -- First, try to delete any related promotion records
    DELETE FROM listing_promotions WHERE listing_id = listing_id_param;
    
    -- Also check promotion_request_history
    DELETE FROM promotion_request_history WHERE listing_id = listing_id_param;
    
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

GRANT EXECUTE ON FUNCTION safe_delete_listing(UUID) TO authenticated; 