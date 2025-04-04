-- Function to retrieve complete conversation details with participants and listing
CREATE OR REPLACE FUNCTION public.get_conversation_details(conv_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversation_record RECORD;
  participants_json JSONB := '[]';
  listing_json JSONB := NULL;
  result JSONB;
BEGIN
  -- Check if conversation exists
  SELECT * INTO conversation_record
  FROM conversations
  WHERE id = conv_id;
  
  IF conversation_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Conversation not found'
    );
  END IF;
  
  -- Get participants with user details
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', cp.user_id,
      'conversation_id', cp.conversation_id,
      'user', jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email,
        'university', u.university,
        'avatar_url', u.avatar_url
      )
    )
  )
  INTO participants_json
  FROM conversation_participants cp
  JOIN users u ON cp.user_id = u.id
  WHERE cp.conversation_id = conv_id;
  
  -- Get listing details if applicable
  IF conversation_record.listing_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'price', l.price,
      'images', l.images
    )
    INTO listing_json
    FROM listings l
    WHERE l.id = conversation_record.listing_id;
  END IF;
  
  -- Build the complete result
  result := jsonb_build_object(
    'success', TRUE,
    'conversation', jsonb_build_object(
      'id', conversation_record.id,
      'listing_id', conversation_record.listing_id,
      'created_at', conversation_record.created_at,
      'updated_at', conversation_record.updated_at,
      'participants', COALESCE(participants_json, '[]'::jsonb),
      'listing', listing_json
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
GRANT EXECUTE ON FUNCTION public.get_conversation_details(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_conversation_details(UUID) IS 
'Retrieves complete conversation details with participants and listing, bypassing RLS'; 