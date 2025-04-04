-- Fix for the exec_sql function after admin_logs column is fixed

-- Drop the existing function first
DROP FUNCTION IF EXISTS exec_sql(text);

-- Create or replace the exec_sql function to handle NULL admin_id
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
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