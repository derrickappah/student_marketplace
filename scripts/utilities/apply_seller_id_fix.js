// Script to apply the SQL fix for ambiguous seller_id references
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables for Supabase connection
require('dotenv').config();

// Supabase connection details
const supabaseUrl = process.env.SUPABASE_URL || 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need the service role key for admin operations

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required. Please set it in your environment variables or .env file.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function applySqlFix() {
  try {
    console.log('📊 Reading SQL fix from file...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'src', 'sql', 'fix_ambiguous_seller_id.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    // This is needed because some SQL operations need to be run separately
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📊 Found ${statements.length} SQL statements to execute.`);
    
    // Execute each SQL statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n⚙️ Executing SQL statement ${i + 1}/${statements.length}...`);
      console.log(`📝 ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      try {
        // Execute the SQL using the rpc exec_sql function
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
          // Continue with next statement - we don't want to stop the entire process
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully.`);
        }
      } catch (statementError) {
        console.error(`❌ Exception during statement ${i + 1}: ${statementError.message}`);
        // Continue with next statement
      }
    }
    
    console.log('\n✅ SQL fix application completed!');
    
    // Check if the views and functions were created
    const { data: routines, error: routinesError } = await supabase
      .from('pg_catalog.pg_proc')
      .select('proname')
      .in('proname', ['admin_safe_approve_promotion', 'admin_safe_reject_promotion', 'update_promotion_history_fixed']);
      
    if (routinesError) {
      console.error(`❌ Error checking for functions: ${routinesError.message}`);
    } else {
      console.log(`✅ Found ${routines?.length || 0} of the expected functions.`);
    }
    
    const { data: views, error: viewsError } = await supabase
      .from('pg_catalog.pg_views')
      .select('viewname')
      .in('viewname', ['listings_with_details', 'featured_listings_view', 'priority_listings_view']);
      
    if (viewsError) {
      console.error(`❌ Error checking for views: ${viewsError.message}`);
    } else {
      console.log(`✅ Found ${views?.length || 0} of the expected views.`);
    }
    
  } catch (error) {
    console.error('❌ Error applying SQL fix:', error);
  }
}

// Run the deployment function
applySqlFix(); 