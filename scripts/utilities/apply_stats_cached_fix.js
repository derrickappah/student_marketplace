// Script to apply the promotion stats cached function fix
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables for Supabase connection
require('dotenv').config();

// Supabase connection details
const supabaseUrl = process.env.SUPABASE_URL || 'https://ivdsmrlcbhanwafntncx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyStatsCachedFix() {
  try {
    console.log('🚀 Applying the promotion stats cached function fix...');
    
    // Read the SQL file
    const fixPath = path.join(__dirname, 'src', 'sql', 'fix_promotion_stats_cached.sql');
    const fixContent = fs.readFileSync(fixPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = fixContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📊 Found ${statements.length} statements to execute.`);
    
    // Execute statements
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
          console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully.`);
          successCount++;
        }
      } catch (statementError) {
        console.error(`❌ Exception during statement ${i + 1}: ${statementError.message}`);
      }
    }
    
    console.log(`\n✅ Fix applied with ${successCount}/${statements.length} statements successful!`);
    
    // Check if the function exists now
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT proname FROM pg_proc WHERE proname = 'get_promotion_stats_cached'"
    });
    
    if (error) {
      console.error('❌ Error checking for function:', error.message);
    } else {
      const exists = data && data.length > 0;
      console.log(`${exists ? '✅' : '❌'} get_promotion_stats_cached function: ${exists ? 'Created' : 'Not Found'}`);
    }
    
    // Try calling the function directly
    console.log('\n🔍 Testing the function...');
    
    try {
      const { data: statsData, error: statsError } = await supabase.rpc('get_promotion_stats_cached');
      
      if (statsError) {
        console.error('❌ Error calling get_promotion_stats_cached:', statsError.message);
      } else {
        console.log('✅ Successfully called get_promotion_stats_cached!');
        console.log('📊 Statistics summary:');
        console.log(`   - Pending: ${statsData.total_pending}`);
        console.log(`   - Approved: ${statsData.total_approved}`);
        console.log(`   - Rejected: ${statsData.total_rejected}`);
      }
    } catch (testError) {
      console.error('❌ Exception calling get_promotion_stats_cached:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Error applying fix:', error);
  }
}

// Run the fix
applyStatsCachedFix(); 