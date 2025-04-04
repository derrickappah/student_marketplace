const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Check if environment variables exist
if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.error('Error: Missing Supabase URL or anon key in .env file');
  console.error('Please update your .env file with your Supabase project credentials');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Read SQL file
const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');

async function runSQL() {
  try {
    console.log('Reading schema file...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into statements to run individually
    const statements = schemaSql
      .split(';')
      .filter(statement => statement.trim() !== '')
      .map(statement => statement.trim() + ';');
    
    console.log(`Found ${statements.length} SQL statements to run`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Running statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('pg_execute', { 
        sql_statement: statement 
      });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Continue to next statement instead of stopping execution
      }
    }
    
    console.log('Schema deployment completed!');
    console.log('Note: Some statements might have failed if tables already exist or due to permissions.');
    console.log('You may need to run some statements manually in the Supabase SQL editor.');
    
  } catch (error) {
    console.error('Error running SQL:', error);
  }
}

console.log('Starting schema deployment to Supabase...');
console.log(`URL: ${supabaseUrl}`);
runSQL(); 