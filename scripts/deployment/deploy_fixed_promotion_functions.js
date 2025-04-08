// Script to deploy the fixed promotion functions to the database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables or set them directly for this script
const supabaseUrl = process.env.SUPABASE_URL || 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need the service role key to execute SQL

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function deployFixedFunctions() {
  try {
    console.log('Deploying fixed promotion functions...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'src', 'sql', 'admin_promotion_functions_fixed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      throw error;
    }
    
    console.log('Fixed promotion functions deployed successfully!');
  } catch (error) {
    console.error('Error deploying fixed functions:', error);
  }
}

// Run the deployment function
deployFixedFunctions(); 