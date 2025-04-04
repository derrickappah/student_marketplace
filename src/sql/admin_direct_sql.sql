-- Direct SQL execution function for admin operations when other methods fail
-- This should be used only as a last resort when the regular RPC functions fail

CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT) RETURNS VOID AS $$
BEGIN
  -- Execute the provided SQL query directly
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict access to this function to authenticated users only
-- In production, you would further restrict this to admin users
REVOKE ALL ON FUNCTION execute_sql(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated; 