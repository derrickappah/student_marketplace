-- Fix for promotion request issue
-- This function manually sets a listing's promotion status to 'pending'
-- and creates the corresponding history record

CREATE OR REPLACE FUNCTION fix_promotion_request(
  p_listing_id UUID,
  p_is_featured BOOLEAN DEFAULT false,
  p_is_priority BOOLEAN DEFAULT false
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listing_data JSONB;
  history_data JSONB;
  listing_record RECORD;
  promo_type TEXT;
BEGIN
  -- Get the listing data first
  SELECT * INTO listing_record
  FROM listings
  WHERE id = p_listing_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;
  
  -- Determine promotion type
  IF p_is_featured AND p_is_priority THEN
    promo_type := 'both';
  ELSIF p_is_featured THEN
    promo_type := 'featured';
  ELSIF p_is_priority THEN
    promo_type := 'priority';
  ELSE
    promo_type := 'unknown';
  END IF;
  
  -- Update the listing directly
  UPDATE listings
  SET 
    promotion_status = 'pending',
    is_featured = p_is_featured,
    is_priority = p_is_priority,
    updated_at = NOW()
  WHERE id = p_listing_id;
  
  -- Manually insert a history record
  INSERT INTO promotion_request_history (
    listing_id,
    user_id,
    promotion_type,
    status,
    requested_at
  ) VALUES (
    p_listing_id,
    listing_record.user_id,
    promo_type,
    'pending',
    NOW()
  )
  -- Only if one doesn't already exist for this listing with pending status
  ON CONFLICT DO NOTHING
  RETURNING jsonb_build_object(
    'id', id,
    'listing_id', listing_id,
    'status', status,
    'requested_at', requested_at
  ) INTO history_data;
  
  -- Get the updated listing data
  SELECT jsonb_build_object(
    'id', id,
    'title', title,
    'promotion_status', promotion_status,
    'is_featured', is_featured,
    'is_priority', is_priority,
    'updated_at', updated_at
  ) INTO listing_data
  FROM listings
  WHERE id = p_listing_id;
  
  -- Return combined data
  RETURN jsonb_build_object(
    'success', true,
    'listing', listing_data,
    'history', history_data
  );
END;
$$ LANGUAGE plpgsql; 