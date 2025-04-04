-- Function to securely retrieve messages for a conversation
CREATE OR REPLACE FUNCTION public.get_conversation_messages(conv_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  messages_json JSONB;
  result JSONB;
BEGIN
  -- Basic validation
  IF conv_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Conversation ID is required'
    );
  END IF;
  
  -- Check if the conversation exists
  IF NOT EXISTS (SELECT 1 FROM conversations WHERE id = conv_id) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Conversation not found'
    );
  END IF;
  
  -- Get all messages for the conversation
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'conversation_id', m.conversation_id,
      'sender_id', m.sender_id,
      'content', m.content,
      'created_at', m.created_at
    ) ORDER BY m.created_at ASC
  )
  INTO messages_json
  FROM messages m
  WHERE m.conversation_id = conv_id;
  
  -- Build the result
  result := jsonb_build_object(
    'success', TRUE,
    'messages', COALESCE(messages_json, '[]'::jsonb)
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
GRANT EXECUTE ON FUNCTION public.get_conversation_messages(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_conversation_messages(UUID) IS 
'Retrieves messages for a conversation, bypassing RLS policies'; 