-- Fix reports access for administrators
-- This script should be run in the Supabase SQL Editor

-- First check if the reports table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
    RAISE EXCEPTION 'The reports table does not exist in the database.';
  END IF;
END $$;

-- Drop any existing policies for reports table
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;

-- Make sure Row Level Security is enabled on the reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Check if user_roles table exists and has admin roles
DO $$ 
DECLARE
  admin_check text;
BEGIN
  -- First approach: Check if user_roles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    admin_check := '
      auth.uid() IN (
        SELECT user_id FROM user_roles WHERE role = ''admin''
      )
    ';
  -- Second approach: Check if users table has role column
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    admin_check := '
      auth.uid() IN (
        SELECT id FROM users WHERE role = ''admin''
      )
    ';
  -- Third approach: Check if users table has admin_access column
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'admin_access'
  ) THEN
    admin_check := '
      auth.uid() IN (
        SELECT id FROM users WHERE admin_access = true
      )
    ';
  -- Fallback: Just use service_role access
  ELSE
    admin_check := '(current_setting(''request.jwt.claims'', true)::json->>''role'') = ''service_role''';
    
    -- Create a note about the missing admin column
    RAISE NOTICE 'Could not find admin column in users table. Only service_role will have admin access.';
  END IF;

  -- Create policy for admins to SELECT reports using the determined admin check
  EXECUTE format('
    CREATE POLICY "Admins can view all reports" ON reports 
      FOR SELECT
      USING (
        -- Admin can access via service role
        (current_setting(''request.jwt.claims'', true)::json->>''role'') = ''service_role''
        OR
        -- User with admin privileges can access
        %s
      );
  ', admin_check);
  
  -- Create policy for admins to UPDATE reports
  EXECUTE format('
    CREATE POLICY "Admins can update reports" ON reports
      FOR UPDATE
      USING (
        (current_setting(''request.jwt.claims'', true)::json->>''role'') = ''service_role''
        OR
        %s
      );
  ', admin_check);
  
  -- Create policy for admins to DELETE reports
  EXECUTE format('
    CREATE POLICY "Admins can delete reports" ON reports
      FOR DELETE
      USING (
        (current_setting(''request.jwt.claims'', true)::json->>''role'') = ''service_role''
        OR
        %s
      );
  ', admin_check);
END $$;

-- Create policy for users to only view their own reports (if not exists)
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Grant admin access by forcing RLS to be ignored for service_role
ALTER TABLE reports FORCE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Check all current policies for the reports table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd, 
  qual
FROM 
  pg_policies 
WHERE 
  tablename = 'reports';

-- Return success message
SELECT 'Reports access policies successfully applied.' as result; 