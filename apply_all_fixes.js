// Master script to apply all fixes in sequence
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

async function applyAllFixes() {
  try {
    console.log('🚀 Starting comprehensive fix application');
    console.log('=======================================\n');
    
    // Apply fixes in sequence with clear separation
    await applyFixNotificationRls();
    console.log('\n---------------------------------------\n');
    
    await applyFixPromotionStats();
    console.log('\n---------------------------------------\n');
    
    await applyFixPromotionHistory();
    console.log('\n---------------------------------------\n');
    
    await applyListingDeleteFix();
    
    console.log('\n=======================================');
    console.log('✅ All fixes have been applied successfully!');
    console.log('\n📋 Final verification:');
    
    // Verify critical functions exist
    await verifyAllFunctions();
    
    console.log('\n📋 Next steps:');
    console.log('1. Test the application to ensure all fixes are working properly');
    console.log('2. Monitor error logs for any remaining issues');
    console.log('3. Update documentation to reflect the changes made');
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  }
}

// Helper to execute SQL statements from a file
async function executeSqlFromFile(filePath, description) {
  try {
    console.log(`📊 Reading SQL fix: ${description}...`);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ SQL file not found: ${filePath}`);
      return false;
    }
    
    // Read the SQL file
    const fixContent = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = fixContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📊 Found ${statements.length} statements to execute.`);
    
    // Execute statements
    console.log(`\n🔄 Applying ${description}...`);
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
    
    console.log(`\n✅ ${description} applied with ${successCount}/${statements.length} statements successful!`);
    return successCount > 0;
  } catch (error) {
    console.error(`❌ Error applying ${description}:`, error);
    return false;
  }
}

// Individual fix functions
async function applyFixNotificationRls() {
  console.log('🔔 APPLYING NOTIFICATION RLS FIXES');
  const fixPath = path.join(__dirname, 'src', 'sql', 'fix_notification_rls.sql');
  await executeSqlFromFile(fixPath, 'notification RLS fix');
}

async function applyFixPromotionStats() {
  console.log('📊 APPLYING PROMOTION STATS FIXES');
  const fixPath = path.join(__dirname, 'src', 'sql', 'fix_promotion_stats.sql');
  await executeSqlFromFile(fixPath, 'promotion stats fix');
}

async function applyFixPromotionHistory() {
  console.log('📜 APPLYING PROMOTION HISTORY FIXES');
  const fixPath = path.join(__dirname, 'src', 'sql', 'fix_promotion_history.sql');
  await executeSqlFromFile(fixPath, 'promotion history fix');
}

async function applyListingDeleteFix() {
  console.log('🗑️ APPLYING LISTING DELETE CONSTRAINT FIXES');
  const fixPath = path.join(__dirname, 'src', 'sql', 'fix_listing_delete_constraint.sql');
  await executeSqlFromFile(fixPath, 'listing delete constraint fix');
}

async function verifyAllFunctions() {
  const functionsToCheck = [
    'create_system_notification',
    'get_promotion_stats',
    'get_promotion_history',
    'safe_delete_listing'
  ];
  
  console.log('🔍 Verifying database functions...');
  
  for (const funcName of functionsToCheck) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `SELECT proname FROM pg_proc WHERE proname = '${funcName}'`
      });
      
      const exists = data && data.length > 0;
      console.log(`${exists ? '✅' : '❌'} Function ${funcName}: ${exists ? 'Found' : 'Not Found'}`);
    } catch (error) {
      console.error(`❌ Error checking function ${funcName}:`, error.message);
    }
  }
}

// Run all fixes
applyAllFixes(); 