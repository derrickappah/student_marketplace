# Listing Deletion Constraint Issue Fix

## Problem Description

When attempting to delete a listing, users encounter the following error:

```
Error in final listing deletion: {
  code: '23503',
  details: 'Key is still referenced from table "listing_promotions".',
  hint: null,
  message: 'update or delete on table "listings" violates foreign key constraint "listing_promotions_listing_id_fkey" on table "listing_promotions"'
}
```

This occurs because:

1. The `listing_promotions` table has a foreign key constraint on `listing_id` that references the `listings` table
2. The constraint is defined WITHOUT `ON DELETE CASCADE`, preventing listings from being deleted if they have related promotion records
3. The app attempts to delete the listing directly without first removing these dependent records

## Solution Implemented

We've created a comprehensive fix with several components:

### 1. Database-Level Fixes

1. **Constraint Modification**: Updated the foreign key constraint to include `ON DELETE CASCADE`, which automatically removes dependent records when a listing is deleted

2. **Safe Delete Function**: Created a `safe_delete_listing(UUID)` function with `SECURITY DEFINER` privileges that:
   - Handles all dependencies in the correct order
   - Deletes promotion records first
   - Provides proper error handling and transactions

3. **Cleanup Trigger**: Added a trigger that runs before deleting a listing to clean up any dependencies that might be missed

### 2. Application-Level Fixes

1. **Listing Service**: Created a dedicated `listingService.js` module with a robust `safeDeleteListing` function that:
   - Tries to use the database function first for the most efficient deletion
   - Falls back to a step-by-step deletion process if the function isn't available
   - Provides clear error handling and user feedback

2. **UI Component Updates**: Modified the `EditListingPage.js` file to:
   - Use the new service function instead of direct database calls
   - Display more user-friendly error messages
   - Handle the deletion process in a more structured way

## Deployment Steps

### Option 1: Run the Automated Script (Recommended)

1. Ensure you have environment variables set up:
   - `SUPABASE_URL` (or it will default to the current URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (required for admin operations)

2. Run the script:
   ```bash
   node apply_listing_delete_fix.js
   ```

3. Check the console output to verify all changes were applied successfully.

### Option 2: Manual SQL Execution via Supabase Dashboard

1. Access your Supabase project dashboard.

2. Go to the SQL Editor.

3. Copy and execute the contents of:
   - `src/sql/fix_listing_delete_constraint.sql`

4. Check for any errors in execution.

## Testing the Fix

After deploying the fix, you should:

1. Log in as a user with listings
2. Try to delete a listing that has promotion records
3. Verify the listing is deleted successfully without errors
4. Check that related promotion records are also removed

## Technical Details

### Database Function

```sql
CREATE OR REPLACE FUNCTION safe_delete_listing(listing_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  -- Delete promotion records first
  DELETE FROM listing_promotions WHERE listing_id = listing_id_param;
  DELETE FROM promotion_request_history WHERE listing_id = listing_id_param;
  
  -- Delete related records
  DELETE FROM offers WHERE listing_id = listing_id_param;
  DELETE FROM saved_listings WHERE listing_id = listing_id_param;
  DELETE FROM viewed_listings WHERE listing_id = listing_id_param;
  
  -- Finally delete the listing
  DELETE FROM listings WHERE id = listing_id_param;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;
```

### JavaScript Service Function

```javascript
export const safeDeleteListing = async (listingId, userId) => {
  try {
    // First check ownership
    const { data: listing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single();
      
    if (listing.user_id !== userId) {
      return { success: false, error: { message: 'Permission denied' } };
    }
    
    // Try to use database function first
    const { data: rpcResult, error: rpcError } = await supabase.rpc('safe_delete_listing', {
      listing_id_param: listingId
    });
    
    if (!rpcError && rpcResult === true) {
      return { success: true, error: null };
    }
    
    // Fall back to manual step-by-step deletion
    // ... (handle each related table separately)
  } catch (error) {
    return { success: false, error };
  }
};
```

## Troubleshooting

If you continue to experience issues:

1. **Check if the function exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'safe_delete_listing';
   ```

2. **Check constraint definition**:
   ```sql
   SELECT tc.constraint_name, tc.table_name, cc.column_name, 
          rc.delete_rule, rc.update_rule
   FROM information_schema.table_constraints tc
   JOIN information_schema.constraint_column_usage cc
     ON tc.constraint_name = cc.constraint_name
   JOIN information_schema.referential_constraints rc
     ON tc.constraint_name = rc.constraint_name
   WHERE tc.constraint_name = 'listing_promotions_listing_id_fkey';
   ```

3. **Test direct deletion with the RPC function**:
   ```javascript
   const { data, error } = await supabase.rpc('safe_delete_listing', {
     listing_id_param: 'your-listing-id'
   });
   console.log(data, error);
   ```

## Future Considerations

To ensure robust deletion in the future:

1. **Use CASCADE on all foreign keys**: All new tables should use `ON DELETE CASCADE` for references to parent tables when appropriate

2. **Service-based architecture**: Continue moving database operations into dedicated service files to maintain consistency and reusability

3. **Validate dependencies**: Before creating new tables, consider how they might impact existing operations like deletion 