-- Function to securely send a message to a conversation
CREATE OR REPLACE FUNCTION public.send_message_to_conversation(
  conv_id UUID,
  sender_id UUID,
  message_content TEXT,
  related_listing_id UUID DEFAULT NULL
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
  notification_columns TEXT;
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
  
  -- Insert the message
  INSERT INTO messages (conversation_id, sender_id, content, created_at)
  VALUES (conv_id, sender_id, message_content, NOW())
  RETURNING id INTO new_message_id;
  
  -- Update conversation's updated_at timestamp
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = conv_id;
  
  -- Create a notification for the receiver if applicable
  IF other_user_id IS NOT NULL THEN
    -- Check if notifications table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
      -- Get column names from notifications table
      SELECT string_agg(column_name, ', ') 
      INTO notification_columns
      FROM information_schema.columns
      WHERE table_name = 'notifications';
      
      -- Check if 'listing_id' column exists
      IF notification_columns LIKE '%listing_id%' AND related_listing_id IS NOT NULL THEN
        -- Insert with listing_id
        EXECUTE 'INSERT INTO notifications (user_id, type, message, listing_id, created_at, read) VALUES ($1, $2, $3, $4, $5, $6)'
        USING 
          other_user_id, 
          'message', 
          CASE WHEN listing_title IS NOT NULL THEN 'New message about your listing: "' || listing_title || '"' ELSE 'New message' END,
          related_listing_id,
          NOW(),
          FALSE;
      -- Check if 'conversation_id' column exists
      ELSIF notification_columns LIKE '%conversation_id%' THEN
        -- Insert with conversation_id
        EXECUTE 'INSERT INTO notifications (user_id, type, message, conversation_id, created_at, read) VALUES ($1, $2, $3, $4, $5, $6)'
        USING 
          other_user_id, 
          'message', 
          CASE WHEN listing_title IS NOT NULL THEN 'New message about your listing: "' || listing_title || '"' ELSE 'New message' END,
          conv_id,
          NOW(),
          FALSE;
      -- Use a simpler insert with just the basic fields
      ELSE
        EXECUTE 'INSERT INTO notifications (user_id, type, message, created_at, read) VALUES ($1, $2, $3, $4, $5)'
        USING 
          other_user_id, 
          'message', 
          CASE WHEN listing_title IS NOT NULL THEN 'New message about your listing: "' || listing_title || '"' ELSE 'New message' END,
          NOW(),
          FALSE;
      END IF;
    END IF;
  END IF;
  
  -- Return success result
  result := jsonb_build_object(
    'success', TRUE,
    'message', jsonb_build_object(
      'id', new_message_id,
      'conversation_id', conv_id,
      'sender_id', sender_id,
      'content', message_content,
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
GRANT EXECUTE ON FUNCTION public.send_message_to_conversation(UUID, UUID, TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION public.send_message_to_conversation(UUID, UUID, TEXT, UUID) IS 
'Sends a message to a conversation, bypassing RLS policies'; 