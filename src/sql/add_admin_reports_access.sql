-- Add Admin access policy for reports table

-- First check if admin service account exists and is properly set up
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'service_role'
  ) THEN
    RAISE EXCEPTION 'service_role does not exist';
  END IF;
END $$;

-- Drop the existing commented policy if it was uncommented manually
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;

-- Create the admin access policy for reports
CREATE POLICY "Admins can view all reports" ON reports 
  FOR SELECT
  USING (
    -- Check if the request is coming from the service_role (admin API)
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    -- Or if the user has admin privileges
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Add update policy for admins
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Add delete policy for admins
CREATE POLICY "Admins can delete reports" ON reports
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Also ensure that updates work properly
DROP TRIGGER IF EXISTS update_reports_timestamp ON reports;
CREATE TRIGGER update_reports_timestamp
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Add resolved_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE reports ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$; 