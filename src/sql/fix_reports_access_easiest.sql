-- Simplest fix for reports access - Temporary solution
-- This grants ALL users access to ALL reports to troubleshoot the issue
-- WARNING: This is for debugging only and should be reverted after troubleshooting

-- Drop any existing policies for reports table
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Service role can access all reports" ON reports;
DROP POLICY IF EXISTS "Temporary full access policy" ON reports;

-- Make sure Row Level Security is enabled
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to access all reports
CREATE POLICY "Temporary full access policy" ON reports 
  FOR ALL
  USING (true);  -- This grants access to all users (for testing only)

-- This message serves as a reminder to revert this change
SELECT 'WARNING: ALL users now have access to ALL reports. This is a temporary debugging measure only!' as reminder; 