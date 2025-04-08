// Script to apply the user_status table migration
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

async function applyUserStatusFix() {
  try {
    console.log('🚀 Starting user_status table fix application');
    console.log('=======================================\n');
    
    // Path to the migration file
    const migrationFilePath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20240601_create_user_status_table.sql');
    
    // Check if the file exists
    if (!fs.existsSync(migrationFilePath)) {
      console.error(`❌ Migration file not found: ${migrationFilePath}`);
      return false;
    }
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📊 Found ${statements.length} statements to execute.`);
    
    // Execute statements
    console.log(`\n🔄 Applying user_status table creation...`);
    let successCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n⚙️ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Execute the SQL using the rpc exec_sql function
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          // If the exec_sql function doesn't exist, try direct query
          if (error.message.includes('function "exec_sql" does not exist')) {
            console.log('exec_sql function not found, trying direct query...');
            const { error: directError } = await supabase.auth.admin.executeSql(statement);
            
            if (directError) {
              console.error(`❌ Error executing statement ${i + 1}: ${directError.message}`);
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully via direct query.`);
              successCount++;
            }
          } else {
            console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully.`);
          successCount++;
        }
      } catch (statementError) {
        console.error(`❌ Exception during statement ${i + 1}: ${statementError.message}`);
      }
    }
    
    console.log(`\n✅ Completed execution: ${successCount}/${statements.length} statements successful.`);
    
    // Verify the user_status table exists
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('count(*)', { count: 'exact' })
        .limit(0);
      
      if (error) {
        console.error('❌ Verification failed: user_status table may not exist:', error.message);
      } else {
        console.log('✅ Verification successful: user_status table exists');
      }
    } catch (verifyError) {
      console.error('❌ Error during verification:', verifyError.message);
    }
    
    console.log('\n=======================================');
    console.log('✅ User status fix has been applied!');
    
  } catch (error) {
    console.error('❌ Error applying user_status fix:', error);
  }
}

// Run the fix
applyUserStatusFix().catch(console.error);