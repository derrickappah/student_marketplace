// Script to apply RLS and function fixes
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

async function applyRLSFixes() {
  try {
    console.log('📊 Reading SQL fixes...');
    
    // Read the SQL files
    const notificationRLSFixPath = path.join(__dirname, 'src', 'sql', 'fix_notification_rls.sql');
    const promotionStatsFixPath = path.join(__dirname, 'src', 'sql', 'fix_promotion_stats.sql');
    
    const notificationRLSFixContent = fs.readFileSync(notificationRLSFixPath, 'utf8');
    const promotionStatsFixContent = fs.readFileSync(promotionStatsFixPath, 'utf8');
    
    // Split the SQL into individual statements
    const notificationRLSStatements = notificationRLSFixContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
      
    const promotionStatsStatements = promotionStatsFixContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📊 Found ${notificationRLSStatements.length} notification RLS fix statements and ${promotionStatsStatements.length} promotion stats fix statements.`);
    
    // Execute notification RLS fix statements
    console.log('\n🔄 Applying notification RLS fixes...');
    for (let i = 0; i < notificationRLSStatements.length; i++) {
      const statement = notificationRLSStatements[i];
      console.log(`\n⚙️ Executing statement ${i + 1}/${notificationRLSStatements.length}...`);
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
    
    // Execute promotion stats fix statements
    console.log('\n🔄 Applying promotion stats fixes...');
    for (let i = 0; i < promotionStatsStatements.length; i++) {
      const statement = promotionStatsStatements[i];
      console.log(`\n⚙️ Executing statement ${i + 1}/${promotionStatsStatements.length}...`);
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
    
    console.log('\n✅ RLS and function fixes application completed!');
    
    // Check for the functions and policies
    console.log('\n🔍 Verifying changes...');
    
    // Check for create_system_notification function
    const { data: notificationFunction, error: functionError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT proname FROM pg_proc WHERE proname = 'create_system_notification'"
    });
    
    if (functionError) {
      console.error(`❌ Error checking for create_system_notification function: ${functionError.message}`);
    } else {
      const hasFunction = notificationFunction && notificationFunction.length > 0;
      console.log(`${hasFunction ? '✅' : '❌'} create_system_notification function: ${hasFunction ? 'Created' : 'Not Found'}`);
    }
    
    // Check for get_promotion_stats function
    const { data: statsFunction, error: statsFunctionError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT proname FROM pg_proc WHERE proname = 'get_promotion_stats'"
    });
    
    if (statsFunctionError) {
      console.error(`❌ Error checking for get_promotion_stats function: ${statsFunctionError.message}`);
    } else {
      const hasStatsFunction = statsFunction && statsFunction.length > 0;
      console.log(`${hasStatsFunction ? '✅' : '❌'} get_promotion_stats function: ${hasStatsFunction ? 'Updated' : 'Not Found'}`);
    }
    
    // Check for notification policies
    const { data: notificationPolicies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT policyname FROM pg_policies WHERE tablename = 'notifications'"
    });
    
    if (policiesError) {
      console.error(`❌ Error checking for notification policies: ${policiesError.message}`);
    } else {
      console.log(`✅ Notification policies: ${notificationPolicies ? notificationPolicies.length : 0} policies found`);
      if (notificationPolicies && notificationPolicies.length > 0) {
        notificationPolicies.forEach(policy => {
          console.log(`  - ${policy.policyname}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error applying RLS fixes:', error);
  }
}

// Run the deployment function
applyRLSFixes(); 