-- Enhanced Notifications System for Real-time Messaging

-- Update the notifications table to add sender_id and preview fields
ALTER TABLE IF EXISTS notifications
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS preview TEXT,
ADD COLUMN IF NOT EXISTS is_seen BOOLEAN DEFAULT FALSE; -- for tracking if notification has been seen

-- Function to create an enhanced message notification
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
GRANT EXECUTE ON FUNCTION public.create_message_notification(UUID, UUID, TEXT, UUID, UUID) TO authenticated;

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
GRANT EXECUTE ON FUNCTION public.mark_conversation_notifications_seen(UUID, UUID) TO authenticated;

-- Trigger function to create a notification when a new message is inserted
CREATE OR REPLACE FUNCTION message_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  receiver_id UUID;
  listing_id UUID;
BEGIN
  -- Find the other participant (receiver) in the conversation
  SELECT cp.user_id INTO receiver_id
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id <> NEW.sender_id
  LIMIT 1;
  
  -- If there's no other participant (should never happen), return
  IF receiver_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Find if this conversation is related to a listing
  SELECT c.listing_id INTO listing_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;
  
  -- Create notification for the receiver
  PERFORM create_message_notification(
    receiver_id,
    NEW.sender_id,
    NEW.content,
    NEW.conversation_id,
    listing_id
  );
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION message_notification_trigger();

-- Add function to get unread notification count 
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count_result INTEGER;
BEGIN
  IF user_uuid IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO count_result
  FROM notifications
  WHERE user_id = user_uuid
    AND read = FALSE;
    
  RETURN count_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(UUID) TO authenticated;

-- Function to get notification badge counts by type
CREATE OR REPLACE FUNCTION get_notification_badges(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INTEGER;
  message_count INTEGER;
  offer_count INTEGER;
  other_count INTEGER;
  result JSONB;
BEGIN
  IF user_uuid IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User ID is required'
    );
  END IF;
  
  -- Count unread notifications by type
  SELECT 
    COUNT(*) FILTER (WHERE read = FALSE) AS total_unread,
    COUNT(*) FILTER (WHERE read = FALSE AND type = 'message') AS unread_messages,
    COUNT(*) FILTER (WHERE read = FALSE AND (type = 'offer' OR type = 'offer_response')) AS unread_offers,
    COUNT(*) FILTER (WHERE read = FALSE AND type NOT IN ('message', 'offer', 'offer_response')) AS unread_other
  INTO
    total, message_count, offer_count, other_count
  FROM notifications
  WHERE user_id = user_uuid;
  
  -- Create result
  result := jsonb_build_object(
    'success', TRUE,
    'total', total,
    'messages', message_count,
    'offers', offer_count,
    'other', other_count,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_notification_badges(UUID) TO authenticated;

-- Admin function to check if a trigger exists
CREATE OR REPLACE FUNCTION admin_check_trigger_exists(trigger_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = trigger_name
  ) INTO trigger_exists;
  
  RETURN jsonb_build_object(
    'exists', trigger_exists,
    'trigger_name', trigger_name
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'exists', FALSE,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_check_trigger_exists(TEXT) TO authenticated; 