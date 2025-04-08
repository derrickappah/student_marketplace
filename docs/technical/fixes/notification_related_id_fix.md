# Notification and Admin Log Schema Fixes

## Issue Summary

Our application was encountering two main errors when handling promotion approvals and rejections:

1. **Missing `related_id` column in notifications table**
   ```
   Error creating system notification: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'related_id' column of 'notifications' in the schema cache"}
   ```

2. **Action type constraint violation in admin_logs table**
   ```
   Error logging admin action: {code: '23514', details: null, hint: null, message: 'new row for relation "admin_logs" violates check constraint "admin_logs_action_type_check"'}
   ```

## Root Causes

1. The `related_id` column was referenced in code but did not exist in the notifications table schema.

2. The `admin_logs` table had a constraint that only allowed specific action types, but our promotion-related actions weren't included in the allowed values.

## Solution Implemented

We've created a comprehensive set of fixes:

### 1. Schema Updates

1. **Notifications Table Fix:**
   - Added a `related_id` UUID column to the notifications table
   - Updated the type check constraint to include 'promotion' and 'system' types
   - Added an index for the new column to improve query performance

2. **Admin Logs Table Fix:**
   - Updated the `admin_logs_action_type_check` constraint to include promotion-related actions:
     - 'approved_promotion'
     - 'rejected_promotion'
     - 'promotion_update'

### 2. Application Code Updates

1. **Notification Service:**
   - Created a dedicated notification service module with proper TypeScript documentation
   - Implemented a robust `createSystemNotification` function that correctly handles optional fields including `related_id`
   - Added additional notification management functions (get, mark as read, etc.)

2. **Component Updates:**
   - Updated the `ListingPromotionApprovals.js` component to:
     - Import the notification service instead of using the function from supabase.js
     - Correctly use the `related_id` field when creating notifications

### 3. Deployment Script

Created an application script that:
- Reads and executes the SQL statements to update both schemas
- Provides detailed logging of the execution process
- Verifies that changes were applied successfully
- Handles errors gracefully

## How to Deploy the Fix

### Option 1: Run the Automated Script (Recommended)

1. Ensure you have environment variables set up:
   - `SUPABASE_URL` (or it will default to the current URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (required for schema operations)

2. Run the script:
   ```bash
   node apply_schema_fixes.js
   ```

3. Check the console output to verify all changes were applied successfully.

### Option 2: Manual SQL Execution via Supabase Dashboard

1. Access your Supabase project dashboard.

2. Go to the SQL Editor.

3. Copy and execute the contents of these files separately:
   - `src/sql/fix_notifications_schema.sql`
   - `src/sql/fix_admin_logs_schema.sql`

4. Check for any errors in execution.

## Testing the Fix

After deploying the fix, you should test:

1. Approving a promotion request
   - Verify no errors occur in the console
   - Check that the notification is created correctly
   - Verify the admin log is created

2. Rejecting a promotion request
   - Verify no errors occur in the console
   - Check that the notification is created correctly
   - Verify the admin log is created

## Preventative Measures

To prevent similar issues in the future:

1. **Schema Validation:**
   - Add schema validation on startup that checks for required columns
   - Implement a database migration system with version control

2. **Type Safety:**
   - Add TypeScript interfaces for all database operations
   - Create validation middleware for data operations

3. **Centralized Services:**
   - We've now created a dedicated notification service that properly handles all notification operations
   - This approach should be extended to other areas of the application

## Troubleshooting

If you continue to experience issues:

1. Check the browser console for any JavaScript errors
2. Review the Supabase database logs for SQL errors
3. Verify that the schema changes were applied correctly:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'notifications' AND column_name = 'related_id';
   
   SELECT constraint_name FROM information_schema.table_constraints 
   WHERE table_name = 'admin_logs' AND constraint_name = 'admin_logs_action_type_check';
   ``` 