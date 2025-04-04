-- Simple fix for the promotion statistics functions
-- This ensures we can display promotion statistics in the admin dashboard

-- First drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_promotion_stats_cached();
DROP FUNCTION IF EXISTS get_promotion_stats();

-- Create the base function first
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
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE promotion_status = 'pending'), 0)::INT as total_pending,
    COALESCE(COUNT(*) FILTER (WHERE promotion_status = 'approved'), 0)::INT as total_approved,
    COALESCE(COUNT(*) FILTER (WHERE promotion_status = 'rejected'), 0)::INT as total_rejected,
    COALESCE(COUNT(*) FILTER (WHERE promotion_status = 'pending' AND is_featured AND NOT is_priority), 0)::INT as featured_pending,
    COALESCE(COUNT(*) FILTER (WHERE promotion_status = 'approved' AND is_featured AND NOT is_priority), 0)::INT as featured_approved,
    COALESCE(COUNT(*) FILTER (WHERE promotion_status = 'pending' AND is_priority AND NOT is_featured), 0)::INT as priority_pending,
    COALESCE(COUNT(*) FILTER (WHERE promotion_status = 'approved' AND is_priority AND NOT is_featured), 0)::INT as priority_approved,
    COALESCE(COUNT(*) FILTER (WHERE promotion_status = 'pending' AND is_featured AND is_priority), 0)::INT as both_pending,
    COALESCE(COUNT(*) FILTER (WHERE promotion_status = 'approved' AND is_featured AND is_priority), 0)::INT as both_approved
  FROM listings;
END;
$function$;

-- Grant execution permissions for the base function
GRANT EXECUTE ON FUNCTION get_promotion_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_stats() TO anon;

-- Now create the cached version that just wraps the base function
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
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM get_promotion_stats();
END;
$function$;

-- Grant execution permissions for the cached function
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO anon; 