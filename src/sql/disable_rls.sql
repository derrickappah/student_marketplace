-- EMERGENCY FIX: Disable RLS completely on reports table
-- WARNING: This removes all security restrictions!
-- Only use this as a last resort when other fixes have failed

-- Step 1: Disable Row Level Security entirely
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Step 2: Check if the operation was successful
SELECT 
  tablename, 
  relrowsecurity 
FROM 
  pg_tables
JOIN 
  pg_class ON pg_tables.tablename = pg_class.relname
WHERE 
  tablename = 'reports';

-- Step 3: Warning message
SELECT 'WARNING: Row Level Security has been DISABLED on the reports table. 
This means ALL users can access ALL reports without restrictions.
This is a TEMPORARY EMERGENCY measure only and should be re-enabled 
as soon as proper security policies are established.' as warning; 