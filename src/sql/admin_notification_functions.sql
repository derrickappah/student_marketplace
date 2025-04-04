-- SQL functions to help with notifications and admin logging

-- Function to create a notification while bypassing RLS
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param UUID,
  message_param TEXT,
  type_param TEXT,
  listing_id_param UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    message,
    type,
    listing_id,
    read,
    created_at
  ) VALUES (
    user_id_param,
    message_param,
    type_param,
    listing_id_param,
    FALSE,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions while bypassing RLS
CREATE OR REPLACE FUNCTION log_admin_action(
  admin_id_param UUID,
  action_type_param TEXT,
  details_param TEXT,
  target_id_param TEXT,
  target_type_param TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_logs (
    admin_id,
    action_type,
    details,
    target_id,
    target_type,
    ip_address,
    created_at
  ) VALUES (
    admin_id_param,
    action_type_param,
    details_param,
    target_id_param,
    target_type_param,
    '127.0.0.1',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set security for these functions
REVOKE ALL ON FUNCTION create_notification(UUID, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION log_admin_action(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated; 