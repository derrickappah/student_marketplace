const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Check if environment variables exist
if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.error('Error: Missing Supabase URL or anon key in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log(`Connecting to Supabase at: ${supabaseUrl}`);
    
    // Try to get a list of all tables
    const { data, error } = await supabase
      .from('pg_catalog.pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error('Error getting tables:', error);
      
      // Try a simpler query
      console.log('Trying a simpler query to check connection...');
      const { data: health, error: healthError } = await supabase.rpc('get_service_status');
      
      if (healthError) {
        console.error('Error with health check:', healthError);
        
        // Try one more thing - check if we can get categories
        console.log('Trying to select from a specific table...');
        const { data: categories, error: catError } = await supabase
          .from('categories')
          .select('*')
          .limit(1);
          
        if (catError) {
          console.error('Error getting categories:', catError);
          console.log('Connection failed. Check your credentials and permissions.');
        } else {
          console.log('Successfully connected! Categories:', categories);
        }
      } else {
        console.log('Health check successful:', health);
      }
    } else {
      console.log('Successfully connected! Tables in public schema:');
      data.forEach(table => {
        console.log(`- ${table.tablename}`);
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection(); 