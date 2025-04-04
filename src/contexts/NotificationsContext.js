import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from "../services/supabase";

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [badgeCounts, setBadgeCounts] = useState({ total: 0, messages: 0, offers: 0, other: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notification badges with types counts
  const fetchBadgeCounts = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching badge counts for user:', user.id);
      
      const { data: result, error } = await supabase.rpc(
        'get_notification_badges',
        { user_uuid: user.id }
      );
      
      if (error) {
        console.error('Error fetching notification badges:', error);
        
        // Try querying the notifications table directly as a fallback
        console.log('Trying direct query as fallback...');
        const { data: notifs, error: notifError } = await supabase
          .from('notifications')
          .select('id, type, read')
          .eq('user_id', user.id);
          
        if (notifError) {
          console.error('Fallback query also failed:', notifError);
          return;
        }
        
        // Calculate counts manually
        if (notifs) {
          const unreadNotifs = notifs.filter(n => !n.read);
          const messageCount = unreadNotifs.filter(n => n.type === 'message').length;
          const offerCount = unreadNotifs.filter(n => 
            n.type === 'offer' || n.type === 'offer_response'
          ).length;
          const otherCount = unreadNotifs.filter(n => 
            n.type !== 'message' && n.type !== 'offer' && n.type !== 'offer_response'
          ).length;
          
          const newCounts = {
            total: unreadNotifs.length,
            messages: messageCount,
            offers: offerCount,
            other: otherCount
          };
          
          console.log('Fallback counts calculated:', newCounts);
          setBadgeCounts(newCounts);
          setUnreadCount(unreadNotifs.length);
        }
        return;
      }
      
      console.log('Raw notification badge response:', result);
      
      if (result && result.success) {
        const newCounts = {
          total: result.total || 0,
          messages: result.messages || 0,
          offers: result.offers || 0,
          other: result.other || 0
        };
        
        console.log('NotificationsProvider: Badge counts updated', newCounts);
        
        // Only update state if the counts have actually changed
        setBadgeCounts(prev => {
          const hasChanged = 
            prev.total !== newCounts.total || 
            prev.messages !== newCounts.messages ||
            prev.offers !== newCounts.offers ||
            prev.other !== newCounts.other;
            
          if (hasChanged) {
            console.log('Badge counts changed, updating state');
            return newCounts;
          }
          
          console.log('Badge counts unchanged, keeping current state');
          return prev;
        });
        
        setUnreadCount(result.total || 0);
      } else {
        console.error('Failed to get notification badges. Response:', result);
      }
    } catch (err) {
      console.error('Exception in fetchBadgeCounts:', err);
    }
  };

  useEffect(() => {
    console.log('NotificationsProvider: User state changed', user?.id);
    
    if (!user) {
      console.log('NotificationsProvider: No user, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
      setBadgeCounts({ total: 0, messages: 0, offers: 0, other: 0 });
      setLoading(false);
      return;
    }

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        console.log('NotificationsProvider: Fetching notifications for user', user.id);
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            *,
            sender:sender_id (id, name, avatar_url)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('NotificationsProvider: Error fetching notifications', error);
          setError(error.message);
          throw error;
        }

        console.log('NotificationsProvider: Fetched notifications', data?.length || 0);
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
        
        // Fetch badge counts after notifications are loaded
        await fetchBadgeCounts();
      } catch (err) {
        console.error('NotificationsProvider: Error fetching notifications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    console.log('NotificationsProvider: Setting up realtime subscription for user', user.id);
    const subscription = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, async (payload) => {
        console.log('NotificationsProvider: Received new notification via subscription', payload);
        
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
        
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Update badge counts
        await fetchBadgeCounts();
        
        // Show browser notification if supported and page is not visible
        if (document.visibilityState !== 'visible' && 'Notification' in window) {
          try {
            if (Notification.permission === 'granted') {
              const notifTitle = payload.new.type === 'message' 
                ? 'New Message'
                : 'New Notification';
                
              const notifOptions = {
                body: payload.new.message,
                icon: '/logo192.png', // Ensure this path is correct
                badge: '/logo192.png',
                tag: payload.new.id // Use ID as tag to prevent duplicates
              };
              
              new Notification(notifTitle, notifOptions);
            }
            else if (Notification.permission !== 'denied') {
              Notification.requestPermission();
            }
          } catch (err) {
            console.error('Error showing browser notification:', err);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        console.log('NotificationsProvider: Notification updated via subscription', payload);
        setNotifications(prev => 
          prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n)
        );
        // Refetch badge counts when notifications are marked as read
        fetchBadgeCounts();
      })
      .subscribe((status) => {
        console.log('NotificationsProvider: Subscription status:', status);
      });

    return () => {
      console.log('NotificationsProvider: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [user]);

  // Request notification permission when provider is mounted
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      console.log('Requesting notification permission');
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      // Update unread count and badge counts
      await fetchBadgeCounts();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      
      // Clear all badges
      setUnreadCount(0);
      setBadgeCounts({ total: 0, messages: 0, offers: 0, other: 0 });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const markConversationNotificationsSeen = async (conversationId) => {
    if (!user || !conversationId) return;
    
    try {
      // Call the RPC function
      const { data, error } = await supabase.rpc(
        'mark_conversation_notifications_seen',
        {
          user_uuid: user.id,
          conv_id: conversationId
        }
      );
      
      if (error) {
        console.error('Error marking conversation notifications as seen:', error);
        return;
      }
      
      // Update local state to reflect changes
      setNotifications(prev => 
        prev.map(n => 
          n.conversation_id === conversationId 
            ? { ...n, is_seen: true } 
            : n
        )
      );
      
      console.log('Marked conversation notifications as seen:', data);
    } catch (err) {
      console.error('Exception in markConversationNotificationsSeen:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update badge counts if needed
      if (deletedNotification && !deletedNotification.read) {
        await fetchBadgeCounts();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Get new (unseen) notifications for a specific conversation
  const getConversationNotifications = (conversationId) => {
    if (!conversationId) return [];
    
    return notifications.filter(
      n => n.conversation_id === conversationId && n.type === 'message' && !n.is_seen
    );
  };

  // Debug notifications
  const debugNotifications = () => {
    console.log('Current notifications state:', {
      user: user?.id,
      notificationsCount: notifications.length,
      unreadCount,
      badgeCounts,
      loading,
      error,
      notifications
    });
    
    // Try to fetch notifications again
    if (user) {
      console.log('Attempting to re-fetch notifications...');
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          console.log('Debug fetch result:', { data, error });
        });
      
      // Try to fetch badge counts as well
      fetchBadgeCounts();
    }
  };

  const value = {
    notifications,
    unreadCount,
    badgeCounts,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markConversationNotificationsSeen,
    getConversationNotifications,
    debugNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext; 