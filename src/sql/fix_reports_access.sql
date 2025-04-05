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

-- Create policy for admins to SELECT reports
CREATE POLICY "Admins can view all reports" ON reports 
  FOR SELECT
  USING (
    -- Admin can access via service role
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    -- User with admin privileges can access
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Create policy for admins to UPDATE reports
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Create policy for admins to DELETE reports
CREATE POLICY "Admins can delete reports" ON reports
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Create policy for users to only view their own reports (if not exists)
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

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