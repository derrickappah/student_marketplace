-- Function to create a conversation and participants in one operation
-- This bypasses RLS completely to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.create_conversation_with_participants(
  current_user_id UUID,
  receiver_id UUID,
  listing_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Uses privileges of function creator
SET search_path = public
AS $$
DECLARE
  new_conversation_id UUID;
  result JSONB;
BEGIN
  -- Basic validation
  IF current_user_id IS NULL OR receiver_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Both user IDs are required'
    );
  END IF;
  
  -- Check if users are the same
  IF current_user_id = receiver_id THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Cannot create conversation with yourself'
    );
  END IF;
  
  -- First check if a conversation already exists between these users
  SELECT c.id INTO new_conversation_id
  FROM conversations c
  WHERE c.id IN (
    SELECT cp1.conversation_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = current_user_id AND cp2.user_id = receiver_id
  )
  -- If listing ID is provided, prefer conversations about that listing
  ORDER BY CASE WHEN c.listing_id = listing_id THEN 0 ELSE 1 END
  LIMIT 1;
  
  -- If conversation exists, return it
  IF new_conversation_id IS NOT NULL THEN
    -- If this is about a specific listing and conversation doesn't have it set
    IF listing_id IS NOT NULL THEN
      UPDATE conversations
      SET listing_id = listing_id
      WHERE id = new_conversation_id
      AND listing_id IS NULL;
    END IF;
    
    RETURN jsonb_build_object(
      'success', TRUE,
      'conversation_id', new_conversation_id,
      'created', FALSE,
      'message', 'Using existing conversation'
    );
  END IF;
  
  -- Create new conversation
  INSERT INTO conversations (listing_id, updated_at)
  VALUES (listing_id, NOW())
  RETURNING id INTO new_conversation_id;
  
  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (new_conversation_id, current_user_id),
    (new_conversation_id, receiver_id);
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'conversation_id', new_conversation_id,
    'created', TRUE,
    'message', 'Created new conversation and added participants'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permissions
REVOKE ALL ON FUNCTION public.create_conversation_with_participants(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_conversation_with_participants(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_conversation_with_participants(UUID, UUID, UUID) TO service_role;

COMMENT ON FUNCTION public.create_conversation_with_participants(UUID, UUID, UUID) IS 
'Creates a conversation and adds participants without triggering RLS policies'; 