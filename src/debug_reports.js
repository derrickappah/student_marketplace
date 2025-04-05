// Debug script to check if reports exist in the database
import { createClient } from '@supabase/supabase-js';

// This script should be run with the service role key to bypass RLS
const debugReports = async () => {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or service role key');
    return;
  }
  
  console.log('Initializing Supabase client with service role...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    console.log('Checking if reports table exists...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'reports');
      
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.error('Reports table does not exist!');
      return;
    }
    
    console.log('Reports table exists. Checking for reports...');
    
    // Fetch all reports using service role (bypasses RLS)
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*');
      
    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return;
    }
    
    console.log(`Found ${reports?.length || 0} reports in the database.`);
    
    if (reports && reports.length > 0) {
      console.log('First report sample:', JSON.stringify(reports[0], null, 2));
      
      // Check RLS policies
      console.log('\nChecking RLS policies for reports table...');
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies_for_table', { table_name: 'reports' });
        
      if (policiesError) {
        console.error('Error fetching policies:', policiesError);
      } else {
        console.log('Policies:', policies);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

// Run the debug function
debugReports(); 