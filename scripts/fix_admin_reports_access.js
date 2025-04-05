#!/usr/bin/env node

/**
 * This script applies the admin access policy for reports
 * Run with: node scripts/fix_admin_reports_access.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with service role key (admin)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service role key');
  console.error('Make sure your .env file contains REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyAdminReportsPolicy() {
  console.log('Applying admin reports access policy...');

  const sql = `
    -- Drop the existing policy if uncommented manually
    DROP POLICY IF EXISTS "Admins can view all reports" ON reports;

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
    DROP POLICY IF EXISTS "Admins can update reports" ON reports;
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
    DROP POLICY IF EXISTS "Admins can delete reports" ON reports;
    CREATE POLICY "Admins can delete reports" ON reports
      FOR DELETE
      USING (
        (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
        OR
        auth.uid() IN (
          SELECT id FROM users WHERE is_admin = true
        )
      );
  `;

  try {
    // Execute SQL as service role (admin)
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying admin reports policy:', error);
      process.exit(1);
    }
    
    console.log('Admin reports access policy successfully applied');
    
    // Verify the policy was applied by checking if we can access reports
    const { data, error: fetchError } = await supabase
      .from('reports')
      .select('id')
      .limit(1);
      
    if (fetchError) {
      console.error('Policy applied but still cannot access reports:', fetchError);
      process.exit(1);
    }
    
    console.log('Access verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
applyAdminReportsPolicy(); 