-- Function to find direct conversations between two users
-- This bypasses the RLS policies to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.find_direct_conversation(user1_id uuid, user2_id uuid)
RETURNS SETOF conversations
LANGUAGE plpgsql
SECURITY DEFINER -- Uses the privileges of the function creator
SET search_path = public
AS $$
BEGIN
  -- Find conversations where both users are participants
  RETURN QUERY
  SELECT c.*
  FROM conversations c
  WHERE c.id IN (
    -- Find conversation IDs where both users are participants
    SELECT cp1.conversation_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 
      ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = user1_id
      AND cp2.user_id = user2_id
  )
  -- Order by most recently updated
  ORDER BY c.updated_at DESC;
END;
$$;

-- Add row level security policy to control access to this function
REVOKE ALL ON FUNCTION public.find_direct_conversation(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_direct_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_direct_conversation(uuid, uuid) TO service_role;

COMMENT ON FUNCTION public.find_direct_conversation(uuid, uuid) IS 
'Finds direct conversations between two users without using nested RLS policies that could cause infinite recursion'; 