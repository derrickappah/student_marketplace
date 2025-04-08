// Script to apply the listing delete constraint fix
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

async function applyListingDeleteFix() {
  try {
    console.log('📊 Reading SQL fix...');
    
    // Read the SQL file
    const fixPath = path.join(__dirname, 'src', 'sql', 'fix_listing_delete_constraint.sql');
    const fixContent = fs.readFileSync(fixPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = fixContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📊 Found ${statements.length} statements to execute.`);
    
    // Execute statements
    console.log('\n🔄 Applying listing delete constraint fix...');
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
        }
      } catch (statementError) {
        console.error(`❌ Exception during statement ${i + 1}: ${statementError.message}`);
      }
    }
    
    console.log('\n✅ Listing delete constraint fix applied successfully!');
    
    // Check for the safe_delete_listing function
    console.log('\n🔍 Verifying changes...');
    
    const { data: safeDeleteFunction, error: functionError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT proname FROM pg_proc WHERE proname = 'safe_delete_listing'"
    });
    
    if (functionError) {
      console.error(`❌ Error checking for safe_delete_listing function: ${functionError.message}`);
    } else {
      const hasFunction = safeDeleteFunction && safeDeleteFunction.length > 0;
      console.log(`${hasFunction ? '✅' : '❌'} safe_delete_listing function: ${hasFunction ? 'Created' : 'Not Found'}`);
    }
    
    // Check listing_promotions table
    const { data: listingPromotionsTable, error: tableError } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT tablename FROM pg_tables WHERE tablename = 'listing_promotions'"
    });
    
    if (tableError) {
      console.error(`❌ Error checking for listing_promotions table: ${tableError.message}`);
    } else {
      const hasTable = listingPromotionsTable && listingPromotionsTable.length > 0;
      console.log(`ℹ️ listing_promotions table: ${hasTable ? 'Exists' : 'Not Found'}`);
      
      if (hasTable) {
        // Check constraint
        const { data: constraint, error: constraintError } = await supabase.rpc('exec_sql', {
          sql_query: "SELECT conname FROM pg_constraint WHERE conname = 'listing_promotions_listing_id_fkey'"
        });
        
        if (constraintError) {
          console.error(`❌ Error checking for constraint: ${constraintError.message}`);
        } else {
          const hasConstraint = constraint && constraint.length > 0;
          console.log(`ℹ️ listing_promotions_listing_id_fkey constraint: ${hasConstraint ? 'Exists' : 'Not Found - It may have been renamed'}`);
        }
      }
    }
    
    // Try deleting the problematic listing
    const listingId = '3e73a449-b82b-4be2-b160-4d3113e67018';
    console.log(`\n🔄 Attempting to delete problematic listing: ${listingId}`);
    
    // First check if it still exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id')
      .eq('id', listingId)
      .single();
      
    if (listingError && listingError.code === 'PGRST116') {
      console.log(`ℹ️ Listing ${listingId} no longer exists.`);
    } else if (listing) {
      // Try to use the safe_delete_listing function
      try {
        const { data, error } = await supabase.rpc('safe_delete_listing', {
          listing_id_param: listingId
        });
        
        if (error) {
          console.error(`❌ Error deleting listing with safe_delete_listing: ${error.message}`);
        } else {
          console.log(`✅ Successfully deleted listing ${listingId} with safe_delete_listing function`);
        }
      } catch (err) {
        console.error(`❌ Exception deleting listing: ${err.message}`);
      }
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Test the application by trying to delete a listing');
    console.log('2. Verify no constraint errors occur');
    console.log('3. Check that related records are properly cleaned up');
    
  } catch (error) {
    console.error('❌ Error applying listing delete constraint fix:', error);
  }
}

// Run the fix
applyListingDeleteFix(); 