-- Fix for the missing get_promotion_stats_cached function

-- Create the cached version of get_promotion_stats
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
  -- Use a more efficient approach with a single table scan
  RETURN QUERY
  WITH counts AS (
    SELECT
      CASE WHEN promotion_status = 'pending' THEN 1 ELSE 0 END AS is_pending,
      CASE WHEN promotion_status = 'approved' THEN 1 ELSE 0 END AS is_approved,
      CASE WHEN promotion_status = 'rejected' THEN 1 ELSE 0 END AS is_rejected,
      CASE WHEN promotion_status = 'pending' AND is_featured AND NOT is_priority THEN 1 ELSE 0 END AS is_featured_pending,
      CASE WHEN promotion_status = 'approved' AND is_featured AND NOT is_priority THEN 1 ELSE 0 END AS is_featured_approved,
      CASE WHEN promotion_status = 'pending' AND is_priority AND NOT is_featured THEN 1 ELSE 0 END AS is_priority_pending,
      CASE WHEN promotion_status = 'approved' AND is_priority AND NOT is_featured THEN 1 ELSE 0 END AS is_priority_approved,
      CASE WHEN promotion_status = 'pending' AND is_featured AND is_priority THEN 1 ELSE 0 END AS is_both_pending,
      CASE WHEN promotion_status = 'approved' AND is_featured AND is_priority THEN 1 ELSE 0 END AS is_both_approved
    FROM listings
  )
  SELECT
    SUM(is_pending)::INT,
    SUM(is_approved)::INT,
    SUM(is_rejected)::INT,
    SUM(is_featured_pending)::INT,
    SUM(is_featured_approved)::INT,
    SUM(is_priority_pending)::INT,
    SUM(is_priority_approved)::INT,
    SUM(is_both_pending)::INT,
    SUM(is_both_approved)::INT
  FROM counts;
END;
$$ LANGUAGE plpgsql;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO anon; 