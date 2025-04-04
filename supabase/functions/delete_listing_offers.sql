-- Function to safely delete offers for a specific listing
CREATE OR REPLACE FUNCTION delete_listing_offers(p_listing_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete offers where listing_id matches using explicit table alias
  DELETE FROM offers o
  WHERE o.listing_id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 