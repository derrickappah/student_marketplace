-- Fix the admin_logs table constraint issue
-- This allows the exec_sql function to work without admin_id

-- First, let's check the current schema of admin_logs
DO $$
BEGIN
  RAISE NOTICE 'Checking admin_logs table structure...';
END $$;

-- Option 1: Make admin_id nullable (simplest solution)
ALTER TABLE admin_logs
ALTER COLUMN admin_id DROP NOT NULL;

-- Option 2: Add a default user for system operations
-- This approach creates a system user if it doesn't exist
DO $$
DECLARE
  system_user_id UUID;
BEGIN
  -- Check if system user already exists
  SELECT id INTO system_user_id
  FROM users
  WHERE email = 'system@example.com'
  LIMIT 1;
  
  -- Create system user if it doesn't exist
  IF system_user_id IS NULL THEN
    INSERT INTO users (
      id,
      email,
      name,
      role,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'system@example.com',
      'System',
      'system',
      NOW(),
      NOW()
    )
    RETURNING id INTO system_user_id;
    
    RAISE NOTICE 'Created system user with ID: %', system_user_id;
  ELSE
    RAISE NOTICE 'System user already exists with ID: %', system_user_id;
  END IF;
  
  -- Create a function to set the current admin ID for RPC calls
  CREATE OR REPLACE FUNCTION set_rpc_admin_id()
  RETURNS VOID AS $$
  BEGIN
    -- Set a session variable that can be used by triggers
    PERFORM set_config('app.current_admin_id', '00000000-0000-0000-0000-000000000000', false);
  END;
  $$ LANGUAGE plpgsql;
  
  -- Call the function to set the admin ID for the current session
  PERFORM set_rpc_admin_id();
END $$;

-- Create or replace the exec_sql function to handle admin_id
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS SETOF json AS $$
DECLARE 
  result json;
  admin_id uuid;
BEGIN
  -- Try to get admin ID from session, fall back to system user
  admin_id := NULLIF(current_setting('app.current_admin_id', true), '')::uuid;
  
  IF admin_id IS NULL THEN
    admin_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;
  
  -- Log the SQL action first with our admin ID
  INSERT INTO admin_logs (
    admin_id, 
    action, 
    details, 
    performed_at
  ) VALUES (
    admin_id,
    'execute_sql',
    json_build_object('query', sql_query),
    now()
  );
  
  -- Execute the query
  FOR result IN EXECUTE sql_query LOOP
    RETURN NEXT result;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 