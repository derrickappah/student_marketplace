-- Fix reports access - Simplified Version
-- This script should be run in the Supabase SQL Editor

-- Drop any existing policies for reports table
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;

-- Make sure Row Level Security is enabled
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to access all reports
CREATE POLICY "Service role can access all reports" ON reports 
  FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Create policy for regular users to only view their own reports
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Force RLS to be enabled but allow service role to bypass it
ALTER TABLE reports FORCE ROW LEVEL SECURITY;

-- Check the created policies
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