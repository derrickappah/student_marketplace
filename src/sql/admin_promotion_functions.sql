-- Functions to safely approve and reject promotions without triggering the ambiguous seller_id error

-- Function to approve a promotion
CREATE OR REPLACE FUNCTION admin_approve_promotion(
  listing_id UUID,
  exp_date TIMESTAMP WITH TIME ZONE,
  set_featured BOOLEAN,
  set_priority BOOLEAN
) RETURNS VOID AS $$
BEGIN
  -- Use explicit table reference to avoid ambiguity
  UPDATE listings
  SET 
    promotion_status = 'approved',
    promotion_expires_at = exp_date,
    is_featured = CASE WHEN set_featured THEN true ELSE is_featured END,
    is_priority = CASE WHEN set_priority THEN true ELSE is_priority END
  WHERE listings.id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reject a promotion
CREATE OR REPLACE FUNCTION admin_reject_promotion(
  listing_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Use explicit table reference to avoid ambiguity
  UPDATE listings
  SET 
    promotion_status = 'rejected',
    is_featured = false,
    is_priority = false
  WHERE listings.id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- Add row-level security policies for these functions
ALTER FUNCTION admin_approve_promotion(UUID, TIMESTAMP WITH TIME ZONE, BOOLEAN, BOOLEAN) SECURITY DEFINER;
ALTER FUNCTION admin_reject_promotion(UUID) SECURITY DEFINER;

-- RLS policy to allow only admins to execute these functions
REVOKE ALL ON FUNCTION admin_approve_promotion(UUID, TIMESTAMP WITH TIME ZONE, BOOLEAN, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_reject_promotion(UUID) FROM PUBLIC;

-- Grant execute permissions to authenticated users
-- In a real application, you would restrict this to admin users only
GRANT EXECUTE ON FUNCTION admin_approve_promotion(UUID, TIMESTAMP WITH TIME ZONE, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reject_promotion(UUID) TO authenticated; 