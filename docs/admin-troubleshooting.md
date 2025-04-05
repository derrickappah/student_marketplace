# Admin Troubleshooting Guide

## Reports Not Showing in Reports Management Page

If reports are not showing up in the admin Reports Management page, this is likely due to a missing Row Level Security (RLS) policy for admin access to the reports table.

### What's Happening

The Supabase database uses Row Level Security to control who can access which rows in each table. For the reports table, we need special policies that allow:
1. Regular users to see only their own reports
2. Admins to see and manage all reports

If the admin policy is missing, administrators won't be able to see any reports in the Reports Management interface.

### Automatic Fix in the UI

The Reports Management page now includes automatic detection of this issue and provides a "Fix Access" button when the problem is detected. Simply:

1. Log in as an administrator
2. Navigate to the Reports Management page
3. If you see the warning about admin access, click the "Fix Access" button
4. The system will automatically create the necessary RLS policies
5. Reports should now be visible

### Manual Fix via Script

If the automatic fix doesn't work, you can run a script to apply the policies:

```bash
# Make sure you have the service role key in your .env file
node scripts/fix_admin_reports_access.js
```

### Manual Database Fix

If you need to manually fix this in the database, execute the following SQL:

```sql
-- Drop any existing policy first
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
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
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
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;
CREATE POLICY "Admins can delete reports" ON reports
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );
```

## Understanding Report Table Fields

The reports table contains the following key fields:

- `id`: Unique identifier for each report
- `user_id`: The user who submitted the report
- `subject`: Brief description of the report
- `description`: Detailed explanation of the issue
- `reason`: The type/category of the report (e.g., bug, feature, content)
- `status`: Current status (pending, resolved, rejected)
- `admin_notes`: Notes added by administrators
- `created_at`: When the report was submitted
- `resolved_at`: When the report was resolved (if applicable)

Note that older parts of the code might reference a `category` field instead of `reason`. The system now supports both field names for backward compatibility. 