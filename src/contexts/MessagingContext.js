import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

// Message status constants
const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

// Create messaging context
const MessagingContext = createContext();

// Custom hook to use the messaging context
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

// Throttle function to limit how often a function can be called
const throttle = (func, delay) => {
  let lastCall = 0;
  let timeoutId = null;
  let lastArgs = null;
  
  const executeFunc = () => {
    lastCall = Date.now();
    func(...lastArgs);
    timeoutId = null;
  };
  
  return (...args) => {
    lastArgs = args;
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      executeFunc();
    } else if (!timeoutId) {
      timeoutId = setTimeout(executeFunc, remaining);
    }
  };
};

// Messaging provider component
export const MessagingProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State for conversations
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [readReceipts, setReadReceipts] = useState({});
  const [networkStatus, setNetworkStatus] = useState('online');
  
  // Throttled version of setConversations to prevent too many updates
  const throttledSetConversations = useCallback(
    throttle((newConversations) => {
      setConversations(newConversations);
    }, 300), // Throttle to 300ms
    []
  );

  // Fetch user's conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // First, find all conversation IDs where the user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);
        
      if (participantError) throw participantError;
      
      if (!participantData || participantData.length === 0) {
        throttledSetConversations([]);
        setLoading(false);
        return;
      }
      
      // Extract conversation IDs
      const conversationIds = participantData.map(p => p.conversation_id);
      
      // Fetch those conversations with related data
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            user:users(id, name, avatar_url, email)
          ),
          messages:messages(
            id, 
            content, 
            created_at, 
            sender_id,
            has_attachments
          )
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Process conversations data
      const processedConversations = data.map(conversation => {
        // Filter out current user from participants
        const otherParticipants = conversation.participants
          .filter(p => p.user && p.user_id !== user.id)
          .map(p => p.user);
        
        // Get the latest message
        const messages = conversation.messages || [];
        const latestMessage = messages.length > 0 
          ? messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] 
          : null;

        // Calculate unread count - since we don't have status, we'll count all messages 
        // from others as potentially unread (this is simplified)
        const unreadCount = messages.filter(
          msg => msg.sender_id !== user.id
        ).length;

        return {
          ...conversation,
          otherParticipants,
          last_message: latestMessage,
          unreadCount
        };
      });

      // Use throttled update to prevent flickering
      throttledSetConversations(processedConversations);
      
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user, throttledSetConversations]);
  
  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      fetchConversations();
      
      // Subscribe to online presence
      subscribeToOnlinePresence();
    } else {
      setConversations([]);
      setActiveConversation(null);
    }
  }, [user, fetchConversations]);
  
  // Subscribe to online presence
  const subscribeToOnlinePresence = () => {
    if (!user) return () => {};
    
    const presenceChannel = supabase.channel('online-users');
    
    // Track online status
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = {};
        const presentUsers = presenceChannel.presenceState();
        
        Object.keys(presentUsers).forEach(userId => {
          newState[userId] = true;
        });
        
        setOnlineUsers(newState);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Broadcast this user's presence
          await presenceChannel.track({ 
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });
    
    return () => {
      presenceChannel.unsubscribe();
    };
  };
  
  // Mark a conversation as read (simplified since we don't have status)
  const markConversationAsRead = async (conversationId) => {
    if (!user || !conversationId) return;
    
    // Just update the local state since we can't mark messages as read in DB
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 } 
          : conv
      )
    );
    
    // Store read receipt in local state
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation && conversation.messages?.length > 0) {
      // Mark all messages as read in local state
      conversation.messages.forEach(msg => {
        if (msg.sender_id !== user.id) {
          setReadReceipts(prev => ({
            ...prev,
            [msg.id]: MESSAGE_STATUS.READ
          }));
        }
      });
    }
  };
  
  // Send a message
  const sendMessage = async (conversationId, content, attachments = []) => {
    if (!user || !conversationId || (!content.trim() && attachments.length === 0)) return null;
    
    try {
      // Create message record
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          has_attachments: attachments.length > 0
        })
        .select()
        .single();

      if (messageError) throw messageError;
      
      // If there are attachments, save them
      if (attachments.length > 0) {
        // Process each attachment
        for (const attachment of attachments) {
          if (attachment.file) {
            // Upload file to storage
            const filePath = `message_attachments/${messageData.id}/${attachment.name}`;
            const { error: uploadError } = await supabase.storage
              .from('attachments')
              .upload(filePath, attachment.file);
            
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('attachments')
              .getPublicUrl(filePath);
              
            // Save attachment metadata
            const { error: attachmentError } = await supabase
              .from('message_attachments')
              .insert({
                message_id: messageData.id,
                file_name: attachment.name,
                file_size: attachment.size,
                file_type: attachment.type,
                file_url: urlData.publicUrl
              });
            
            if (attachmentError) throw attachmentError;
          }
        }
      }

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Return the created message
      return {
        ...messageData,
        sender: { id: user.id },
        status: MESSAGE_STATUS.SENT, // Add status in our local representation
        attachments: attachments.map(att => ({
          id: `temp-${Date.now()}-${att.name}`,
          name: att.name,
          type: att.type,
          size: att.size,
          url: att.url
        }))
      };
    } catch (err) {
      console.error('Error sending message:', err);
      return null;
    }
  };
  
  // Get message attachments
  const getMessageAttachments = async (messageId) => {
    if (!messageId) return [];
    
    try {
      const { data, error } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('message_id', messageId);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching message attachments:', err);
      return [];
    }
  };
  
  // Update read receipt for a message (only in local state since we can't update DB)
  const updateReadReceipt = async (conversationId, messageId, status) => {
    if (!user || !messageId || !status) return;
    
    // Store only in local state
    setReadReceipts(prev => ({
      ...prev,
      [messageId]: status
    }));
    
    // If status is 'read', update local unread count
    if (status === MESSAGE_STATUS.READ) {
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.id === conversationId) {
            // Reduce unread count if it's greater than 0
            const unreadCount = Math.max(0, (conv.unreadCount || 0) - 1);
            return { ...conv, unreadCount };
          }
          return conv;
        })
      );
    }
  };
  
  // Subscribe to new messages with optimized state updates
  const subscribeToMessages = (conversationId) => {
    if (!conversationId) return () => {};

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (payload.new) {
          // Update conversation state efficiently, without causing flickering
          // Only add the message to the conversation optimistically if it's from the current user
          if (payload.new.sender_id === user.id) {
            return; // Current user's messages are already handled in sendMessage
          }

          // Update conversations with optimistic rendering
          setConversations(prevConversations => {
            // Find the affected conversation
            const updatedConversations = prevConversations.map(conv => {
              if (conv.id === conversationId) {
                // Prepare updated conversation
                const updatedConversation = {
                  ...conv,
                  updated_at: new Date().toISOString(),
                  last_message: {
                    ...payload.new,
                    created_at: payload.new.created_at || new Date().toISOString()
                  }
                };
                
                // Update unread count only if this is not the active conversation
                if (activeConversation?.id !== conversationId) {
                  updatedConversation.unreadCount = (conv.unreadCount || 0) + 1;
                }
                
                return updatedConversation;
              }
              return conv;
            });
            
            // Sort to ensure most recent conversations appear at the top
            return updatedConversations.sort((a, b) => 
              new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
            );
          });
          
          // Update message status in local state
          updateReadReceipt(conversationId, payload.new.id, MESSAGE_STATUS.DELIVERED);
          
          // If this is the active conversation, mark as read immediately
          if (activeConversation && activeConversation.id === conversationId) {
            updateReadReceipt(conversationId, payload.new.id, MESSAGE_STATUS.READ);
          }
          
          // If the sender is in the typing users, remove them
          if (typingUsers[payload.new.sender_id]) {
            setTypingUsers(prev => {
              const newState = { ...prev };
              delete newState[payload.new.sender_id];
              return newState;
            });
          }
        }
      })
      .subscribe();

    // Return an unsubscribe function
    return () => {
      channel.unsubscribe();
    };
  };

  // Send typing indicator
  const sendTypingIndicator = (conversationId, isTyping) => {
    if (!user || !conversationId) return;

    supabase.channel('typing-channel')
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
          conversation_id: conversationId,
            user_id: user.id,
            is_typing: isTyping
          }
        });
  };

  // Subscribe to typing indicators
  const subscribeToTypingIndicators = (conversationId) => {
    if (!conversationId) return () => {};

    const channel = supabase.channel('typing-channel')
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload && payload.payload.conversation_id === conversationId) {
          const { user_id, is_typing } = payload.payload;
          
          // Skip if it's the current user
          if (user_id === user.id) return;
          
          // Update typing users state
          setTypingUsers(prev => {
            if (is_typing) {
              return { ...prev, [user_id]: true };
            } else {
              const newState = { ...prev };
              delete newState[user_id];
              return newState;
            }
          });
        }
      })
      .subscribe();

    // Return an unsubscribe function
    return () => {
      channel.unsubscribe();
    };
  };
  
  // Subscribe to read receipts - we can't do this without status field
  // This is now a no-op function that just returns unsubscribe function
  const subscribeToReadReceipts = (conversationId) => {
    return () => {};
  };
  
  // Context value
  const value = {
    conversations,
    activeConversation,
    setActiveConversation,
    loading,
    error,
    typingUsers,
    onlineUsers,
    readReceipts,
    networkStatus,
    setNetworkStatus,
    fetchConversations,
    markConversationAsRead,
    sendMessage,
    subscribeToMessages,
    sendTypingIndicator,
    subscribeToTypingIndicators,
    subscribeToReadReceipts,
    updateReadReceipt,
    getMessageAttachments
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}; 

export default MessagingContext; 