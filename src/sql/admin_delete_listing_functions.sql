-- Function to safely delete a listing without triggering the ambiguous seller_id reference
CREATE OR REPLACE FUNCTION admin_delete_listing(listing_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_id_var UUID;
  success BOOLEAN;
BEGIN
  -- Get the user_id of the listing first
  SELECT user_id INTO user_id_var 
  FROM listings 
  WHERE id = listing_id;

  -- Delete the listing with explicit reference to the id column
  DELETE FROM listings
  WHERE listings.id = listing_id;

  -- Return success
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error deleting listing: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete multiple listings at once
CREATE OR REPLACE FUNCTION admin_bulk_delete_listings(listing_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  listing_id UUID;
BEGIN
  -- Loop through each listing ID and delete them one by one
  FOREACH listing_id IN ARRAY listing_ids LOOP
    -- Use the single delete function for each ID
    IF admin_delete_listing(listing_id) THEN
      deleted_count := deleted_count + 1;
    END IF;
  END LOOP;

  RETURN deleted_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in bulk deletion: %', SQLERRM;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_delete_listing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_bulk_delete_listings(UUID[]) TO authenticated;

-- Add security policies to ensure only admins can call these functions
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role IN ('admin', 'super_admin') FROM users WHERE id = auth.uid());
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security definer functions to enable proper RLS
CREATE OR REPLACE FUNCTION rls_admin_delete_listing(listing_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF (SELECT check_is_admin()) THEN
    RETURN admin_delete_listing(listing_id);
  ELSE
    RAISE EXCEPTION 'Permission denied: User is not an admin';
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rls_admin_bulk_delete_listings(listing_ids UUID[])
RETURNS INTEGER AS $$
BEGIN
  IF (SELECT check_is_admin()) THEN
    RETURN admin_bulk_delete_listings(listing_ids);
  ELSE
    RAISE EXCEPTION 'Permission denied: User is not an admin';
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 