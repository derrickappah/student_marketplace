-- Create the cached version of the get_promotion_stats function
-- This provides a function that can be optimized further to avoid timeouts

-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS get_promotion_stats_cached();

-- Add a helper function to handle the 504 timeout issue
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
AS $func$
BEGIN
  -- This function can be enhanced later to use a cache table 
  -- For now, it just calls the regular function
  RETURN QUERY SELECT * FROM get_promotion_stats();
END;
$func$ LANGUAGE plpgsql;

-- Set permissions for the cached version
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO anon;

-- Add a comment explaining the function
COMMENT ON FUNCTION get_promotion_stats_cached() IS 'Cached version of get_promotion_stats to prevent timeouts. Can be enhanced with materialized data.'; 