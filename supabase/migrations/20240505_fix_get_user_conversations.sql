-- Fix the get_user_conversations function to use status instead of user_status
CREATE OR REPLACE FUNCTION public.get_user_conversations(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversations_json JSONB;
  result JSONB;
BEGIN
  -- Basic validation
  IF user_uuid IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User ID is required'
    );
  END IF;
  
  -- Check if the user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_uuid) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User not found'
    );
  END IF;
  
  -- Get all conversations for the user with all related data
  WITH user_conversations AS (
    SELECT c.* 
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = user_uuid
  ),
  conversation_participants AS (
    -- Get all participants for each conversation
    SELECT 
      cp.conversation_id,
      jsonb_agg(
        jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url,
          'email', u.email,
          'university', u.university,
          'status', u.status
        )
      ) AS participants
    FROM conversation_participants cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.conversation_id IN (SELECT id FROM user_conversations)
    GROUP BY cp.conversation_id
  ),
  conversation_listings AS (
    -- Get listing details for each conversation
    SELECT 
      c.id AS conversation_id,
      jsonb_build_object(
        'id', l.id,
        'title', l.title,
        'price', l.price,
        'images', l.images,
        'status', l.status,
        'description', l.description,
        'seller_id', l.seller_id
      ) AS listing
    FROM user_conversations c
    LEFT JOIN listings l ON c.listing_id = l.id
  ),
  conversation_last_messages AS (
    -- Get the last 5 messages for each conversation
    SELECT 
      m.conversation_id,
      jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'content', m.content,
          'created_at', m.created_at,
          'sender_id', m.sender_id,
          'has_attachments', m.has_attachments,
          'message_images', m.message_images
        ) ORDER BY m.created_at DESC
      ) AS messages
    FROM messages m
    WHERE m.conversation_id IN (SELECT id FROM user_conversations)
    GROUP BY m.conversation_id
  ),
  unread_message_counts AS (
    -- Count unread messages for the user in each conversation
    SELECT 
      m.conversation_id,
      COUNT(*) AS unread_count
    FROM messages m
    LEFT JOIN message_read_receipts mrr 
      ON m.id = mrr.message_id AND mrr.user_id = user_uuid
    WHERE m.conversation_id IN (SELECT id FROM user_conversations)
      AND m.sender_id != user_uuid
      AND (mrr.status IS NULL OR mrr.status != 'read')
    GROUP BY m.conversation_id
  )
  -- Combine all data into a single result set
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', uc.id,
      'listing_id', uc.listing_id,
      'created_at', uc.created_at,
      'updated_at', uc.updated_at,
      'participants', COALESCE(cp.participants, '[]'::jsonb),
      'listing', cl.listing,
      'messages', COALESCE(clm.messages, '[]'::jsonb),
      'unread_count', COALESCE(umc.unread_count, 0)
    ) ORDER BY uc.updated_at DESC
  )
  INTO conversations_json
  FROM user_conversations uc
  LEFT JOIN conversation_participants cp ON uc.id = cp.conversation_id
  LEFT JOIN conversation_listings cl ON uc.id = cl.conversation_id
  LEFT JOIN conversation_last_messages clm ON uc.id = clm.conversation_id
  LEFT JOIN unread_message_counts umc ON uc.id = umc.conversation_id;
  
  -- Build the complete result
  result := jsonb_build_object(
    'success', TRUE,
    'conversations', COALESCE(conversations_json, '[]'::jsonb)
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
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_conversations(UUID) IS 
'Safely retrieves all conversations for a user with enhanced details including unread counts'; 