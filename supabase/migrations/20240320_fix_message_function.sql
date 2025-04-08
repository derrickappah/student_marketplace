-- Fix the send_message_to_conversation function to properly handle the updated_at field
CREATE OR REPLACE FUNCTION public.send_message_to_conversation(
  conv_id UUID,
  sender_id UUID,
  message_content TEXT,
  message_images TEXT[] DEFAULT NULL,
  related_listing_id UUID DEFAULT NULL,
  has_attachments BOOLEAN DEFAULT FALSE,
  reply_to_message_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_participant BOOLEAN;
  other_user_id UUID;
  listing_title TEXT;
  new_message_id UUID;
  result JSONB;
BEGIN
  -- Basic validation
  IF conv_id IS NULL OR sender_id IS NULL OR message_content IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Conversation ID, sender ID, and message content are all required'
    );
  END IF;
  
  -- Check if the conversation exists
  IF NOT EXISTS (SELECT 1 FROM conversations WHERE id = conv_id) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Conversation not found'
    );
  END IF;
  
  -- Check if sender is a participant in the conversation
  SELECT EXISTS(
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conv_id AND user_id = sender_id
  ) INTO is_participant;
  
  IF NOT is_participant THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User is not a participant in this conversation'
    );
  END IF;
  
  -- Get the other participant for notification
  SELECT user_id INTO other_user_id
  FROM conversation_participants
  WHERE conversation_id = conv_id AND user_id != sender_id
  LIMIT 1;
  
  -- Get listing title if related_listing_id is provided
  IF related_listing_id IS NOT NULL THEN
    SELECT title INTO listing_title
    FROM listings
    WHERE id = related_listing_id;
  END IF;
  
  -- Insert the message with all fields
  INSERT INTO messages (
    conversation_id, 
    sender_id, 
    content, 
    message_images,
    has_attachments,
    reply_to_message_id,
    read_status,
    created_at
  )
  VALUES (
    conv_id, 
    sender_id, 
    message_content, 
    message_images,
    has_attachments,
    reply_to_message_id,
    'sent',
    NOW()
  )
  RETURNING id INTO new_message_id;
  
  -- Update conversation's updated_at timestamp using the trigger
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = conv_id;
  
  -- Create a notification for the receiver
  IF other_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      message,
      conversation_id,
      created_at
    )
    VALUES (
      other_user_id,
      'message',
      'New message from ' || (SELECT name FROM users WHERE id = sender_id),
      conv_id,
      NOW()
    );
  END IF;
  
  -- Create a read receipt for the sender's message (marking as sent)
  INSERT INTO message_read_receipts (
    message_id,
    user_id,
    status,
    updated_at
  )
  VALUES (
    new_message_id,
    sender_id,
    'sent',
    NOW()
  );
  
  -- Build the result
  result := jsonb_build_object(
    'success', TRUE,
    'message', jsonb_build_object(
      'id', new_message_id,
      'conversation_id', conv_id,
      'sender_id', sender_id,
      'content', message_content,
      'message_images', message_images,
      'has_attachments', has_attachments,
      'reply_to_message_id', reply_to_message_id,
      'read_status', 'sent',
      'created_at', NOW()
    )
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
GRANT EXECUTE ON FUNCTION public.send_message_to_conversation(UUID, UUID, TEXT, TEXT[], UUID, BOOLEAN, UUID) TO authenticated;

COMMENT ON FUNCTION public.send_message_to_conversation(UUID, UUID, TEXT, TEXT[], UUID, BOOLEAN, UUID) IS 
'Sends a message to a conversation with support for images and attachments, bypassing RLS policies'; 