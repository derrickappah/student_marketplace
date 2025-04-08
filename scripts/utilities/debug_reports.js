#!/usr/bin/env node

/**
 * Debug script to check if reports exist in the database
 * Run with: node scripts/debug_reports.js
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

async function debugReports() {
  try {
    // Check if reports table exists
    console.log('Checking reports table...');
    const { error: tableError } = await supabase
      .from('reports')
      .select('count')
      .limit(1);
      
    if (tableError) {
      console.error('Error accessing reports table:', tableError);
      if (tableError.message.includes('does not exist')) {
        console.error('The reports table does not exist in the database!');
      }
      process.exit(1);
    }
    
    console.log('Reports table exists. Checking for reports...');
    
    // Fetch all reports using service role (bypasses RLS)
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*');
      
    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      process.exit(1);
    }
    
    console.log(`Found ${reports?.length || 0} reports in the database.`);
    
    if (reports && reports.length > 0) {
      console.log('\nFirst report sample:');
      console.log('---------------------');
      const sample = reports[0];
      console.log(`ID: ${sample.id}`);
      console.log(`User ID: ${sample.user_id || sample.reporter_id}`);
      console.log(`Status: ${sample.status || 'Not set'}`);
      console.log(`Type/Reason: ${sample.reason || sample.category || 'Not set'}`);
      console.log(`Subject: ${sample.subject || 'Not set'}`);
      console.log(`Created: ${sample.created_at || 'Not set'}`);
      
      // List all report fields
      console.log('\nAll fields in the report:');
      console.log('------------------------');
      Object.keys(sample).forEach(key => {
        console.log(`${key}: ${sample[key]}`);
      });
    } else {
      console.log('No reports found in the database. You need to create some reports first.');
    }
    
    // Check RLS policies
    console.log('\nChecking RLS policies for reports table...');
    
    const policyCheckSql = `
      SELECT 
        schemaname, 
        tablename, 
        policyname, 
        roles, 
        cmd, 
        qual
      FROM 
        pg_policies 
      WHERE 
        tablename = 'reports';
    `;
    
    try {
      const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', { 
        sql: policyCheckSql 
      });
      
      if (policiesError) {
        console.error('Error checking policies:', policiesError);
      } else if (policies && policies.length > 0) {
        console.log('Policies found:');
        policies.forEach((policy, index) => {
          console.log(`\nPolicy #${index + 1}:`);
          console.log(`Name: ${policy.policyname}`);
          console.log(`Command: ${policy.cmd}`);
          console.log(`Roles: ${policy.roles}`);
          console.log(`Condition: ${policy.qual}`);
        });
      } else {
        console.log('No policies found for the reports table!');
        console.log('This is likely why admins cannot see reports.');
      }
    } catch (error) {
      console.error('Error executing policy check:', error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the debug function
debugReports(); 