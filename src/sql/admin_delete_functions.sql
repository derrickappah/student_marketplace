-- Simple function to delete a listing with explicit column references
-- This avoids the ambiguous seller_id error
CREATE OR REPLACE FUNCTION admin_delete_listing(p_listing_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete with fully qualified column names to avoid ambiguity
  DELETE FROM listings 
  WHERE listings.id = p_listing_id;
  
  -- Return true if something was deleted
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete multiple listings at once
CREATE OR REPLACE FUNCTION admin_bulk_delete_listings(p_listing_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_id UUID;
BEGIN
  -- Process each ID one by one
  FOREACH v_id IN ARRAY p_listing_ids LOOP
    -- Use the single deletion function
    IF admin_delete_listing(v_id) THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_delete_listing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_bulk_delete_listings(UUID[]) TO authenticated;

-- Create RLS policy to ensure only admins can execute the function
CREATE OR REPLACE FUNCTION check_admin_for_deletion()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'super_admin') 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql; 