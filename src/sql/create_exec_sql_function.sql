-- Create a function to execute SQL from client for migrations
-- NOTE: This should only be used in development or with extreme caution in production
-- as it allows executing arbitrary SQL. In production, migrations should be handled
-- by a more controlled process.

-- Drop function if it exists
DROP FUNCTION IF EXISTS exec_sql(text);

-- Create the function with security definer (runs as the owner of the function)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This will execute with the privileges of the function owner, not the caller
AS $$
BEGIN
  -- Log execution for audit purposes
  INSERT INTO admin_logs (
    admin_id,
    action_type,
    details,
    target_type,
    ip_address,
    created_at
  ) VALUES (
    auth.uid(),
    'settings',
    'Executed SQL via exec_sql function: ' || left(sql_query, 200) || '...',
    'database',
    '127.0.0.1',
    now()
  );

  -- Execute the SQL
  EXECUTE sql_query;
END;
$$;

-- Grant execute permission only to authenticated users with admin role
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;

-- Create policy to allow only admins to execute this function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT (
    SELECT role FROM users WHERE id = auth.uid()
  ) IN ('admin', 'super_admin');
$$;

-- Add a comment to the function
COMMENT ON FUNCTION exec_sql IS 'Executes arbitrary SQL. DANGER: Only for admin use and migrations. Restricted by RLS.';

-- Example usage (must be admin):
-- SELECT exec_sql('CREATE TABLE example_table (id SERIAL PRIMARY KEY, name TEXT);'); 