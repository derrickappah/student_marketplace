-- Check the schema of the reports table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns 
WHERE 
  table_name = 'reports'
ORDER BY 
  ordinal_position;

-- Look for any potential user identifier columns
SELECT 
  column_name 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'reports' 
  AND (
    column_name LIKE '%user%' 
    OR column_name LIKE '%author%' 
    OR column_name LIKE '%creator%' 
    OR column_name LIKE '%reporter%' 
    OR column_name LIKE '%submitter%' 
    OR column_name LIKE '%owner%'
  );

-- Show a sample report to see actual data
SELECT 
  * 
FROM 
  reports 
LIMIT 1; 