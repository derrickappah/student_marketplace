# Promotion History and Statistics Fixes

## Issues Fixed

This update addresses two critical issues that were preventing the promotion management system from functioning correctly:

1. **Missing Promotion History**
   ```
   No promotion history found
   ```

2. **Empty Promotion Statistics**
   ```
   No data available
   ```

## Root Causes

1. **Promotion History Issue**:
   - The Row Level Security (RLS) policies on the `promotion_request_history` table were too restrictive
   - Admin users couldn't view promotion history records created by other users
   - The existing trigger function for updating history had permission issues

2. **Promotion Statistics Issue**:
   - The `get_promotion_stats()` function was timing out or encountering RLS restrictions
   - Multiple separate COUNT queries were inefficient and causing timeouts
   - The function lacked proper permission to bypass RLS

## Solutions Implemented

### 1. Promotion History Fixes

1. **Updated RLS Policies**:
   - Created proper admin policies to allow admins to view and manage all promotion history records
   - Maintained user policies for viewing their own records

2. **SECURITY DEFINER Functions**:
   - Created a `get_promotion_history()` function with SECURITY DEFINER to bypass RLS
   - Added `insert_promotion_request()` and `process_promotion_request()` functions to safely handle history records
   - Improved the trigger function to use these secure functions

3. **Component Updates**:
   - Updated the React component to use the new RPC function
   - Added fallback logic for backward compatibility
   - Enhanced error handling and data processing

### 2. Promotion Statistics Fixes

1. **Optimized Function**:
   - Rewritten the `get_promotion_stats()` function to use a single table scan
   - Added SECURITY DEFINER to bypass RLS
   - Used a more efficient approach with CASE statements instead of multiple queries

2. **Permission Updates**:
   - Updated permissions to ensure the function can be executed by authenticated users
   - Added proper grants to allow the function to access data

## Deployment Steps

To deploy these fixes, follow these steps:

### Option 1: Run the Automated Script (Recommended)

1. Ensure you have environment variables set up:
   - `SUPABASE_URL` (or it will default to the current URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (required for admin operations)

2. Run the script:
   ```bash
   node apply_promotion_history_fix.js
   ```

3. Check the console output to verify all changes were applied successfully.

### Option 2: Manual SQL Execution via Supabase Dashboard

1. Access your Supabase project dashboard.

2. Go to the SQL Editor.

3. Copy and execute the contents of:
   - `src/sql/fix_promotion_history.sql`

4. Check for any errors in execution.

## Testing the Changes

After applying the fixes, you should:

1. **Test Promotion History**:
   - Log in as an admin
   - Navigate to the Promotion Approvals page
   - Switch to the History tab
   - Verify that promotion history records are now visible

2. **Test Promotion Statistics**:
   - Check the statistics overview at the top of the page
   - Open the detailed statistics dialog
   - Verify that all charts and metrics display data correctly

## Technical Implementation Details

### Promotion History Functions

```sql
-- Create a SECURITY DEFINER function to get promotion history
CREATE OR REPLACE FUNCTION get_promotion_history()
RETURNS SETOF promotion_request_history
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM promotion_request_history
  ORDER BY processed_at DESC NULLS LAST, requested_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to insert a promotion request correctly
CREATE OR REPLACE FUNCTION insert_promotion_request(
  p_listing_id UUID,
  p_user_id UUID,
  p_promotion_type TEXT,
  p_status TEXT DEFAULT 'pending',
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
AS $$ ... $$
```

### Optimized Statistics Function

```sql
CREATE OR REPLACE FUNCTION get_promotion_stats()
RETURNS TABLE (
  total_pending INT,
  total_approved INT,
  total_rejected INT,
  featured_pending INT,
  featured_approved INT,
  priority_pending INT,
  priority_approved INT,
  both_pending INT,
  both_approved INT
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Use a single scan of the listings table
  RETURN QUERY
  WITH counts AS (
    SELECT
      CASE WHEN promotion_status = 'pending' THEN 1 ELSE 0 END AS is_pending,
      -- other CASE statements...
    FROM listings
  )
  SELECT
    SUM(is_pending)::INT,
    -- other aggregations...
  FROM counts;
END;
$$ LANGUAGE plpgsql;
```

## Troubleshooting

If you continue to experience issues:

1. **For History Issues**:
   - Check the browser console for any JavaScript errors
   - Verify that the `get_promotion_history` function exists in the database
   - Ensure the RLS policies for `promotion_request_history` are set correctly

2. **For Statistics Issues**:
   - If statistics are missing, check if the optimized function has been deployed
   - Verify there is data in the listings table with promotion statuses
   - Check permissions for the function execution

## Future Improvements

To further enhance the promotion management system:

1. **Cache Statistics**: Implement caching for promotion statistics to avoid recalculating on every page load

2. **Batch Processing**: Add batch processing capabilities for handling multiple promotion requests at once

3. **History Search**: Implement search and advanced filtering for the promotion history table

4. **Notifications**: Enhance the notification system for promotion status changes to include more details 