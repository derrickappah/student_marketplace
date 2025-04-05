-- Fix for reports submission issue
-- This script adds the necessary RLS policies to allow users to submit reports

-- Step 1: Check if the reports table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
    RAISE EXCEPTION 'The reports table does not exist in the database.';
  END IF;
END $$;

-- Step 2: Check the current RLS status
SELECT tablename, relrowsecurity 
FROM pg_tables 
JOIN pg_class ON pg_tables.tablename = pg_class.relname 
WHERE tablename = 'reports';

-- Step 3: Make sure RLS is enabled 
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Step 4: Remove any conflicting policies for inserts
DROP POLICY IF EXISTS "Users can insert reports" ON reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;

-- Step 5: Create policy to allow users to insert reports
CREATE POLICY "Users can insert reports" ON reports
  FOR INSERT
  WITH CHECK (
    -- Allow any authenticated user to insert a report where they are the reporter
    auth.uid() = reporter_id
  );

-- Step 6: Add policy for users to view their own reports
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT
  USING (
    auth.uid() = reporter_id
  );

-- Step 7: Add admin access policy for all operations
DROP POLICY IF EXISTS "Service role has full access" ON reports;
CREATE POLICY "Service role has full access" ON reports
  FOR ALL
  USING (
    -- Service role has full access (for admins)
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Step 8: Show the configured policies
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

-- Step 9: Return confirmation message
SELECT 'Reports table RLS policies have been configured to allow:
1. Users to INSERT reports where they are the reporter
2. Users to SELECT their own reports
3. Service role (admin) to perform all operations' as result; 