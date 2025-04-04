-- Simple fix for both issues

-- First make admin_id nullable
ALTER TABLE admin_logs ALTER COLUMN admin_id DROP NOT NULL;

-- Then drop and recreate exec_sql function
DROP FUNCTION IF EXISTS exec_sql(text);

CREATE FUNCTION exec_sql(sql_query text) RETURNS SETOF json AS 
$func$
DECLARE 
  result json;
BEGIN
  -- Log the SQL action
  INSERT INTO admin_logs (action, details, performed_at) 
  VALUES ('execute_sql', json_build_object('query', sql_query), now());
  
  -- Execute the query
  FOR result IN EXECUTE sql_query LOOP
    RETURN NEXT result;
  END LOOP;
  RETURN;
EXCEPTION WHEN OTHERS THEN
  -- Handle non-returning queries
  BEGIN
    EXECUTE sql_query;
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE;
  END;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set permissions
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role; 