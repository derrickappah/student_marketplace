-- Drop existing policies on notifications table that might be restrictive
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert system notifications" ON notifications;

-- Create a policy allowing system to insert notifications for any user
CREATE POLICY "Allow system notification creation" ON notifications
FOR INSERT WITH CHECK (true);

-- Policy allowing users to insert notifications for themselves (already exists but making sure)
CREATE POLICY "Users can insert notifications for themselves" ON notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Make sure admins can view and manage all notifications
CREATE POLICY "Admins can manage all notifications" ON notifications
USING ((SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'super_admin'));

-- Grant functions for creating notifications the ability to use RLS bypass
-- Note: The following requires the SECURITY DEFINER functions for notification creation

-- Create a function for system notifications that bypasses RLS
CREATE OR REPLACE FUNCTION create_system_notification(
  p_user_id UUID,
  p_message TEXT,
  p_type TEXT,
  p_listing_id UUID DEFAULT NULL,
  p_offer_id UUID DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
) RETURNS UUID
SECURITY DEFINER 
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, 
    message, 
    type, 
    listing_id, 
    offer_id, 
    conversation_id,
    related_id,
    read,
    created_at
  ) VALUES (
    p_user_id,
    p_message,
    p_type,
    p_listing_id,
    p_offer_id,
    p_conversation_id,
    p_related_id,
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql; 