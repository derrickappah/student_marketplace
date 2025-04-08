# Resolving the Ambiguous `seller_id` Column Reference Issue

## Problem Overview

Our application has been encountering an error when approving or rejecting promotion requests:

```
column reference "seller_id" is ambiguous
```

This occurs because multiple tables in our database have a column named `seller_id`, and when JOINs are performed in triggers or views, PostgreSQL cannot determine which table's `seller_id` column is being referenced.

## Root Cause Analysis

The ambiguity arises in several contexts:

1. The `listings` table has a `user_id` column that references the seller
2. The `offers` table has a `seller_id` column 
3. When JOINs are performed in views or triggers between these tables, the unqualified reference to `seller_id` becomes ambiguous
4. Various triggers that run on updates to the `listings` table involve complex JOINs that encounter this ambiguity

## Solution Approach

We've implemented a comprehensive solution with several components:

### 1. Use Explicit Table Aliases and Column References

We've created database views with explicit table aliases and column references:

- `listings_with_details` - A general-purpose view for listings
- `featured_listings_view` - A specialized view for featured listings
- `priority_listings_view` - A specialized view for priority listings

These views use explicit table references (`l.id`, `u.name`) to prevent ambiguity.

### 2. Fixed Trigger Functions

We've created a new trigger function `update_promotion_history_fixed()` that:

- Uses explicit column references to avoid ambiguity
- Properly qualifies all table references

### 3. Safe Admin Functions

We've created two new PostgreSQL functions specifically for admin operations:

- `admin_safe_approve_promotion(listing_id, exp_date)` - Safely approves promotions
- `admin_safe_reject_promotion(listing_id)` - Safely rejects promotions

These functions:
- Use a two-phase approach to update history first, then listings
- Contain explicit table references to avoid ambiguity
- Include proper error handling
- Use SECURITY DEFINER to ensure they run with appropriate permissions

### 4. Updated React Component

The React component has been updated to:

- Use the new database functions instead of direct updates
- Handle errors properly
- Maintain the same UX while using the safer approach

## Deployment Instructions

### Option 1: Run the Automated Script (Recommended)

1. Ensure you have environment variables set up:
   - `SUPABASE_URL` (or it will default to the current URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (required for admin operations)

2. Run the script:
   ```bash
   node apply_seller_id_fix.js
   ```

3. Check the console output to verify all SQL statements were executed successfully.

### Option 2: Manual Deployment via Supabase Dashboard

1. Access your Supabase project dashboard.

2. Go to the SQL Editor.

3. Copy the contents of `src/sql/fix_ambiguous_seller_id.sql`.

4. Paste into the SQL Editor and run.

5. Check for any errors in execution.

## Testing the Fix

After deploying the fix, you should test the promotion approval flow:

1. Log in as an admin user.
2. Navigate to the Admin Dashboard.
3. Go to the Promotion Approvals section.
4. Try to approve a pending promotion request.
5. Verify that no errors occur and the promotion is successfully approved.
6. Check that the promotion status updates correctly in both the listings table and the promotion history.

## Future-Proofing

To prevent similar issues in the future:

1. Always use explicit table aliases in database queries and views 
   - Use `listings l` instead of just `listings`
   - Reference columns as `l.id`, `u.name`, etc.

2. When creating triggers or functions, always qualify column references with their table name

3. Use explicit JOINS with clear conditions rather than implicit joins

4. Create dedicated views for complex queries to encapsulate and standardize the JOIN logic

## Troubleshooting

If issues persist after applying the fix:

1. Check the browser console for any JavaScript errors

2. Review the Supabase database logs for SQL errors

3. Try manually executing the database functions:
   ```sql
   SELECT admin_safe_approve_promotion('your-listing-id', NOW() + INTERVAL '30 days');
   ```

4. Verify that the triggers have been correctly replaced:
   ```sql
   SELECT tgname, tgrelid::regclass, tgfoid::regproc 
   FROM pg_trigger 
   WHERE tgname LIKE '%promotion%';
   ``` 