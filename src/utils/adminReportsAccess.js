import { supabase } from './supabaseClient';
import fs from 'fs';
import path from 'path';

/**
 * Applies the admin access policy for reports
 * This fixes the issue where admins cannot see reports in the Reports Management page
 */
export const fixAdminReportsAccess = async () => {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src/sql/add_admin_reports_access.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL as the service role (admin)
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying admin reports access policy:', error);
      return { success: false, error };
    }
    
    console.log('Admin reports access policy successfully applied');
    return { success: true };
  } catch (error) {
    console.error('Error in fixAdminReportsAccess:', error);
    return { success: false, error };
  }
};

/**
 * Check if the current user has admin access to reports
 */
export const checkAdminReportsAccess = async () => {
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Error checking admin reports access:', error);
      return { hasAccess: false, error };
    }
    
    return { hasAccess: true };
  } catch (error) {
    console.error('Error in checkAdminReportsAccess:', error);
    return { hasAccess: false, error };
  }
}; 