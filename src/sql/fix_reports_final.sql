-- Final fix for reports access issues
-- This script will disable Row Level Security entirely to ensure reports are visible
-- WARNING: This removes all security restrictions on the reports table!

-- Step 1: Check if the reports table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
    RAISE EXCEPTION 'The reports table does not exist in the database.';
  END IF;
END $$;

-- Step 2: Remove all existing policies to start fresh
DO $$
DECLARE 
  policy_name text;
BEGIN
  FOR policy_name IN (
    SELECT policyname FROM pg_policies WHERE tablename = 'reports'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON reports', policy_name);
  END LOOP;
END $$;

-- Step 3: Check RLS status before making changes
SELECT tablename, relrowsecurity 
FROM pg_tables 
JOIN pg_class ON pg_tables.tablename = pg_class.relname 
WHERE tablename = 'reports';

-- Step 4: Disable Row Level Security entirely
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Step 5: Verify the change
SELECT tablename, relrowsecurity 
FROM pg_tables 
JOIN pg_class ON pg_tables.tablename = pg_class.relname 
WHERE tablename = 'reports';

-- Step a6: Show confirmation message
SELECT 'Row Level Security has been DISABLED on the reports table. 
This means ALL users can access ALL reports.
This is a TEMPORARY measure for troubleshooting only.
Re-enable security when finished by running:
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;' as warning; 