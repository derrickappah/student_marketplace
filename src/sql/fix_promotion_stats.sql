-- Create or replace the get_promotion_stats function to bypass RLS
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
AS $$
BEGIN
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

-- Set permissions to allow the function to be called via RPC
GRANT EXECUTE ON FUNCTION get_promotion_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_stats() TO anon;

-- Create a policy that allows admins to query listings for statistics
DROP POLICY IF EXISTS "Admins can view all listings for stats" ON listings;
CREATE POLICY "Admins can view all listings for stats" ON listings
FOR SELECT
TO authenticated
USING ((SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'super_admin')); 