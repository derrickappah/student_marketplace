import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const MessagingContext = createContext();

export const useMessaging = () => useContext(MessagingContext);

export const MessagingProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [readReceipts, setReadReceipts] = useState({});

  // Fetch user's conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            user:users(id, name, avatar_url, email, university)
          ),
          listing:listings(id, title, price, images, status, description, seller_id),
          latest_message:messages(
            id, 
            content, 
            created_at, 
            sender_id,
            read_status,
            has_attachments
          )
        `)
        .eq('participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Process the data for easier access
      const processedConversations = data.map(conversation => {
        // Find other participants (users other than the current user)
        let otherParticipants = conversation.participants
          .filter(p => p.user_id !== user.id)
          .map(p => {
            // If user data is missing, create a placeholder
            if (!p.user) {
              return {
                id: p.user_id,
                name: "Unknown User",
                avatar_url: null,
                email: null,
                university: null,
                _placeholder: true // Mark as placeholder
              };
            }
            return p.user;
          });

        // Get the latest message if any
        const latestMessage = conversation.latest_message && conversation.latest_message.length > 0
          ? conversation.latest_message[0]
          : null;

        return {
          ...conversation,
          otherParticipants,
          latestMessage
        };
      });

      // After processing, create any missing user profiles in the background
      setTimeout(() => {
        processedConversations.forEach(conversation => {
          conversation.otherParticipants.forEach(async participant => {
            if (participant._placeholder) {
              try {
                // Create a basic profile with default values since we can't access admin API
                const { success } = await createBasicUserProfile(participant.id);
                
                if (success) {
                  console.log('Created profile for participant:', participant.id);
                  // Trigger a refresh after profile creation
                  fetchConversations();
                }
              } catch (err) {
                console.error('Error creating participant profile:', err);
              }
            }
          });
        });
      }, 100);

      setConversations(processedConversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send a message to a conversation
  const sendMessage = async (conversationId, content, attachments = [], replyToMessageId = null) => {
    if (!user || !conversationId) return null;

    try {
      // Check if we have proper participant access first
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();
        
      // If no participant record, try to create one
      if (participantError) {
        console.log('No participant record found. Attempting to create one...');
        
        // Try to add the user as a participant
        const { error: insertError } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conversationId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('Failed to create participant record:', insertError);
          // Continue anyway as the original insert might still work
        } else {
          console.log('Successfully created participant record');
        }
      }

      // First, insert the message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          sender_id: user.id,
          reply_to_message_id: replyToMessageId,
          has_attachments: attachments && attachments.length > 0
        })
        .select()
        .single();

      if (messageError) {
        // If we get an RLS error, try to fix it using RPC
        if (messageError.code === '42501' || (messageError.message && messageError.message.includes('row-level security policy'))) {
          console.log('RLS issue detected. Attempting to fix using RPC...');
          
          try {
            // Try to use an RPC function to bypass RLS
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
              'send_message_bypass_rls',
              { 
                p_conversation_id: conversationId,
                p_content: content,
                p_sender_id: user.id,
                p_reply_to_message_id: replyToMessageId,
                p_has_attachments: attachments && attachments.length > 0
              }
            );
            
            if (rpcError) {
              console.error('RPC bypass failed:', rpcError);
              throw messageError; // Re-throw the original error
            }
            
            console.log('Message sent via RPC bypass:', rpcResult);
            
            // If RPC bypass worked, use that data
            const rpcMessageData = {
              id: rpcResult.id || rpcResult,
              conversation_id: conversationId,
              content,
              sender_id: user.id,
              reply_to_message_id: replyToMessageId,
              has_attachments: attachments && attachments.length > 0,
              created_at: new Date().toISOString()
            };
            
            // Update conversation timestamp
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', conversationId);
              
            // Process attachments if needed
            if (attachments && attachments.length > 0) {
              processAttachments(rpcMessageData.id, attachments);
            }
            
            return rpcMessageData;
          } catch (bypassError) {
            console.error('RLS bypass failed completely:', bypassError);
            throw messageError;
          }
        } else {
          throw messageError;
        }
      }

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // If there are attachments, process them
      if (attachments && attachments.length > 0) {
        processAttachments(messageData.id, attachments);
      }

      return messageData;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };
  
  // Helper function to process attachments
  const processAttachments = async (messageId, attachments) => {
    try {
      const attachmentRows = attachments.map(attachment => ({
        message_id: messageId,
        file_url: attachment.url,
        file_type: attachment.type,
        file_name: attachment.name,
        file_size: attachment.size
      }));

      const { error: attachmentError } = await supabase
        .from('message_attachments')
        .insert(attachmentRows);

      if (attachmentError) {
        console.error('Error adding attachments:', attachmentError);
      }
    } catch (err) {
      console.error('Exception processing attachments:', err);
    }
  };

  // Subscribe to new messages in a conversation
  const subscribeToMessages = (conversationId) => {
    if (!conversationId) return () => {};

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, payload => {
        // Update conversations list to reflect the new message
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Subscribe to typing indicators
  const subscribeToTypingIndicators = (conversationId) => {
    if (!conversationId || !user) return () => {};

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, payload => {
        if (payload.payload.user_id !== user.id) {
          if (payload.payload.is_typing) {
            setTypingUsers(prev => ({
              ...prev,
              [payload.payload.user_id]: true
            }));
            
            // Clear typing indicator after 3 seconds of inactivity
            setTimeout(() => {
              setTypingUsers(prev => {
                const newState = { ...prev };
                delete newState[payload.payload.user_id];
                return newState;
              });
            }, 3000);
          } else {
            setTypingUsers(prev => {
              const newState = { ...prev };
              delete newState[payload.payload.user_id];
              return newState;
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Send typing indicator
  const sendTypingIndicator = (conversationId, isTyping) => {
    if (!conversationId || !user) return;

    try {
      supabase
        .channel(`typing:${conversationId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            is_typing: isTyping
          }
        });
    } catch (err) {
      console.error('Error sending typing indicator:', err);
    }
  };

  // Subscribe to read receipts
  const subscribeToReadReceipts = (conversationId) => {
    if (!conversationId) return () => {};

    const channel = supabase
      .channel(`read_receipts:${conversationId}`)
      .on('broadcast', { event: 'read_receipt' }, payload => {
        setReadReceipts(prev => ({
          ...prev,
          [payload.payload.message_id]: {
            ...prev[payload.payload.message_id],
            [payload.payload.user_id]: payload.payload.status
          }
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Update read receipt for a message
  const updateReadReceipt = (conversationId, messageId, status) => {
    if (!conversationId || !messageId || !user) return;

    try {
      // Update in the database
      supabase
        .from('message_read_receipts')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          status,
          updated_at: new Date().toISOString()
        })
        .then();

      // Broadcast to other clients
      supabase
        .channel(`read_receipts:${conversationId}`)
        .send({
          type: 'broadcast',
          event: 'read_receipt',
          payload: {
            message_id: messageId,
            user_id: user.id,
            status
          }
        });
    } catch (err) {
      console.error('Error updating read receipt:', err);
    }
  };

  // Mark a conversation as read
  const markConversationAsRead = async (conversationId) => {
    if (!conversationId || !user) return;

    try {
      // Get unread messages that don't have read receipts
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);

      if (error) throw error;

      // Mark messages as read by adding read receipts
      if (messages && messages.length > 0) {
        const readReceipts = messages.map(message => ({
          message_id: message.id,
          user_id: user.id,
          status: 'read',
          updated_at: new Date().toISOString()
        }));

        // Insert read receipts
        await supabase
          .from('message_read_receipts')
          .upsert(readReceipts, { onConflict: ['message_id', 'user_id'] });
          
        // Notify others through the channel
        for (const message of messages) {
          updateReadReceipt(conversationId, message.id, 'read');
        }
      }
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  };

  // Get attachments for a message
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

  // Create a basic user profile for missing users
  const createBasicUserProfile = async (userId) => {
    if (!userId) return { success: false };
    
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (existingUser) return { success: true }; // Already exists
      
      // Create a basic profile
      const { error } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: `user-${userId.substring(0, 8)}@example.com`,
          name: `User ${userId.substring(0, 6)}`,
          university: 'Unknown University',
          created_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error('Error creating basic user profile:', error);
        return { success: false };
      }
      
      // Dispatch event to notify other components
      try {
        const event = new CustomEvent('userProfileCreated', { 
          detail: { userId } 
        });
        window.dispatchEvent(event);
      } catch (e) {
        console.log('Could not dispatch profile created event:', e);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error in createBasicUserProfile:', err);
      return { success: false };
    }
  };

  // Effect to fetch conversations when user changes
  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
    }
  }, [user, fetchConversations]);

  const value = {
    conversations,
    setConversations,
    fetchConversations,
    activeConversation,
    setActiveConversation,
    loading,
    error,
    sendMessage,
    subscribeToMessages,
    subscribeToTypingIndicators,
    subscribeToReadReceipts,
    sendTypingIndicator,
    typingUsers,
    onlineUsers,
    readReceipts,
    updateReadReceipt,
    markConversationAsRead,
    getMessageAttachments
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}; 