-- Fix for missing get_promotion_stats_cached function
-- This SQL script should be run to fix the 404 error with the get_promotion_stats_cached function

-- First check if get_promotion_stats exists, as it's a dependency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_promotion_stats'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Create the base get_promotion_stats function if it doesn't exist
    EXECUTE $EXEC$
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
    AS $FUNC$
    BEGIN
      -- Use a single scan of the listings table to gather all counts efficiently
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
    $FUNC$ LANGUAGE plpgsql;
    $EXEC$;
    
    -- Set permissions for the base function
    EXECUTE $EXEC$
    GRANT EXECUTE ON FUNCTION get_promotion_stats() TO authenticated;
    GRANT EXECUTE ON FUNCTION get_promotion_stats() TO anon;
    $EXEC$;
  END IF;
END
$$;

-- Now create or replace the cached function
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
  -- This function calls the base function - can be enhanced later with materialized data
  RETURN QUERY SELECT * FROM get_promotion_stats();
END;
$$ LANGUAGE plpgsql;

-- Set permissions for the cached function
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_stats_cached() TO anon;

-- Add a comment explaining the function
COMMENT ON FUNCTION get_promotion_stats_cached() IS 
  'Cached version of get_promotion_stats to prevent timeouts. Can be enhanced with materialized data.'; 