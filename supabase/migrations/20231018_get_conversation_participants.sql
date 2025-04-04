-- Function to get conversation participants with user details
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_conversation_participants(conversation_id UUID)
RETURNS TABLE (
  user_id UUID,
  conversation_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_university TEXT,
  user_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Uses privileges of function creator
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.user_id,
    cp.conversation_id,
    u.name AS user_name,
    u.email AS user_email,
    u.university AS user_university,
    u.avatar_url AS user_avatar_url
  FROM 
    conversation_participants cp
  JOIN 
    users u ON cp.user_id = u.id
  WHERE 
    cp.conversation_id = get_conversation_participants.conversation_id;
END;
$$;

-- Grant execute permissions
REVOKE ALL ON FUNCTION public.get_conversation_participants(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversation_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_participants(UUID) TO service_role;

COMMENT ON FUNCTION public.get_conversation_participants(UUID) IS 
'Retrieves conversation participants with user details without triggering RLS infinite recursion'; 