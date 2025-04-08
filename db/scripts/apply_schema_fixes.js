// Script to apply schema fixes for notifications and admin_logs
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

async function applySchemaFixes() {
  try {
    console.log('📊 Reading SQL fixes...');
    
    // Read the SQL files
    const notificationsFixPath = path.join(__dirname, 'src', 'sql', 'fix_notifications_schema.sql');
    const adminLogsFixPath = path.join(__dirname, 'src', 'sql', 'fix_admin_logs_schema.sql');
    
    const notificationsFixContent = fs.readFileSync(notificationsFixPath, 'utf8');
    const adminLogsFixContent = fs.readFileSync(adminLogsFixPath, 'utf8');
    
    // Split the SQL into individual statements
    const notificationsStatements = notificationsFixContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
      
    const adminLogsStatements = adminLogsFixContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📊 Found ${notificationsStatements.length} notifications schema fix statements and ${adminLogsStatements.length} admin logs schema fix statements.`);
    
    // Execute notifications fix statements
    console.log('\n🔄 Applying notifications schema fixes...');
    for (let i = 0; i < notificationsStatements.length; i++) {
      const statement = notificationsStatements[i];
      console.log(`\n⚙️ Executing statement ${i + 1}/${notificationsStatements.length}...`);
      console.log(`📝 ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      try {
        // Execute the SQL using the rpc exec_sql function
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully.`);
        }
      } catch (statementError) {
        console.error(`❌ Exception during statement ${i + 1}: ${statementError.message}`);
      }
    }
    
    // Execute admin logs fix statements
    console.log('\n🔄 Applying admin logs schema fixes...');
    for (let i = 0; i < adminLogsStatements.length; i++) {
      const statement = adminLogsStatements[i];
      console.log(`\n⚙️ Executing statement ${i + 1}/${adminLogsStatements.length}...`);
      console.log(`📝 ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      try {
        // Execute the SQL using the rpc exec_sql function
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully.`);
        }
      } catch (statementError) {
        console.error(`❌ Exception during statement ${i + 1}: ${statementError.message}`);
      }
    }
    
    console.log('\n✅ Schema fixes application completed!');
    
    // Check for the column and constraint
    console.log('\n🔍 Verifying changes...');
    
    // Check for related_id column in notifications
    const { data: relatedIdColumn, error: relatedIdError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'related_id'"
    });
    
    if (relatedIdError) {
      console.error(`❌ Error checking for related_id column: ${relatedIdError.message}`);
    } else {
      const hasRelatedId = relatedIdColumn && relatedIdColumn.length > 0;
      console.log(`${hasRelatedId ? '✅' : '❌'} related_id column in notifications table: ${hasRelatedId ? 'Added' : 'Not Found'}`);
    }
    
    // Check for updated admin_logs constraint
    const { data: adminLogsConstraint, error: constraintError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'admin_logs' AND constraint_name = 'admin_logs_action_type_check'"
    });
    
    if (constraintError) {
      console.error(`❌ Error checking for admin_logs constraint: ${constraintError.message}`);
    } else {
      const hasConstraint = adminLogsConstraint && adminLogsConstraint.length > 0;
      console.log(`${hasConstraint ? '✅' : '❌'} admin_logs_action_type_check constraint: ${hasConstraint ? 'Updated' : 'Not Found'}`);
    }
    
  } catch (error) {
    console.error('❌ Error applying schema fixes:', error);
  }
}

// Run the deployment function
applySchemaFixes(); 