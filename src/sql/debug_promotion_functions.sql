-- Functions to debug listing promotion issues
-- These are admin-only functions that require the service_role to execute

-- Function to directly update a listing's promotion status using admin permissions
CREATE OR REPLACE FUNCTION admin_debug_promotion(
  listing_id UUID,
  is_featured BOOLEAN,
  is_priority BOOLEAN
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update the listing directly
  UPDATE listings 
  SET 
    is_featured = $2,
    is_priority = $3,
    promotion_status = 'pending',
    updated_at = NOW()
  WHERE id = $1
  RETURNING jsonb_build_object(
    'id', id,
    'promotion_status', promotion_status,
    'is_featured', is_featured,
    'is_priority', is_priority,
    'updated_at', updated_at
  ) INTO result;
  
  -- Check if the promotion_request_history table has a record
  result := result || jsonb_build_object(
    'history_exists', EXISTS (
      SELECT 1 FROM promotion_request_history 
      WHERE listing_id = $1 
      AND status = 'pending'
    )
  );
  
  -- Check if the trigger is enabled
  result := result || jsonb_build_object(
    'trigger_enabled', EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'promotion_history_trigger'
      AND tgenabled = 'O'
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to directly fetch a listing's details for admin purposes
CREATE OR REPLACE FUNCTION get_listing_for_admin(listing_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listing_data JSONB;
  history_data JSONB;
BEGIN
  -- Get the listing data
  SELECT jsonb_build_object(
    'id', l.id,
    'title', l.title,
    'user_id', l.user_id,
    'promotion_status', l.promotion_status,
    'is_featured', l.is_featured,
    'is_priority', l.is_priority,
    'updated_at', l.updated_at
  )
  INTO listing_data
  FROM listings l
  WHERE l.id = listing_id;
  
  -- Get any promotion history data
  SELECT jsonb_agg(jsonb_build_object(
    'id', h.id,
    'listing_id', h.listing_id,
    'user_id', h.user_id,
    'promotion_type', h.promotion_type,
    'status', h.status,
    'requested_at', h.requested_at
  ))
  INTO history_data
  FROM promotion_request_history h
  WHERE h.listing_id = listing_id;
  
  -- Return combined data
  RETURN jsonb_build_object(
    'listing', listing_data,
    'history', history_data
  );
END;
$$ LANGUAGE plpgsql;

-- Function to force a promotion status update for debugging
CREATE OR REPLACE FUNCTION force_promotion_status(
  listing_id UUID,
  new_status TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validate the status
  IF new_status NOT IN ('none', 'pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid promotion status: %', new_status;
  END IF;
  
  -- Directly update the listing status
  UPDATE listings
  SET promotion_status = new_status
  WHERE id = listing_id
  RETURNING jsonb_build_object(
    'id', id,
    'promotion_status', promotion_status,
    'updated_at', updated_at
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 