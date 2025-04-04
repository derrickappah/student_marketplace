/**
 * Notification System Enhancement Script
 * 
 * This script applies database schema changes and function updates
 * to enhance the notification system with real-time capabilities.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  console.error('Error: SUPABASE_URL environment variable is required');
  process.exit(1);
}

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to SQL file with notification enhancements
const sqlFilePath = path.join(__dirname, 'sql-chunks', 'notifications_enhancements.sql');

// Function to execute the SQL file
async function applyNotificationEnhancements() {
  try {
    console.log('Starting notification system enhancements...');
    
    // Read the SQL file
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found at path: ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log(`Loaded SQL file with ${sqlContent.length} characters`);
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      throw error;
    }
    
    console.log('Successfully applied notification system enhancements!');
    
    // Verify the enhancements were applied
    await verifyEnhancements();
    
    return { success: true };
  } catch (error) {
    console.error('Error applying notification enhancements:', error.message);
    return { success: false, error };
  }
}

// Function to verify the enhancements were applied correctly
async function verifyEnhancements() {
  console.log('Verifying notification system enhancements...');
  
  // Check if notifications table has the new columns
  const { data: columns, error: columnsError } = await supabase
    .rpc('exec_sql_with_return', {
      sql: `SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name IN ('sender_id', 'preview', 'is_seen')`
    });
    
  if (columnsError) {
    console.error('Error checking columns:', columnsError.message);
  } else {
    const columnNames = columns.map(row => row.column_name);
    console.log('Verified columns:', columnNames);
    
    // Check for missing columns
    const expectedColumns = ['sender_id', 'preview', 'is_seen'];
    const missingColumns = expectedColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.warn('Some columns were not created:', missingColumns.join(', '));
    }
  }
  
  // Check if the functions were created
  const { data: functions, error: functionsError } = await supabase
    .rpc('exec_sql_with_return', {
      sql: `SELECT proname 
            FROM pg_proc 
            WHERE proname IN ('get_notification_badges', 'create_message_notification', 'mark_conversation_notifications_seen')`
    });
    
  if (functionsError) {
    console.error('Error checking functions:', functionsError.message);
  } else {
    const functionNames = functions.map(row => row.proname);
    console.log('Verified functions:', functionNames);
    
    // Check for missing functions
    const expectedFunctions = ['get_notification_badges', 'create_message_notification', 'mark_conversation_notifications_seen'];
    const missingFunctions = expectedFunctions.filter(func => !functionNames.includes(func));
    
    if (missingFunctions.length > 0) {
      console.warn('Some functions were not created:', missingFunctions.join(', '));
    }
  }
  
  // Check if the RLS policies were applied
  const { data: policies, error: policiesError } = await supabase
    .rpc('exec_sql_with_return', {
      sql: `SELECT policyname 
            FROM pg_policies 
            WHERE tablename = 'notifications'`
    });
    
  if (policiesError) {
    console.error('Error checking policies:', policiesError.message);
  } else {
    const policyNames = policies.map(row => row.policyname);
    console.log('Verified policies:', policyNames);
    
    // Check if required policies exist
    const requiredPolicies = [
      'Users can view own notifications',
      'Users can mark notifications as read',
      'Allow system notification creation',
      'Admins can manage all notifications'
    ];
    
    const missingPolicies = requiredPolicies.filter(policy => 
      !policyNames.some(p => p.toLowerCase().includes(policy.toLowerCase()))
    );
    
    if (missingPolicies.length > 0) {
      console.warn('Some policies may be missing:', missingPolicies.join(', '));
    }
  }
}

// Execute the enhancement application
applyNotificationEnhancements()
  .then(result => {
    if (result.success) {
      console.log('Notification system enhancements completed successfully!');
      process.exit(0);
    } else {
      console.error('Failed to apply notification system enhancements.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 