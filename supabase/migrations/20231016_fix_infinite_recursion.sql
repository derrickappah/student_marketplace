-- Function to fix the RLS policies for conversation_participants table
-- to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.fix_conversation_participants_rls()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Uses the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  dropped_count integer := 0;
  added_count integer := 0;
  result jsonb;
BEGIN
  -- Check if the problematic policy exists and drop it
  SELECT COUNT(*) INTO dropped_count
  FROM pg_policies
  WHERE tablename = 'conversation_participants'
    AND policyname = 'Users can view conversation participants for their conversations';
    
  IF dropped_count > 0 THEN
    DROP POLICY IF EXISTS "Users can view conversation participants for their conversations" 
      ON conversation_participants;
  END IF;
  
  -- Create simpler policies that won't cause recursion
  
  -- Policy 1: Users can view their conversation participants
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversation_participants'
      AND policyname = 'Users can view their conversation participants'
  ) THEN
    CREATE POLICY "Users can view their conversation participants" 
      ON conversation_participants
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
      
    added_count := added_count + 1;
  END IF;
  
  -- Policy 2: Users can view other participants in their conversations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversation_participants'
      AND policyname = 'Users can view other participants in their conversations'
  ) THEN
    CREATE POLICY "Users can view other participants in their conversations" 
      ON conversation_participants
      FOR SELECT
      TO authenticated
      USING (
        conversation_id IN (
          SELECT conversation_id 
          FROM conversation_participants 
          WHERE user_id = auth.uid()
        )
      );
      
    added_count := added_count + 1;
  END IF;
  
  -- Return result as JSON
  result := jsonb_build_object(
    'success', true,
    'message', format('Fixed RLS policies for conversation_participants: %s removed, %s added', 
                      dropped_count, added_count)
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION public.fix_conversation_participants_rls() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fix_conversation_participants_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_conversation_participants_rls() TO service_role;

COMMENT ON FUNCTION public.fix_conversation_participants_rls() IS 
'Fixes the RLS policies for conversation_participants table to prevent infinite recursion'; 