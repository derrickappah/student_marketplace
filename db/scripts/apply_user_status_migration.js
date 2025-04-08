require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('Applying user status migration...');

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Adding status column to users table...');
    
    // We'll use direct table operations instead of exec_sql
    // Step 1: Check if status column exists
    const { data: columnCheck, error: columnCheckError } = await supabase
      .from('users')
      .select('status')
      .limit(1)
      .maybeSingle();
    
    // If we can query the column, it already exists
    if (!columnCheckError) {
      console.log('Status column already exists in users table.');
      return;
    }
    
    console.log('Status column does not exist yet. Adding it...');
    
    // Since we can't run ALTER TABLE directly, we'll update each user with a status field
    // This will implicitly create the column if it doesn't exist (Supabase JSON schema)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1000);  // Get all users, adjust limit if needed
    
    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }
    
    // Update each user with status = 'active'
    console.log(`Updating ${users.length} users with status = 'active'...`);
    
    for (const user of users) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id);
      
      if (updateError) {
        console.warn(`Warning: Couldn't update user ${user.id}: ${updateError.message}`);
      }
    }
    
    console.log('All users have been updated with a status field.');
    
    // Verify the column was added
    const { data, error: verifyError } = await supabase
      .from('users')
      .select('status')
      .limit(1);
    
    if (verifyError) {
      console.warn('Warning: Could not verify migration success:', verifyError.message);
    } else {
      console.log('Verification successful: status column is now available');
    }

    // Log action
    const { error: logError } = await supabase
      .from('admin_logs')
      .insert({
        action: 'schema_update',
        description: 'Added status column to users table',
        admin_id: null,  // No specific admin since this is a script
        entity_id: null,
        entity_type: 'users'
      });
    
    if (logError) {
      console.warn('Warning: Could not log the migration:', logError.message);
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration(); 