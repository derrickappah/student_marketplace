// Script to fix the admin_logs issue
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Get Supabase connection details from environment
const supabaseUrl = process.env.SUPABASE_URL || 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required. Please set it in your environment variables or .env file.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

// Direct connection for initial query bypassing exec_sql
const directExecSQL = async (query) => {
  try {
    // Use a direct Postgres connection for the initial fix
    const { data, error } = await supabase.from('admin_logs').select('id').limit(1);
    
    // Test if we can access the table at all
    if (error) {
      console.error('❌ Cannot access admin_logs table:', error.message);
      return false;
    }
    
    // Run the ALTER TABLE statement directly
    const { error: alterError } = await supabase.rpc('rpc_fix_admin_logs', {
      sql_stmt: query
    });
    
    if (alterError) {
      console.error('❌ Error executing direct SQL:', alterError.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Exception in directExecSQL:', error.message);
    return false;
  }
};

// Function to create a temporary fix function
const createTempFixFunction = async () => {
  try {
    // Create a temporary function that doesn't use admin_logs
    const createFuncQuery = `
      CREATE OR REPLACE FUNCTION rpc_fix_admin_logs(sql_stmt text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql_stmt;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      GRANT EXECUTE ON FUNCTION rpc_fix_admin_logs(text) TO authenticated;
      GRANT EXECUTE ON FUNCTION rpc_fix_admin_logs(text) TO service_role;
    `;
    
    // Use a direct POST request to create the function
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: createFuncQuery
    });
    
    if (error && !error.message.includes('admin_id')) {
      console.error('❌ Error creating temporary fix function:', error.message);
      return false;
    }
    
    console.log('✅ Created temporary fix function (or it already exists)');
    return true;
  } catch (error) {
    console.error('❌ Exception creating temporary fix function:', error.message);
    return false;
  }
};

// Main function to fix admin_logs
async function fixAdminLogs() {
  console.log('🔧 Starting admin_logs fix...');
  
  try {
    // Create temporary fix function first
    const funcCreated = await createTempFixFunction();
    if (!funcCreated) {
      console.log('⚠️ Could not create temporary fix function, but proceeding anyway...');
    }
    
    // Try direct option 1 - simplest approach
    console.log('🔄 Trying to make admin_id nullable...');
    const nullableFixed = await directExecSQL('ALTER TABLE admin_logs ALTER COLUMN admin_id DROP NOT NULL;');
    
    if (nullableFixed) {
      console.log('✅ Successfully made admin_id nullable!');
    } else {
      console.log('⚠️ Could not make admin_id nullable directly, trying alternative approach...');
    }
    
    // Read our full SQL fix script
    console.log('📊 Reading SQL fix...');
    const fixPath = path.join(__dirname, 'src', 'sql', 'fix_admin_logs.sql');
    const fixContent = fs.readFileSync(fixPath, 'utf8');
    
    // Split into individual statements
    const statements = fixContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📊 Found ${statements.length} statements in fix script.`);
    
    // Try each statement with our temp function first, then with exec_sql
    let successCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n⚙️ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // First try with our temporary function
        const { error: tempError } = await supabase.rpc('rpc_fix_admin_logs', {
          sql_stmt: statement
        });
        
        if (!tempError) {
          console.log(`✅ Statement ${i + 1} executed successfully with temp function!`);
          successCount++;
          continue;
        }
        
        // If that fails, try with regular exec_sql
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          if (error.message.includes('admin_id')) {
            console.log(`⚠️ Statement ${i + 1} still has admin_id issues, skipping...`);
          } else {
            console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully with exec_sql!`);
          successCount++;
        }
      } catch (statementError) {
        console.error(`❌ Exception during statement ${i + 1}: ${statementError.message}`);
      }
    }
    
    console.log(`\n✅ Admin logs fix completed with ${successCount}/${statements.length} statements successful!`);
    
    // Test if we can now use exec_sql
    console.log('\n🔍 Testing if exec_sql works now...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT 'success' as result"
    });
    
    if (error) {
      console.error('❌ exec_sql still not working:', error.message);
    } else {
      console.log('✅ exec_sql is now working properly!');
      console.log('📋 You can now run your other fix scripts');
    }
    
  } catch (error) {
    console.error('❌ Error in fixAdminLogs:', error);
  }
}

// Run the fix
fixAdminLogs(); 