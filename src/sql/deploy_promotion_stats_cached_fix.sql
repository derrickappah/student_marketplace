-- Simplified fix for missing promotion stats functions
-- This ensures we return data even if there are no matching records

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_promotion_stats_cached();
DROP FUNCTION IF EXISTS get_promotion_stats();

-- Create the base get_promotion_stats function
CREATE OR REPLACE FUNCTION get_promotion_stats()
RETURNS TABLE (
  total_pending INT,
  total_approved INT,
  total_rejected INT,
  featured_pending INT,
  featured_approved INT,
  featured_rejected INT,
  priority_pending INT,
  priority_approved INT,
  priority_rejected INT,
  both_pending INT,
  both_approved INT,
  both_rejected INT
) 
SECURITY DEFINER
AS $$
BEGIN
  -- This version ensures we return a row with zeros if there's no data
  RETURN QUERY
  SELECT
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'pending'), 0)::INT as total_pending,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'approved'), 0)::INT as total_approved,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'rejected'), 0)::INT as total_rejected,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'pending' AND is_featured AND NOT is_priority), 0)::INT as featured_pending,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'approved' AND is_featured AND NOT is_priority), 0)::INT as featured_approved,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'rejected' AND is_featured AND NOT is_priority), 0)::INT as featured_rejected,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'pending' AND is_priority AND NOT is_featured), 0)::INT as priority_pending,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'approved' AND is_priority AND NOT is_featured), 0)::INT as priority_approved,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'rejected' AND is_priority AND NOT is_featured), 0)::INT as priority_rejected,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'pending' AND is_featured AND is_priority), 0)::INT as both_pending,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'approved' AND is_featured AND is_priority), 0)::INT as both_approved,
    COALESCE((SELECT COUNT(*) FROM listings WHERE promotion_status = 'rejected' AND is_featured AND is_priority), 0)::INT as both_rejected;
END;
$$ LANGUAGE plpgsql;

-- Set permissions for the base function
GRANT EXECUTE ON FUNCTION get_promotion_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_stats() TO anon;

-- Create the cached version
CREATE OR REPLACE FUNCTION get_promotion_stats_cached()
RETURNS TABLE (
  total_pending INT,
  total_approved INT,
  total_rejected INT,
  featured_pending INT,
  featured_approved INT,
  featured_rejected INT,
  priority_pending INT,
  priority_approved INT,
  priority_rejected INT,
  both_pending INT,
  both_approved INT,
  both_rejected INT
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Simply return results from the base function
  RETURN QUERY SELECT * FROM get_promotion_stats();
END;
$$ LANGUAGE plpgsql;

-- Set permissions for the cached function
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO anon; 