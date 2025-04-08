# Troubleshooting Guide for "No Reports Found" Issue

If you're experiencing the "No reports found" issue in the admin Reports Management page, this guide will help you fix it step-by-step.

## Overview of the Issue

The main problem is that the Row Level Security (RLS) policies for the `reports` table may not be properly configured to allow administrators to view reports. There are a few possible causes:

1. RLS policies for admin access are missing
2. RLS is enabled on the table, but no appropriate policies exist
3. The `exec_sql` function might be missing or have a different name
4. The SQL statements for fixing the issue might not be applied correctly

## Quick Fix Options

### Option 1: Using the Admin UI Debug Tools

1. Log in to the application as an administrator
2. Navigate to the Reports Management page
3. Look for the "Reports Access Debug Tools" section at the bottom of the page
4. Click the "Apply SQL Policies" button
5. Refresh the page after the success message appears

### Option 2: Using the Command Line Script

1. Ensure you have Node.js installed
2. Make sure your `.env` file has the following variables set:
   - `REACT_APP_SUPABASE_URL` (your Supabase project URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (your service role key with admin access)
3. Run the following command:
   ```bash
   node scripts/fix_admin_reports_access.js
   ```
4. If successful, you should see "Admin reports access policy successfully applied"

### Option 3: Using the Supabase Dashboard

1. Log in to the Supabase dashboard
2. Navigate to your project
3. Click on "SQL Editor"
4. Create a new query
5. Paste the following SQL and execute it:

```sql
-- Drop any existing policies
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;

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
```

## Advanced Troubleshooting

If the quick fix options don't work, follow these steps for more advanced diagnosis:

### Step 1: Check if Reports Actually Exist

Run the debug script to verify reports exist in the database:

```bash
node scripts/debug_reports.js
```

This will tell you:
- If the reports table exists
- If there are any reports in the database
- The fields of a sample report

### Step 2: Set Up Admin SQL Functions

For more powerful troubleshooting, set up the admin SQL functions:

1. Go to the Supabase dashboard
2. Navigate to your project
3. Click on "SQL Editor"
4. Create a new query
5. Paste the contents of `src/sql/create_admin_sql_functions.sql`
6. Execute the query

These functions allow the debug tools in the UI to directly check and fix policies.

### Step 3: Enable Realtime Table Changes

To verify RLS policies are working properly:

1. Go to the Supabase dashboard
2. Navigate to your project
3. Click on "Database" → "Replication"
4. Find the "reports" table in the list
5. Ensure "Realtime" is enabled for this table
6. If not, click the toggle to enable it

### Step 4: Check RLS Status

Verify RLS is properly enabled:

```sql
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'reports';
```

If `relrowsecurity` is `false`, enable it:

```sql
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
```

### Step 5: Verify Database Schema

Make sure the reports table has the expected structure:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports';
```

Key fields should include:
- `id` (UUID)
- `user_id` or `reporter_id` (UUID)
- `reason` or `category` (text)
- `status` (text)
- `description` (text)
- `subject` (text)
- `created_at` (timestamp)

## Recommended Production Fixes

Once the immediate issue is resolved, consider these long-term fixes:

1. **Add Migrations**: Ensure all RLS policies are part of your migration scripts
2. **Automated Testing**: Add tests that verify admin access to reports
3. **Health Checks**: Implement a system health check that verifies policies are in place
4. **Monitoring**: Set up alerts for when reports access fails

## Support

If you continue experiencing issues after following these steps, please check:

1. The Supabase logs for any SQL errors
2. The browser console for JavaScript errors
3. The network tab for failed API requests

For further assistance, contact the development team with the output from the `debug_reports.js` script.

Remember that changes to RLS policies affect all users in the system, so be careful when making changes to production databases. 