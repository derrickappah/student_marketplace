import { supabase } from './supabase';

/**
 * Creates a system notification for a user
 * 
 * @param {Object} notification - The notification object
 * @param {string} notification.userId - The ID of the user to notify
 * @param {string} notification.message - The notification message
 * @param {string} notification.type - The notification type (message, offer, offer_response, review, listing_status, promotion, system)
 * @param {string} [notification.listingId] - Optional listing ID
 * @param {string} [notification.offerId] - Optional offer ID
 * @param {string} [notification.conversationId] - Optional conversation ID
 * @param {string} [notification.relatedId] - Optional related ID for generic references
 * @param {string} [notification.senderId] - Optional sender ID for tracking who sent the notification
 * @returns {Promise<Object>} - Result of the operation
 */
export const createSystemNotification = async (notification) => {
  try {
    // Validate required fields
    if (!notification.userId || !notification.message || !notification.type) {
      throw new Error('Required fields missing for notification');
    }

    console.log('Creating notification:', notification);

    // Try to use the RPC function first (bypasses RLS)
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_system_notification', {
      p_user_id: notification.userId,
      p_message: notification.message,
      p_type: notification.type,
      p_listing_id: notification.listingId || null,
      p_offer_id: notification.offerId || null,
      p_conversation_id: notification.conversationId || null,
      p_related_id: notification.relatedId || null
    });

    // If RPC function exists and succeeds, return success
    if (!rpcError) {
      return { success: true, data: rpcData };
    }

    // If RPC function fails with "function does not exist", fall back to direct insert
    if (rpcError && rpcError.message && rpcError.message.includes('function does not exist')) {
      console.warn('RPC function not available, falling back to direct insert');
      
      // Create the notification with properly structured data
      const notificationData = {
        user_id: notification.userId,
        message: notification.message,
        type: notification.type,
        read: false,
        created_at: new Date().toISOString()
      };

      // Add optional fields if they exist
      if (notification.listingId) notificationData.listing_id = notification.listingId;
      if (notification.offerId) notificationData.offer_id = notification.offerId;
      if (notification.conversationId) notificationData.conversation_id = notification.conversationId;
      if (notification.relatedId) notificationData.related_id = notification.relatedId;
      if (notification.senderId) notificationData.sender_id = notification.senderId;

      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData]);

      if (error) {
        console.error('Error creating system notification:', error);
        throw error;
      }

      return { success: true, data };
    } else {
      // If RPC error is not about function existence, throw it
      console.error('Error creating system notification via RPC:', rpcError);
      throw rpcError;
    }
  } catch (error) {
    console.error('Error in createSystemNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Creates a rich notification for a message with preview content
 * 
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - The ID of the user to notify
 * @param {string} params.senderId - The ID of the user sending the message
 * @param {string} params.senderName - The name of the sender
 * @param {string} params.message - The message content
 * @param {string} params.conversationId - The conversation ID
 * @param {string} [params.listingId] - Optional listing ID related to the conversation
 * @returns {Promise<Object>} - Result of the operation
 */
export const createMessageNotification = async ({ userId, senderId, senderName, message, conversationId, listingId }) => {
  try {
    // Don't create notifications for messages to yourself
    if (userId === senderId) {
      return { success: true, message: 'No notification needed for messages to self' };
    }
    
    // Create preview by truncating message
    const preview = message.length > 50 ? `${message.substring(0, 47)}...` : message;
    
    // Use RPC function if available
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_message_notification', {
      receiver_id: userId,
      sender_id: senderId,
      message_content: message,
      conversation_id: conversationId,
      listing_id: listingId || null
    });
    
    if (!rpcError) {
      return { success: true, data: rpcData };
    }
    
    // Fall back to direct insert
    if (rpcError.message && rpcError.message.includes('function does not exist')) {
      console.warn('RPC function not available, falling back to direct insert');
      
      const notificationData = {
        user_id: userId,
        sender_id: senderId,
        type: 'message',
        message: `New message from ${senderName || 'someone'}`,
        preview: preview,
        read: false,
        is_seen: false,
        conversation_id: conversationId,
        created_at: new Date().toISOString()
      };
      
      if (listingId) notificationData.listing_id = listingId;
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData]);
        
      if (error) {
        console.error('Error creating message notification:', error);
        throw error;
      }
      
      return { success: true, data };
    }
    
    throw rpcError;
  } catch (error) {
    console.error('Error in createMessageNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gets notifications for the current user
 * 
 * @param {Object} options - Query options
 * @param {number} [options.limit=20] - The maximum number of notifications to return
 * @param {number} [options.page=1] - The page number
 * @param {boolean} [options.unreadOnly=false] - Whether to only return unread notifications
 * @returns {Promise<Object>} - The user's notifications
 */
export const getUserNotifications = async ({ limit = 20, page = 1, unreadOnly = false }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:sender_id (id, name, avatar_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (unreadOnly) {
      query = query.eq('read', false);
    }
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('read', unreadOnly ? false : null);
      
    if (countError) {
      console.error('Error getting notification count:', countError);
    }
    
    return { 
      data, 
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit) 
    };
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return { 
      data: [], 
      count: 0,
      page,
      limit,
      totalPages: 0,
      error: error.message 
    };
  }
};

/**
 * Subscribe to real-time notifications
 * 
 * @param {string} userId - The user ID to subscribe for
 * @param {Function} onInsert - Callback for new notifications
 * @param {Function} onUpdate - Callback for updated notifications
 * @returns {Object} - Subscription object with unsubscribe method
 */
export const subscribeToNotifications = (userId, onInsert, onUpdate) => {
  if (!userId) {
    console.error('Cannot subscribe without a user ID');
    return null;
  }
  
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, async (payload) => {
      console.log('Received new notification:', payload);
      
      // If sender_id is set, fetch sender info
      if (payload.new.sender_id) {
        try {
          const { data: sender, error } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();
            
          if (!error && sender) {
            payload.new.sender = sender;
          }
        } catch (err) {
          console.error('Error fetching sender info:', err);
        }
      }
      
      if (onInsert) onInsert(payload.new);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      console.log('Notification updated:', payload);
      if (onUpdate) onUpdate(payload.new);
    })
    .subscribe((status) => {
      console.log('Notification subscription status:', status);
    });
    
  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
};

/**
 * Marks a notification as read
 * 
 * @param {string} notificationId - The ID of the notification to mark as read
 * @returns {Promise<Object>} - Result of the operation
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);
      
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Marks all notifications as read for the current user
 * 
 * @returns {Promise<Object>} - Result of the operation
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
      
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark notifications for a conversation as seen
 * 
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} - Result of the operation
 */
export const markConversationNotificationsSeen = async (conversationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !conversationId) {
      throw new Error('User not authenticated or missing conversation ID');
    }
    
    // Try to use RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc('mark_conversation_notifications_seen', {
      user_uuid: user.id,
      conv_id: conversationId
    });
    
    if (!rpcError) {
      return { success: true, data: rpcData };
    }
    
    // Fall back to direct update
    if (rpcError.message && rpcError.message.includes('function does not exist')) {
      console.warn('RPC function not available, falling back to direct update');
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_seen: true })
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .eq('is_seen', false);
        
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    }
    
    throw rpcError;
  } catch (error) {
    console.error('Error marking conversation notifications as seen:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a notification
 * 
 * @param {string} notificationId - The ID of the notification to delete
 * @returns {Promise<Object>} - Result of the operation
 */
export const deleteNotification = async (notificationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);
      
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error.message };
  }
}; 