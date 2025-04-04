-- Enhanced Notifications System

-- Update notifications table with additional fields
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS preview TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_seen BOOLEAN DEFAULT FALSE;

-- Update the type check constraint to include more notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('message', 'offer', 'offer_response', 'review', 'listing_status', 'promotion', 'system'));

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_conversation_id ON notifications(conversation_id) WHERE conversation_id IS NOT NULL;

-- Create a function to get notification counts and badge data
CREATE OR REPLACE FUNCTION get_notification_badges(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count INTEGER;
  message_count INTEGER;
  offer_count INTEGER;
  other_count INTEGER;
  result JSONB;
BEGIN
  -- Count all unread notifications
  SELECT COUNT(*) INTO total_count
  FROM notifications
  WHERE user_id = user_uuid AND read = FALSE;
  
  -- Count unread message notifications
  SELECT COUNT(*) INTO message_count
  FROM notifications
  WHERE user_id = user_uuid AND read = FALSE AND type = 'message';
  
  -- Count unread offer notifications
  SELECT COUNT(*) INTO offer_count
  FROM notifications
  WHERE user_id = user_uuid AND read = FALSE AND (type = 'offer' OR type = 'offer_response');
  
  -- Count other unread notifications
  SELECT COUNT(*) INTO other_count
  FROM notifications
  WHERE user_id = user_uuid AND read = FALSE 
    AND type NOT IN ('message', 'offer', 'offer_response');
  
  -- Build the result object
  result := jsonb_build_object(
    'success', TRUE,
    'total', total_count,
    'messages', message_count,
    'offers', offer_count,
    'other', other_count,
    'user_id', user_uuid,
    'timestamp', NOW()
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permissions for the function
GRANT EXECUTE ON FUNCTION get_notification_badges(UUID) TO authenticated;

-- Create function for creating enhanced message notifications
CREATE OR REPLACE FUNCTION create_message_notification(
  receiver_id UUID,
  sender_id UUID,
  message_content TEXT,
  conversation_id UUID,
  listing_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
  listing_title TEXT := NULL;
  truncated_preview TEXT;
  new_notification_id UUID;
  result JSONB;
BEGIN
  -- Basic validation
  IF receiver_id IS NULL OR sender_id IS NULL OR message_content IS NULL OR conversation_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Required parameters missing'
    );
  END IF;
  
  -- Don't create notifications for messages to yourself
  IF receiver_id = sender_id THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'No notification needed for messages to self'
    );
  END IF;
  
  -- Get sender name
  SELECT name INTO sender_name
  FROM users
  WHERE id = sender_id;
  
  -- Get listing title if relevant
  IF listing_id IS NOT NULL THEN
    SELECT title INTO listing_title
    FROM listings
    WHERE id = listing_id;
  END IF;
  
  -- Create preview by truncating message
  IF LENGTH(message_content) > 50 THEN
    truncated_preview := SUBSTRING(message_content FROM 1 FOR 47) || '...';
  ELSE
    truncated_preview := message_content;
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    message,
    read,
    is_seen,
    listing_id,
    conversation_id,
    sender_id,
    preview,
    created_at
  ) VALUES (
    receiver_id,
    'message',
    CASE 
      WHEN listing_title IS NOT NULL THEN 'New message from ' || COALESCE(sender_name, 'someone') || ' about: ' || listing_title
      ELSE 'New message from ' || COALESCE(sender_name, 'someone')
    END,
    FALSE,
    FALSE,
    listing_id,
    conversation_id,
    sender_id,
    truncated_preview,
    NOW()
  )
  RETURNING id INTO new_notification_id;
  
  -- Return success response
  result := jsonb_build_object(
    'success', TRUE,
    'notification_id', new_notification_id,
    'receiver_id', receiver_id,
    'sender_id', sender_id,
    'created_at', NOW()
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_message_notification(UUID, UUID, TEXT, UUID, UUID) TO authenticated;

-- Function to mark notifications as seen for a conversation
CREATE OR REPLACE FUNCTION mark_conversation_notifications_seen(
  user_uuid UUID,
  conv_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
  result JSONB;
BEGIN
  -- Basic validation
  IF user_uuid IS NULL OR conv_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User ID and conversation ID are required'
    );
  END IF;
  
  -- Update matching notifications
  UPDATE notifications
  SET is_seen = TRUE
  WHERE user_id = user_uuid
    AND conversation_id = conv_id
    AND is_seen = FALSE
  RETURNING COUNT(*) INTO updated_count;
  
  -- Return result
  result := jsonb_build_object(
    'success', TRUE,
    'updated_count', updated_count,
    'user_id', user_uuid,
    'conversation_id', conv_id,
    'timestamp', NOW()
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_conversation_notifications_seen(UUID, UUID) TO authenticated;

-- Updated system notification function with improved fields support
CREATE OR REPLACE FUNCTION create_system_notification(
  p_user_id UUID,
  p_message TEXT,
  p_type TEXT,
  p_listing_id UUID DEFAULT NULL,
  p_offer_id UUID DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_sender_id UUID DEFAULT NULL,
  p_preview TEXT DEFAULT NULL
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
    sender_id,
    preview,
    read,
    is_seen,
    created_at
  ) VALUES (
    p_user_id,
    p_message,
    p_type,
    p_listing_id,
    p_offer_id,
    p_conversation_id,
    p_related_id,
    p_sender_id,
    p_preview,
    false,
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_system_notification(UUID, TEXT, TEXT, UUID, UUID, UUID, UUID, UUID, TEXT) TO authenticated;

-- Drop existing restrictive policies on notifications table
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

-- Make sure we have the required policies
-- First drop any existing policies with the same names
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can mark notifications as read" ON notifications;
DROP POLICY IF EXISTS "Allow system notification creation" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;

-- Create policies (without IF NOT EXISTS)
CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can mark notifications as read" ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy allowing system to insert notifications for any user
CREATE POLICY "Allow system notification creation" ON notifications
  FOR INSERT WITH CHECK (true);

-- Make sure admins can view and manage all notifications
CREATE POLICY "Admins can manage all notifications" ON notifications
  USING ((SELECT role FROM users WHERE users.id = auth.uid()) IN ('admin', 'super_admin')); 