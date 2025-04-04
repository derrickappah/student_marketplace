import { supabase } from './supabase';

/**
 * Helper function for logging admin actions (to be used across admin components)
 */
export const logAdminAction = async (actionType, details, targetId = null, targetType = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Cannot log action: No authenticated user');
      return;
    }
    
    const { error } = await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action_type: actionType,
      details: details,
      target_id: targetId,
      target_type: targetType,
      ip_address: '127.0.0.1', // In a real app, you'd get this from the server
      created_at: new Date().toISOString()
    });
    
    if (error) {
      console.error('Error logging admin action:', error);
    }
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}; 