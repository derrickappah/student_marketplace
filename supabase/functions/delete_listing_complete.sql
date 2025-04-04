-- Function to safely delete a listing and all related records
CREATE OR REPLACE FUNCTION delete_listing_complete(p_listing_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_owner BOOLEAN;
BEGIN
  -- Check if the user owns the listing
  SELECT user_id INTO v_user_id
  FROM listings l
  WHERE l.id = p_listing_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  
  v_is_owner := (v_user_id = p_user_id);
  
  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'User does not own this listing';
  END IF;
  
  -- Delete saved listings first (with table alias)
  DELETE FROM saved_listings sl
  WHERE sl.listing_id = p_listing_id;
  
  -- Delete offers (with table alias)
  DELETE FROM offers o
  WHERE o.listing_id = p_listing_id;
  
  -- Delete the listing itself (with table alias)
  DELETE FROM listings l
  WHERE l.id = p_listing_id
    AND l.user_id = p_user_id;
    
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 