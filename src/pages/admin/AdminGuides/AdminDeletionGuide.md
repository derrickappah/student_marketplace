# Admin Listing Deletion Guide (For Beginners)

This guide will help you set up the backend for admin listing deletion. The solution is designed to be simple and avoids the "ambiguous seller_id" error.

## Step 1: Run the Database Migration

1. Go to Admin Dashboard → Run Migrations
2. Find the "Admin Listing Deletion Functions" migration
3. Click "Run" to install the database functions

## What This Does

This creates two special functions in the database:
- `admin_delete_listing` - Deletes a single listing safely
- `admin_bulk_delete_listings` - Deletes multiple listings at once

## Step 2: Using the Functions

Once the migration is complete, the admin deletion functionality should work automatically. If it doesn't, the system will fall back to a direct deletion method.

## Troubleshooting

If you encounter errors:

### "Function not found" errors

```
Error: Could not find the function public.admin_delete_listing(p_listing_id) in the schema cache
```

This means the migration hasn't been run yet. Go to Admin Dashboard → Run Migrations and run the "Admin Listing Deletion Functions" migration.

### "Ambiguous column reference" errors

```
Error: column reference "seller_id" is ambiguous
```

This happens when there's a conflict in the database. Our solution avoids this by:
1. Using fully qualified column names (`listings.id` instead of just `id`)
2. Using parameter names with prefixes (`p_listing_id` instead of `listing_id`)
3. Providing automatic fallbacks if the functions fail

### Permission errors

Make sure your admin user has the correct permissions. Check that:
1. The user has the 'admin' or 'super_admin' role in the database
2. The user is properly authenticated

## How It Works (Technical Details)

For technically-minded users:

1. The SQL function uses `SECURITY DEFINER` to run with elevated permissions
2. We avoid ambiguity by explicitly qualifying all column references
3. The JavaScript code tries the function first, then falls back to direct deletion if needed
4. For bulk operations, we use individual deletions as a fallback

## Getting Help

If you continue to experience issues, please check the error console for specific error messages and contact technical support. 