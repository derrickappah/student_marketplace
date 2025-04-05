#!/usr/bin/env node

/**
 * Script to create a test report in the database
 * Run with: node scripts/create_test_report.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service role key');
  console.error('Make sure your .env file contains REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase with service role key (bypasses RLS)
console.log('Initializing Supabase client with service role...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestReport() {
  try {
    // First fetch a valid user ID to associate with the report
    console.log('Fetching a valid user ID...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      process.exit(1);
    }
    
    if (!users || users.length === 0) {
      console.error('No users found in the database!');
      process.exit(1);
    }
    
    const userId = users[0].id;
    console.log(`Using user ID: ${userId}`);
    
    // Create a test report
    const testReport = {
      user_id: userId,
      reason: 'Test Report',
      status: 'pending',
      description: 'This is a test report created for debugging purposes',
      subject: 'Debug Test Report',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Creating test report...');
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert(testReport)
      .select();
      
    if (reportError) {
      console.error('Error creating test report:', reportError);
      process.exit(1);
    }
    
    console.log('Test report created successfully!');
    console.log('Report ID:', report[0].id);
    
    // Now explicitly apply the admin policies
    console.log('\nEnsuring admin policies are applied...');
    
    const policySql = `
      -- Drop any existing policies
      DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
      DROP POLICY IF EXISTS "Admins can update reports" ON reports;
      DROP POLICY IF EXISTS "Admins can delete reports" ON reports;
      
      -- Create the admin access policy for reports
      CREATE POLICY "Admins can view all reports" ON reports 
        FOR SELECT
        USING (
          -- Check if the request is coming from the service_role (admin API)
          (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
          OR
          -- Or if the user has admin privileges
          auth.uid() IN (
            SELECT id FROM users WHERE is_admin = true
          )
        );
      
      -- Add update policy for admins
      CREATE POLICY "Admins can update reports" ON reports
        FOR UPDATE
        USING (
          (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
          OR
          auth.uid() IN (
            SELECT id FROM users WHERE is_admin = true
          )
        );
      
      -- Add delete policy for admins
      CREATE POLICY "Admins can delete reports" ON reports
        FOR DELETE
        USING (
          (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
          OR
          auth.uid() IN (
            SELECT id FROM users WHERE is_admin = true
          )
        );
      
      -- Finally, verify RLS is enabled
      SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'reports';
    `;
    
    // Execute the policy SQL
    try {
      // Because exec_sql might be named differently, use a custom RPC function
      console.log('Warning: exec_sql function seems to be missing or has a different name.');
      console.log('Please execute these SQL commands manually in the Supabase dashboard:');
      console.log(policySql);
      
      // Try to check table RLS status directly
      const rlsCheckSql = `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'reports';`;
      const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', { 
        sql_query: rlsCheckSql 
      });
      
      if (!rlsError && rlsStatus) {
        console.log('RLS status for reports table:', rlsStatus);
      }
      
    } catch (sqlError) {
      console.error('Note: Could not execute SQL directly:', sqlError.message);
    }
    
    console.log('\nTest report process completed.');
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the function
createTestReport(); 