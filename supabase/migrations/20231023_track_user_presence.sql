-- Create a table to track user online status if it doesn't exist
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_online BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, conversation_id)
);

-- Add RLS policies to the user_presence table
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Users can view presence of other users in conversations they're part of
CREATE POLICY "Users can view presence status in their conversations" 
ON user_presence
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Users can update their own presence
CREATE POLICY "Users can update their own presence" 
ON user_presence
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own presence
CREATE POLICY "Users can insert their own presence" 
ON user_presence
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Function to update user presence
CREATE OR REPLACE FUNCTION public.update_user_presence(
  user_uuid UUID,
  conv_id UUID,
  is_online BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Basic validation
  IF user_uuid IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User ID is required'
    );
  END IF;

  -- Update or insert presence record
  INSERT INTO user_presence (user_id, conversation_id, last_seen, is_online)
  VALUES (user_uuid, conv_id, NOW(), is_online)
  ON CONFLICT (user_id, conversation_id) 
  DO UPDATE SET 
    last_seen = NOW(),
    is_online = is_online
  WHERE user_presence.user_id = user_uuid AND user_presence.conversation_id = conv_id;

  -- Return success result
  result := jsonb_build_object(
    'success', TRUE,
    'user_id', user_uuid,
    'conversation_id', conv_id,
    'timestamp', NOW(),
    'is_online', is_online
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
GRANT EXECUTE ON FUNCTION public.update_user_presence(UUID, UUID, BOOLEAN) TO authenticated;

-- Function to get users online in a conversation
CREATE OR REPLACE FUNCTION public.get_online_users_in_conversation(conv_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  online_users JSONB;
  result JSONB;
BEGIN
  -- Basic validation
  IF conv_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Conversation ID is required'
    );
  END IF;
  
  -- Get users who were seen in the last 5 minutes and are marked as online
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', up.user_id,
      'last_seen', up.last_seen
    )
  )
  INTO online_users
  FROM user_presence up
  WHERE 
    up.conversation_id = conv_id 
    AND up.is_online = TRUE
    AND up.last_seen > NOW() - INTERVAL '5 minutes';
  
  -- Build the result
  result := jsonb_build_object(
    'success', TRUE,
    'conversation_id', conv_id,
    'online_users', COALESCE(online_users, '[]'::jsonb),
    'timestamp', NOW()
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
GRANT EXECUTE ON FUNCTION public.get_online_users_in_conversation(UUID) TO authenticated;

-- Function to handle user going offline
CREATE OR REPLACE FUNCTION public.set_user_offline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a user goes offline, update all their presence records
  UPDATE user_presence
  SET is_online = FALSE
  WHERE user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- Create a trigger to mark users as offline when they sign out
CREATE TRIGGER on_user_signout
AFTER UPDATE OF updated_at ON auth.users
FOR EACH ROW
WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
EXECUTE FUNCTION public.set_user_offline();

COMMENT ON FUNCTION public.update_user_presence(UUID, UUID, BOOLEAN) IS 
'Updates a user''s presence status in a conversation';

COMMENT ON FUNCTION public.get_online_users_in_conversation(UUID) IS 
'Returns a list of users currently online in a conversation'; 