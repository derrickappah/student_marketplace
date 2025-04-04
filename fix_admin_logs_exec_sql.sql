-- Fix for the admin_logs NOT NULL constraint issue with exec_sql

-- 1. Make the admin_id column nullable
ALTER TABLE admin_logs ALTER COLUMN admin_id DROP NOT NULL;

-- 2. Fix the exec_sql function to handle NULL admin_id
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 