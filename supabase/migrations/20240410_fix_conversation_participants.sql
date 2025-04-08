-- Function to retrieve conversation participants with proper fallbacks
CREATE OR REPLACE FUNCTION public.get_conversation_participants(conv_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participants_json JSONB := '[]';
  result JSONB;
BEGIN
  -- Check if conversation exists
  IF NOT EXISTS(SELECT 1 FROM conversations WHERE id = conv_id) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Conversation not found'
    );
  END IF;
  
  -- Get participants with user details and proper fallbacks
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', cp.id,
      'user_id', cp.user_id,
      'conversation_id', cp.conversation_id,
      'joined_at', cp.created_at,
      'user', jsonb_build_object(
        'id', u.id,
        'name', COALESCE(u.name, 'User ' || substring(u.id::text, 1, 8)),
        'email', COALESCE(u.email, ''),
        'university', COALESCE(u.university, ''),
        'avatar_url', COALESCE(u.avatar_url, ''),
        'status', COALESCE((SELECT status FROM user_status WHERE user_id = u.id), 'offline')
      )
    )
  )
  INTO participants_json
  FROM conversation_participants cp
  LEFT JOIN users u ON cp.user_id = u.id
  WHERE cp.conversation_id = conv_id;
  
  -- Build the complete result
  result := jsonb_build_object(
    'success', TRUE,
    'participants', COALESCE(participants_json, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_conversation_participants(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_conversation_participants(UUID) IS 
'Returns detailed information about all participants in a conversation, with fallbacks for missing data';

-- Procedure to ensure all existing conversations have valid user data
CREATE OR REPLACE PROCEDURE public.fix_missing_user_data()
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update missing user names with a fallback
  UPDATE users 
  SET name = 'User ' || substring(id::text, 1, 8)
  WHERE name IS NULL OR name = '';
  
  -- Ensure user_status table exists and create if needed
  CREATE TABLE IF NOT EXISTS user_status (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'offline',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Insert default status for users who don't have one
  INSERT INTO user_status (user_id, status)
  SELECT id, 'offline' FROM users u
  WHERE NOT EXISTS (SELECT 1 FROM user_status us WHERE us.user_id = u.id)
  ON CONFLICT DO NOTHING;
END;
$$; 