-- SQL functions to help with administrative tasks
-- Run this SQL in the Supabase SQL editor

-- Function to execute SQL (restricted to service role/admin)
CREATE OR REPLACE FUNCTION admin_execute_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if user is using service role or is an admin
  IF (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role' OR
     auth.uid() IN (SELECT id FROM users WHERE is_admin = true) THEN
    
    -- Execute the SQL
    EXECUTE sql;
    
    result = jsonb_build_object(
      'success', true,
      'message', 'SQL executed successfully'
    );
    
    RETURN result;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Permission denied: Must be an admin to execute SQL'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Function to check policies for a table
CREATE OR REPLACE FUNCTION admin_check_policies(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  policies jsonb;
BEGIN
  -- Check if user is using service role or is an admin
  IF (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role' OR
     auth.uid() IN (SELECT id FROM users WHERE is_admin = true) THEN
    
    -- Fetch policies for the specified table
    SELECT jsonb_agg(
      jsonb_build_object(
        'policyname', policyname,
        'tablename', tablename,
        'cmd', cmd,
        'roles', roles,
        'qual', qual
      )
    )
    INTO policies
    FROM pg_policies 
    WHERE tablename = table_name;
    
    -- Check if RLS is enabled
    RETURN jsonb_build_object(
      'success', true,
      'policies', COALESCE(policies, '[]'::jsonb),
      'rls_enabled', EXISTS (
        SELECT 1 FROM pg_class
        WHERE relname = table_name AND relrowsecurity = true
      )
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Permission denied: Must be an admin to check policies'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_check_policies(text) TO authenticated;

-- Output confirmation message
SELECT 'Admin SQL functions created successfully' as message; 