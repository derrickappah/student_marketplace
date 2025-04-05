-- Check the schema of the users table to find admin indicator columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns 
WHERE 
  table_name = 'users'
ORDER BY 
  ordinal_position;

-- Look for any column names that might indicate admin status
SELECT 
  column_name 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'users' 
  AND (
    column_name LIKE '%admin%' 
    OR column_name LIKE '%role%' 
    OR column_name LIKE '%permission%' 
    OR column_name LIKE '%access%' 
    OR column_name LIKE '%type%'
  );

-- Check if there's a separate roles table
SELECT 
  table_name 
FROM 
  information_schema.tables 
WHERE 
  table_name LIKE '%role%' 
  OR table_name LIKE '%permission%';

-- Show a sample of users to see what data is available
SELECT 
  id, 
  * 
FROM 
  users 
LIMIT 5; 