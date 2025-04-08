# Deploying Fixed Promotion Functions

To fix the "column reference 'seller_id' is ambiguous" error, follow these steps:

## 1. Access the Supabase Dashboard

Go to the [Supabase Dashboard](https://app.supabase.io/) and select your project.

## 2. Open SQL Editor

Click on **SQL Editor** in the left sidebar.

## 3. Copy and Paste the Fixed SQL Functions

Create a new SQL query and paste the following SQL:

```sql
-- Functions to safely approve and reject promotions without triggering the ambiguous seller_id error

-- Function to approve a promotion
-- This version uses direct SQL to avoid ambiguous column references without disabling triggers
CREATE OR REPLACE FUNCTION admin_approve_promotion_fixed(
  listing_id UUID,
  exp_date TIMESTAMP WITH TIME ZONE,
  set_featured BOOLEAN,
  set_priority BOOLEAN
) RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
  listing_user_id UUID;
  promotion_type TEXT;
  sql_query TEXT;
BEGIN
  -- Store the current user ID for later use in history
  current_user_id := auth.uid();
  
  -- Get the user_id from the listing using a parameterized query to avoid injection
  SELECT user_id INTO listing_user_id 
  FROM listings 
  WHERE id = listing_id;
  
  -- Determine promotion type for history
  IF set_featured AND set_priority THEN
    promotion_type := 'both';
  ELSIF set_featured THEN
    promotion_type := 'featured';
  ELSIF set_priority THEN
    promotion_type := 'priority';
  ELSE
    promotion_type := 'unknown';
  END IF;
  
  -- Construct a dynamic query with explicit table references to avoid ambiguity
  sql_query := format(
    'UPDATE listings SET 
      promotion_status = %L, 
      promotion_expires_at = %L,
      is_featured = CASE WHEN %L THEN true ELSE is_featured END,
      is_priority = CASE WHEN %L THEN true ELSE is_priority END
    WHERE listings.id = %L',
    'approved', 
    exp_date, 
    set_featured, 
    set_priority,
    listing_id
  );
  
  -- Execute the dynamic query directly
  EXECUTE sql_query;
  
  -- Handle the promotion history separately
  UPDATE promotion_request_history
  SET 
    status = 'approved',
    processed_at = NOW(),
    processed_by = current_user_id,
    expires_at = exp_date
  WHERE 
    listing_id = listing_id AND 
    status = 'pending';
  
  -- If no history record exists, create one
  IF NOT FOUND THEN
    INSERT INTO promotion_request_history (
      listing_id, 
      user_id, 
      promotion_type, 
      status, 
      requested_at,
      processed_at,
      processed_by,
      expires_at
    ) VALUES (
      listing_id,
      listing_user_id,
      promotion_type,
      'approved',
      NOW(),
      NOW(),
      current_user_id,
      exp_date
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a promotion
-- This version uses direct SQL to avoid ambiguous column references without disabling triggers
CREATE OR REPLACE FUNCTION admin_reject_promotion_fixed(
  listing_id UUID
) RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
  listing_user_id UUID;
  promotion_type TEXT;
  is_featured_val BOOLEAN;
  is_priority_val BOOLEAN;
  sql_query TEXT;
BEGIN
  -- Store the current user ID for later use in history
  current_user_id := auth.uid();
  
  -- Get the user_id and promotion details from the listing
  SELECT 
    user_id, is_featured, is_priority 
  INTO 
    listing_user_id, is_featured_val, is_priority_val
  FROM listings 
  WHERE id = listing_id;
  
  -- Determine promotion type for history
  IF is_featured_val AND is_priority_val THEN
    promotion_type := 'both';
  ELSIF is_featured_val THEN
    promotion_type := 'featured';
  ELSIF is_priority_val THEN
    promotion_type := 'priority';
  ELSE
    promotion_type := 'unknown';
  END IF;
  
  -- Construct a dynamic query with explicit table references to avoid ambiguity
  sql_query := format(
    'UPDATE listings SET 
      promotion_status = %L, 
      is_featured = false,
      is_priority = false
    WHERE listings.id = %L',
    'rejected', 
    listing_id
  );
  
  -- Execute the dynamic query directly
  EXECUTE sql_query;
  
  -- Handle the promotion history separately
  UPDATE promotion_request_history
  SET 
    status = 'rejected',
    processed_at = NOW(),
    processed_by = current_user_id
  WHERE 
    listing_id = listing_id AND 
    status = 'pending';
  
  -- If no history record exists, create one
  IF NOT FOUND THEN
    INSERT INTO promotion_request_history (
      listing_id, 
      user_id, 
      promotion_type, 
      status, 
      requested_at,
      processed_at,
      processed_by
    ) VALUES (
      listing_id,
      listing_user_id,
      promotion_type,
      'rejected',
      NOW(),
      NOW(),
      current_user_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_approve_promotion_fixed(UUID, TIMESTAMP WITH TIME ZONE, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reject_promotion_fixed(UUID) TO authenticated;
```

## 4. Run the SQL

Click the **Run** button to execute the SQL and create the fixed functions.

## 5. Verify the Functions

Check that the functions are created by running:

```sql
SELECT 
  routine_name 
FROM 
  information_schema.routines 
WHERE 
  routine_type = 'FUNCTION' 
  AND routine_name LIKE 'admin_%promotion%'
  AND routine_schema = 'public';
```

You should see both the original functions and the new fixed ones in the results.

## 6. Test the Functions

Try approving a promotion request through the admin dashboard. If it works, the fix has been successfully applied.

## Why This Fix Works

This approach uses dynamic SQL with the `format` and `EXECUTE` functions to create and run a highly specific SQL query. By crafting the query with explicit table references and using parameterized values, we avoid the ambiguous column reference issue without needing to disable any triggers.

The key advantages of this approach:

1. No need for special permissions to disable triggers
2. Still properly handles all database constraints and triggers
3. Maintains data integrity while avoiding the ambiguity problem
4. Uses SQL parameter placeholders (%L) to prevent SQL injection
5. The SECURITY DEFINER setting ensures the function runs with the permissions of its creator 