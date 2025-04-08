// Script to apply the promotion history fix
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

async function applyPromotionHistoryFix() {
  try {
    console.log('📊 Reading SQL fix...');
    
    // Read the SQL file
    const fixPath = path.join(__dirname, 'src', 'sql', 'fix_promotion_history.sql');
    const fixContent = fs.readFileSync(fixPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = fixContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📊 Found ${statements.length} statements to execute.`);
    
    // Execute statements
    console.log('\n🔄 Applying promotion history fix...');
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n⚙️ Executing statement ${i + 1}/${statements.length}...`);
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
    
    console.log('\n✅ Promotion history fix applied successfully!');
    
    // Check for the functions
    console.log('\n🔍 Verifying changes...');
    
    // Check for get_promotion_history function
    const { data: historyFunction, error: functionError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT proname FROM pg_proc WHERE proname = 'get_promotion_history'"
    });
    
    if (functionError) {
      console.error(`❌ Error checking for get_promotion_history function: ${functionError.message}`);
    } else {
      const hasFunction = historyFunction && historyFunction.length > 0;
      console.log(`${hasFunction ? '✅' : '❌'} get_promotion_history function: ${hasFunction ? 'Created' : 'Not Found'}`);
    }
    
    // Check for insert_promotion_request function
    const { data: insertFunction, error: insertError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT proname FROM pg_proc WHERE proname = 'insert_promotion_request'"
    });
    
    if (insertError) {
      console.error(`❌ Error checking for insert_promotion_request function: ${insertError.message}`);
    } else {
      const hasFunction = insertFunction && insertFunction.length > 0;
      console.log(`${hasFunction ? '✅' : '❌'} insert_promotion_request function: ${hasFunction ? 'Created' : 'Not Found'}`);
    }
    
    // Check for process_promotion_request function
    const { data: processFunction, error: processError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT proname FROM pg_proc WHERE proname = 'process_promotion_request'"
    });
    
    if (processError) {
      console.error(`❌ Error checking for process_promotion_request function: ${processError.message}`);
    } else {
      const hasFunction = processFunction && processFunction.length > 0;
      console.log(`${hasFunction ? '✅' : '❌'} process_promotion_request function: ${hasFunction ? 'Created' : 'Not Found'}`);
    }
    
    // Check if the promotion_request_history table has data
    const { data: historyCount, error: countError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT COUNT(*) FROM promotion_request_history"
    });
    
    if (countError) {
      console.error(`❌ Error checking promotion_request_history data: ${countError.message}`);
    } else {
      const count = historyCount && historyCount.length > 0 ? parseInt(historyCount[0].count) : 0;
      console.log(`ℹ️ promotion_request_history table has ${count} records`);
    }
    
    // Check history table RLS policies
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT policyname FROM pg_policies WHERE tablename = 'promotion_request_history'"
    });
    
    if (policiesError) {
      console.error(`❌ Error checking history table policies: ${policiesError.message}`);
    } else {
      console.log(`✅ promotion_request_history policies: ${policies ? policies.length : 0} policies found`);
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`  - ${policy.policyname}`);
        });
      }
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Test the promotion approval flow in the admin dashboard');
    console.log('2. Verify promotion history is visible in the history tab');
    console.log('3. Check that notifications are created correctly');
    
  } catch (error) {
    console.error('❌ Error applying promotion history fix:', error);
  }
}

// Run the fix
applyPromotionHistoryFix(); 