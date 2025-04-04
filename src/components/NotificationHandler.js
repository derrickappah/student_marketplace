import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getConversations } from "../services/supabase";
import MessageNotification from './MessageNotification';

/**
 * Real-time notification handler for messages and other notifications
 * This component will periodically check for new messages and display notifications
 */
const NotificationHandler = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);

  // Fetch conversations for notifications when user logs in
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const { data, error } = await getConversations();
        if (error) throw error;
        setConversations(data || []);
      } catch (err) {
        console.error('Error loading conversations for notifications:', err);
      }
    };

    fetchConversations();
    
    // Refresh conversations periodically
    const intervalId = setInterval(fetchConversations, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [user]);

  if (!user) return null;

  return (
    <MessageNotification 
      userId={user.id} 
      conversations={conversations} 
    />
  );
};

export default NotificationHandler; 