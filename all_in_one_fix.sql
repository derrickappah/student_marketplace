-- All-in-one fix for admin_logs and exec_sql issues
-- This ensures everything happens in one transaction

BEGIN;

-- 1. Make admin_id nullable in admin_logs table
ALTER TABLE admin_logs ALTER COLUMN admin_id DROP NOT NULL;

-- 2. Drop the existing exec_sql function 
DROP FUNCTION IF EXISTS exec_sql(text);

-- 3. Create the new exec_sql function with proper error handling
CREATE FUNCTION exec_sql(sql_query text)
RETURNS SETOF json AS $$
DECLARE 
  result json;
BEGIN
  -- Log the SQL action first (without requiring admin_id)
  INSERT INTO admin_logs (
    action, 
    details, 
    performed_at
  ) VALUES (
    'execute_sql',
    json_build_object('query', sql_query),
    now()
  );
  
  -- Execute the query
  FOR result IN EXECUTE sql_query LOOP
    RETURN NEXT result;
  END LOOP;
  
  RETURN;
EXCEPTION WHEN OTHERS THEN
  -- If the statement fails because it doesn't return rows (e.g., DDL statements)
  -- Just execute it directly
  BEGIN
    EXECUTE sql_query;
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure proper permissions are set
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- 5. Simple verification to confirm changes
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'admin_logs' 
    AND column_name = 'admin_id' 
    AND is_nullable = 'YES'
  ) THEN
    RAISE NOTICE 'admin_logs.admin_id is now nullable - fix successful';
  ELSE
    RAISE WARNING 'admin_logs.admin_id is still NOT NULL - fix may have failed';
  END IF;
END $$;

COMMIT; 