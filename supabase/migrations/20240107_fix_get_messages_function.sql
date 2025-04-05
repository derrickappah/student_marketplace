-- Updated function to retrieve messages with all fields and attachments
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
  
  -- Get all messages with attachments for the conversation
  WITH message_with_attachments AS (
    SELECT 
      m.id,
      jsonb_agg(
        jsonb_build_object(
          'id', ma.id,
          'file_url', ma.file_url,
          'file_type', ma.file_type,
          'file_name', ma.file_name,
          'file_size', ma.file_size
        )
      ) AS attachments
    FROM messages m
    LEFT JOIN message_attachments ma ON m.id = ma.message_id
    WHERE m.conversation_id = conv_id AND m.has_attachments = TRUE
    GROUP BY m.id
  ),
  message_with_read_receipts AS (
    SELECT 
      m.id,
      jsonb_object_agg(
        mrr.user_id,
        mrr.status
      ) AS read_receipts
    FROM messages m
    JOIN message_read_receipts mrr ON m.id = mrr.message_id
    WHERE m.conversation_id = conv_id
    GROUP BY m.id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'conversation_id', m.conversation_id,
      'sender_id', m.sender_id,
      'content', m.content,
      'message_images', m.message_images,
      'has_attachments', m.has_attachments,
      'reply_to_message_id', m.reply_to_message_id,
      'read_status', m.read_status,
      'created_at', m.created_at,
      'attachments', COALESCE(mwa.attachments, '[]'::jsonb),
      'read_receipts', COALESCE(mwrr.read_receipts, '{}'::jsonb)
    ) ORDER BY m.created_at ASC
  )
  INTO messages_json
  FROM messages m
  LEFT JOIN message_with_attachments mwa ON m.id = mwa.id
  LEFT JOIN message_with_read_receipts mwrr ON m.id = mwrr.id
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
'Retrieves messages for a conversation with attachments and read receipts, bypassing RLS policies'; 