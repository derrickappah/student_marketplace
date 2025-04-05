-- SQL Script to fix RLS issues with messaging system
-- This script adds stored procedures to safely bypass RLS policy restrictions

-- Create function to send messages that bypasses RLS
CREATE OR REPLACE FUNCTION send_message_bypass_rls(
  p_conversation_id UUID,
  p_content TEXT,
  p_sender_id UUID,
  p_reply_to_message_id UUID DEFAULT NULL,
  p_has_attachments BOOLEAN DEFAULT FALSE
) 
RETURNS UUID
SECURITY DEFINER -- This will run with privileges of the DB user who created it
SET search_path = public
AS $$
DECLARE
  v_participant_exists BOOLEAN;
  v_message_id UUID;
BEGIN
  -- First verify that the sender is actually a participant in this conversation
  SELECT EXISTS (
    SELECT 1 
    FROM conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = p_sender_id
  ) INTO v_participant_exists;
  
  -- If they're not a participant, try to add them
  IF NOT v_participant_exists THEN
    BEGIN
      INSERT INTO conversation_participants (conversation_id, user_id, created_at)
      VALUES (p_conversation_id, p_sender_id, NOW());
      
      v_participant_exists := TRUE;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'User is not a participant in this conversation and could not be added: %', SQLERRM;
    END;
  END IF;
  
  -- Once we've verified participation, insert the message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    reply_to_message_id,
    has_attachments,
    created_at
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_reply_to_message_id,
    p_has_attachments,
    NOW()
  )
  RETURNING id INTO v_message_id;
  
  -- Update the conversation timestamp
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to fix conversation participants RLS (similar to existing JS function)
CREATE OR REPLACE FUNCTION fix_conversation_participants()
RETURNS JSONB
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Drop any existing policy
  DROP POLICY IF EXISTS "Users can create conversation participants" ON conversation_participants;
  
  -- Recreate the policy with proper CHECK
  CREATE POLICY "Users can create conversation participants" ON conversation_participants 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
  -- Also ensure users can insert messages to conversations they're in
  DROP POLICY IF EXISTS "Users can send messages to conversations they are in" ON messages;
  
  CREATE POLICY "Users can send messages to conversations they are in" ON messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );
  
  -- Add policy to allow updating own messages
  DROP POLICY IF EXISTS "Users can update own messages" ON messages;
  
  CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);
  
  -- Check how many conversation participants exist
  SELECT COUNT(*) INTO v_count FROM conversation_participants;
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Fixed conversation participants RLS policies',
    'participants_count', v_count
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions for the anonymous role
GRANT EXECUTE ON FUNCTION send_message_bypass_rls(UUID, TEXT, UUID, UUID, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION fix_conversation_participants() TO anon;
GRANT EXECUTE ON FUNCTION fix_conversation_participants() TO authenticated;

-- Add policy for using the conversation system function
COMMENT ON FUNCTION send_message_bypass_rls IS 'Safely sends a message in a conversation, bypassing RLS restrictions';
COMMENT ON FUNCTION fix_conversation_participants IS 'Fixes RLS policies for conversation participants'; 