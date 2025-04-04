-- Fix the promotion request history table and RLS policies

-- Drop existing RLS policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view their own promotion requests" ON promotion_request_history;
DROP POLICY IF EXISTS "Admin can view all promotion requests" ON promotion_request_history;
DROP POLICY IF EXISTS "Users can insert promotion requests" ON promotion_request_history;

-- Check if the promotion_request_history table exists, create it if not
CREATE TABLE IF NOT EXISTS promotion_request_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('featured', 'priority', 'both')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Ensure RLS is enabled on the promotion history table
ALTER TABLE promotion_request_history ENABLE ROW LEVEL SECURITY;

-- Create better policies for promotion request history
-- Users can view their own promotion requests
CREATE POLICY "Users can view their own promotion requests" ON promotion_request_history
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view and manage all promotion requests
CREATE POLICY "Admins can manage all promotion requests" ON promotion_request_history
  FOR ALL USING ((SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'super_admin'));

-- Create a SECURITY DEFINER function to get promotion history
CREATE OR REPLACE FUNCTION get_promotion_history()
RETURNS SETOF promotion_request_history
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM promotion_request_history
  ORDER BY processed_at DESC NULLS LAST, requested_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_promotion_history() TO authenticated;

-- Create a function to insert a promotion request correctly
CREATE OR REPLACE FUNCTION insert_promotion_request(
  p_listing_id UUID,
  p_user_id UUID,
  p_promotion_type TEXT,
  p_status TEXT DEFAULT 'pending',
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO promotion_request_history (
    listing_id,
    user_id,
    promotion_type,
    status,
    requested_at,
    admin_notes
  ) VALUES (
    p_listing_id,
    p_user_id,
    p_promotion_type,
    p_status,
    NOW(),
    p_admin_notes
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to process a promotion request
CREATE OR REPLACE FUNCTION process_promotion_request(
  p_request_id UUID,
  p_new_status TEXT,
  p_admin_notes TEXT DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promotion_request_history
  SET 
    status = p_new_status,
    processed_at = NOW(),
    processed_by = auth.uid(),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    expires_at = p_expires_at
  WHERE id = p_request_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Check and fix the trigger for updating history
DROP TRIGGER IF EXISTS promotion_history_trigger ON listings;

CREATE OR REPLACE FUNCTION update_promotion_history()
RETURNS TRIGGER AS $$
DECLARE
  promo_type TEXT;
  history_id UUID;
BEGIN
  -- If promotion status changed from 'none' to 'pending'
  IF OLD.promotion_status = 'none' AND NEW.promotion_status = 'pending' THEN
    -- Determine promotion type
    IF NEW.is_featured AND NEW.is_priority THEN
      promo_type := 'both';
    ELSIF NEW.is_featured THEN
      promo_type := 'featured';
    ELSIF NEW.is_priority THEN
      promo_type := 'priority';
    ELSE
      RAISE EXCEPTION 'Invalid promotion type: neither featured nor priority is selected';
    END IF;
    
    -- Insert new record to promotion history - use the function to bypass RLS
    history_id := insert_promotion_request(
      NEW.id,
      NEW.user_id,
      promo_type
    );
    
  -- If promotion status changed from 'pending' to 'approved' or 'rejected'
  ELSIF OLD.promotion_status = 'pending' AND (NEW.promotion_status = 'approved' OR NEW.promotion_status = 'rejected') THEN
    -- Update existing record - use the function to bypass RLS
    PERFORM process_promotion_request(
      (SELECT id FROM promotion_request_history WHERE listing_id = NEW.id AND status = 'pending' ORDER BY requested_at DESC LIMIT 1),
      NEW.promotion_status,
      NULL,
      NEW.promotion_expires_at
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER promotion_history_trigger
AFTER UPDATE ON listings
FOR EACH ROW
WHEN (OLD.promotion_status IS DISTINCT FROM NEW.promotion_status)
EXECUTE FUNCTION update_promotion_history();

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_promotion_history() TO authenticated;
GRANT EXECUTE ON FUNCTION insert_promotion_request(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_promotion_request(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated; 