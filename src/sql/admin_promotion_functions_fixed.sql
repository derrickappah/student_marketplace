-- Functions to safely approve and reject promotions without triggering the ambiguous seller_id error

-- Function to approve a promotion
-- This version uses direct SQL to avoid ambiguous column references without disabling triggers
CREATE OR REPLACE FUNCTION admin_approve_promotion_fixed(
  listing_id UUID,
  exp_date TIMESTAMP WITH TIME ZONE,
  set_featured BOOLEAN,
  set_priority BOOLEAN
) RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
  listing_user_id UUID;
  promotion_type TEXT;
  sql_query TEXT;
BEGIN
  -- Store the current user ID for later use in history
  current_user_id := auth.uid();
  
  -- Get the user_id from the listing using a parameterized query to avoid injection
  SELECT user_id INTO listing_user_id 
  FROM listings 
  WHERE id = listing_id;
  
  -- Determine promotion type for history
  IF set_featured AND set_priority THEN
    promotion_type := 'both';
  ELSIF set_featured THEN
    promotion_type := 'featured';
  ELSIF set_priority THEN
    promotion_type := 'priority';
  ELSE
    promotion_type := 'unknown';
  END IF;
  
  -- Construct a dynamic query with explicit table references to avoid ambiguity
  sql_query := format(
    'UPDATE listings SET 
      promotion_status = %L, 
      promotion_expires_at = %L,
      is_featured = CASE WHEN %L THEN true ELSE is_featured END,
      is_priority = CASE WHEN %L THEN true ELSE is_priority END
    WHERE listings.id = %L',
    'approved', 
    exp_date, 
    set_featured, 
    set_priority,
    listing_id
  );
  
  -- Execute the dynamic query directly
  EXECUTE sql_query;
  
  -- Handle the promotion history separately
  UPDATE promotion_request_history
  SET 
    status = 'approved',
    processed_at = NOW(),
    processed_by = current_user_id,
    expires_at = exp_date
  WHERE 
    listing_id = listing_id AND 
    status = 'pending';
  
  -- If no history record exists, create one
  IF NOT FOUND THEN
    INSERT INTO promotion_request_history (
      listing_id, 
      user_id, 
      promotion_type, 
      status, 
      requested_at,
      processed_at,
      processed_by,
      expires_at
    ) VALUES (
      listing_id,
      listing_user_id,
      promotion_type,
      'approved',
      NOW(),
      NOW(),
      current_user_id,
      exp_date
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a promotion
-- This version uses direct SQL to avoid ambiguous column references without disabling triggers
CREATE OR REPLACE FUNCTION admin_reject_promotion_fixed(
  listing_id UUID
) RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
  listing_user_id UUID;
  promotion_type TEXT;
  is_featured_val BOOLEAN;
  is_priority_val BOOLEAN;
  sql_query TEXT;
BEGIN
  -- Store the current user ID for later use in history
  current_user_id := auth.uid();
  
  -- Get the user_id and promotion details from the listing
  SELECT 
    user_id, is_featured, is_priority 
  INTO 
    listing_user_id, is_featured_val, is_priority_val
  FROM listings 
  WHERE id = listing_id;
  
  -- Determine promotion type for history
  IF is_featured_val AND is_priority_val THEN
    promotion_type := 'both';
  ELSIF is_featured_val THEN
    promotion_type := 'featured';
  ELSIF is_priority_val THEN
    promotion_type := 'priority';
  ELSE
    promotion_type := 'unknown';
  END IF;
  
  -- Construct a dynamic query with explicit table references to avoid ambiguity
  sql_query := format(
    'UPDATE listings SET 
      promotion_status = %L, 
      is_featured = false,
      is_priority = false
    WHERE listings.id = %L',
    'rejected', 
    listing_id
  );
  
  -- Execute the dynamic query directly
  EXECUTE sql_query;
  
  -- Handle the promotion history separately
  UPDATE promotion_request_history
  SET 
    status = 'rejected',
    processed_at = NOW(),
    processed_by = current_user_id
  WHERE 
    listing_id = listing_id AND 
    status = 'pending';
  
  -- If no history record exists, create one
  IF NOT FOUND THEN
    INSERT INTO promotion_request_history (
      listing_id, 
      user_id, 
      promotion_type, 
      status, 
      requested_at,
      processed_at,
      processed_by
    ) VALUES (
      listing_id,
      listing_user_id,
      promotion_type,
      'rejected',
      NOW(),
      NOW(),
      current_user_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_approve_promotion_fixed(UUID, TIMESTAMP WITH TIME ZONE, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reject_promotion_fixed(UUID) TO authenticated; 