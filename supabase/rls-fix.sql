-- SQL function to fix conversation participants RLS policies
-- This fixes the "infinite recursion detected in policy" error
CREATE OR REPLACE FUNCTION public.fix_conversation_participants_rls(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the owner
AS $$
DECLARE
  result JSONB;
  policy_count INT;
BEGIN
  -- Check if the problematic policies exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'conversation_participants'
    AND schemaname = 'public'
    AND (policyname = 'Users can view conversation participants for their conversations');
  
  -- Drop the problematic policy if it exists
  IF policy_count > 0 THEN
    DROP POLICY IF EXISTS "Users can view conversation participants for their conversations" ON public.conversation_participants;
  END IF;
  
  -- Create new, simplified policies that avoid recursion
  
  -- Policy to view conversation participants
  CREATE POLICY "Users can view their conversation participants" ON public.conversation_participants
    FOR SELECT
    USING (auth.uid() = user_id);
  
  -- Policy to view participants of your conversations
  CREATE POLICY "Users can view other participants in their conversations" ON public.conversation_participants
    FOR SELECT
    USING (
      conversation_id IN (
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = auth.uid()
      )
    );
  
  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Successfully updated RLS policies for conversation_participants',
    'policies_removed', policy_count,
    'policies_added', 2
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  
  RETURN result;
END;
$$; 