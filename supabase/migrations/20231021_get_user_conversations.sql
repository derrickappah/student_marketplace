-- Function to safely retrieve all conversations for a user with all related details
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
  
  -- Get all conversations and related data in a single query
  WITH user_conversations AS (
    -- First, get all conversations the user is participating in
    SELECT c.id, c.listing_id, c.created_at, c.updated_at
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = user_uuid
    ORDER BY c.updated_at DESC
  ),
  conversation_participants AS (
    -- Get all participants for these conversations
    SELECT 
      cp.conversation_id,
      jsonb_agg(
        jsonb_build_object(
          'user_id', cp.user_id,
          'users', jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'university', u.university,
            'avatar_url', u.avatar_url
          )
        )
      ) AS participants
    FROM conversation_participants cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.conversation_id IN (SELECT id FROM user_conversations)
    GROUP BY cp.conversation_id
  ),
  conversation_listings AS (
    -- Get listing details for these conversations
    SELECT 
      c.id AS conversation_id,
      jsonb_build_object(
        'id', l.id,
        'title', l.title,
        'price', l.price,
        'images', l.images
      ) AS listing
    FROM user_conversations c
    LEFT JOIN listings l ON c.listing_id = l.id
  ),
  conversation_last_messages AS (
    -- Get the last message for each conversation
    SELECT 
      m.conversation_id,
      jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'content', m.content,
          'created_at', m.created_at,
          'sender_id', m.sender_id
        )
      ) AS last_message
    FROM (
      SELECT DISTINCT ON (conversation_id) *
      FROM messages
      WHERE conversation_id IN (SELECT id FROM user_conversations)
      ORDER BY conversation_id, created_at DESC
    ) m
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
      'last_message', COALESCE(clm.last_message, '[]'::jsonb)
    )
  )
  INTO conversations_json
  FROM user_conversations uc
  LEFT JOIN conversation_participants cp ON uc.id = cp.conversation_id
  LEFT JOIN conversation_listings cl ON uc.id = cl.conversation_id
  LEFT JOIN conversation_last_messages clm ON uc.id = clm.conversation_id;
  
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
'Safely retrieves all conversations for a user with all related details, bypassing RLS'; 