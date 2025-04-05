-- Function to mark messages as read in a conversation
CREATE OR REPLACE FUNCTION public.mark_conversation_messages_read(
  conv_id UUID,
  user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  is_participant BOOLEAN;
  affected_count INTEGER;
BEGIN
  -- Basic validation
  IF conv_id IS NULL OR user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Conversation ID and user ID are required'
    );
  END IF;
  
  -- Check if the conversation exists
  IF NOT EXISTS (SELECT 1 FROM conversations WHERE id = conv_id) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Conversation not found'
    );
  END IF;
  
  -- Check if user is a participant in the conversation
  SELECT EXISTS(
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conv_id AND user_id = user_id
  ) INTO is_participant;
  
  IF NOT is_participant THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User is not a participant in this conversation'
    );
  END IF;
  
  -- Insert or update read receipts for all unread messages sent by other users
  WITH messages_to_mark AS (
    SELECT id
    FROM messages
    WHERE conversation_id = conv_id
      AND sender_id != user_id
      AND created_at <= NOW()
  ),
  inserted_receipts AS (
    INSERT INTO message_read_receipts (message_id, user_id, status, updated_at)
    SELECT m.id, user_id, 'read', NOW()
    FROM messages_to_mark m
    ON CONFLICT (message_id, user_id) 
    DO UPDATE SET 
      status = 'read',
      updated_at = NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO affected_count FROM inserted_receipts;
  
  -- Build the result
  result := jsonb_build_object(
    'success', TRUE,
    'affected_count', affected_count
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
GRANT EXECUTE ON FUNCTION public.mark_conversation_messages_read(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.mark_conversation_messages_read(UUID, UUID) IS 
'Marks all messages in a conversation as read for a specific user, bypassing RLS policies'; 