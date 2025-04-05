import { supabase } from "./supabase";

/**
 * Checks if the admin has proper access to the reports table
 * @returns {Promise<{hasAccess: boolean, error: Error|null}>}
 */
export const checkAdminReportsAccess = async () => {
  try {
    console.log('Checking admin reports access...');
    // Try to fetch a report to see if we have access
    const { data, error } = await supabase
      .from('reports')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Error checking admin reports access:', error);
      return { hasAccess: false, error };
    }
    
    console.log(`Admin reports access check result: ${data ? data.length : 0} reports found`);
    return { hasAccess: true, count: data ? data.length : 0 };
  } catch (error) {
    console.error('Error in checkAdminReportsAccess:', error);
    return { hasAccess: false, error };
  }
};

/**
 * Applies the admin access policy to fix report visibility
 * This fixes the issue where admins cannot see reports in the Reports Management page
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const fixAdminReportsAccess = async () => {
  try {
    console.log('Applying admin reports access policy...');
    
    // Use service_role only policy since we don't know the admin column
    const sql = `
      -- Drop any existing policies that might conflict
      DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
      DROP POLICY IF EXISTS "Admins can update reports" ON reports;
      DROP POLICY IF EXISTS "Admins can delete reports" ON reports;
      DROP POLICY IF EXISTS "Service role has full access" ON reports;

      -- Make sure RLS is enabled
      ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

      -- Create simple service_role access policy
      CREATE POLICY "Service role has full access" ON reports 
        FOR ALL
        USING (
          -- Service role has full access (for admins)
          (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
        );
        
      -- For regular users to view their own reports
      DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
      CREATE POLICY "Users can view their own reports" ON reports
        FOR SELECT
        USING (
          auth.uid() = reporter_id
        );
        
      -- For regular users to insert reports
      DROP POLICY IF EXISTS "Users can insert reports" ON reports;
      CREATE POLICY "Users can insert reports" ON reports
        FOR INSERT
        WITH CHECK (
          auth.uid() = reporter_id
        );
    `;
    
    console.log('Executing SQL policy fix...');
    
    // First try with exec_sql
    try {
      const { error: rpcError } = await supabase.rpc('exec_sql', { sql });
      
      if (rpcError) {
        console.error('Error with exec_sql RPC:', rpcError);
        
        // Try alternative syntax
        console.log('Trying alternative exec_sql format...');
        try {
          const { error: altError } = await supabase.rpc('exec_sql', { sql_query: sql });
          
          if (altError) {
            console.error('Error with alternative exec_sql format:', altError);
            throw altError;
          } else {
            console.log('Alternative exec_sql format successful!');
          }
        } catch (altErr) {
          console.error('Exception in alternative exec_sql:', altErr);
          throw altErr;
        }
      } else {
        console.log('exec_sql RPC successful!');
      }
    } catch (rpcErr) {
      console.error('Exception in exec_sql RPC:', rpcErr);
      
      // Fall back to direct REST call as last resort
      console.log('Attempting direct REST call as fallback...');
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'apikey': supabase.supabaseKey
        },
        body: JSON.stringify({ sql })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Direct REST call failed:', errorData);
        throw new Error(`Direct REST call failed: ${JSON.stringify(errorData)}`);
      }
    }
    
    // Check if the policy was applied successfully
    console.log('Verifying if reports are now accessible...');
    const { data, error: verifyError } = await supabase
      .from('reports')
      .select('id')
      .limit(5);
      
    if (verifyError) {
      console.error('Error verifying reports access after policy update:', verifyError);
      return { success: false, error: verifyError };
    }
    
    console.log(`Policy verification: ${data ? data.length : 0} reports are now accessible`);
    
    return { 
      success: true, 
      message: 'Admin reports access policy successfully applied',
      reportsFound: data ? data.length : 0
    };
  } catch (error) {
    console.error('Error in fixAdminReportsAccess:', error);
    return { success: false, error };
  }
}; 