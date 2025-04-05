-- Table for tracking user presence in conversations
CREATE TABLE IF NOT EXISTS conversation_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT TRUE,
  is_typing BOOLEAN NOT NULL DEFAULT FALSE,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(conversation_id, user_id)
);

-- Apply RLS
ALTER TABLE conversation_presence ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view presence for their conversations" ON conversation_presence 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversation_presence.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own presence" ON conversation_presence 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presence" ON conversation_presence 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversation_presence.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Function to update user's presence in a conversation
CREATE OR REPLACE FUNCTION public.update_conversation_presence(
  conv_id UUID,
  user_uuid UUID,
  is_online BOOLEAN DEFAULT TRUE,
  is_typing BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  is_participant BOOLEAN;
BEGIN
  -- Basic validation
  IF conv_id IS NULL OR user_uuid IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Conversation ID and user ID are required'
    );
  END IF;
  
  -- Check if user is a participant in the conversation
  SELECT EXISTS(
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conv_id AND user_id = user_uuid
  ) INTO is_participant;
  
  IF NOT is_participant THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User is not a participant in this conversation'
    );
  END IF;
  
  -- Insert or update the presence record
  INSERT INTO conversation_presence (
    conversation_id,
    user_id,
    is_online,
    is_typing,
    last_active
  )
  VALUES (
    conv_id,
    user_uuid,
    is_online,
    is_typing,
    NOW()
  )
  ON CONFLICT (conversation_id, user_id) 
  DO UPDATE SET 
    is_online = EXCLUDED.is_online,
    is_typing = EXCLUDED.is_typing,
    last_active = EXCLUDED.last_active;
  
  -- Build the result
  result := jsonb_build_object(
    'success', TRUE,
    'conversation_id', conv_id,
    'user_id', user_uuid,
    'is_online', is_online,
    'is_typing', is_typing,
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
GRANT EXECUTE ON FUNCTION public.update_conversation_presence(UUID, UUID, BOOLEAN, BOOLEAN) TO authenticated;

COMMENT ON FUNCTION public.update_conversation_presence(UUID, UUID, BOOLEAN, BOOLEAN) IS 
'Updates a user''s presence status in a conversation, including online and typing status'; 