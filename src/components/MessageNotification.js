import React, { useState, useEffect } from 'react';
import { 
  Snackbar, 
  Alert, 
  Avatar, 
  Box, 
  Typography, 
  Button 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../services/supabase";

/**
 * Component to show real-time notifications when new messages are received
 */
const MessageNotification = ({ userId, conversations }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    // Listen for new messages via Supabase realtime
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          handleNewMessage(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleNewMessage = async (newMessage) => {
    // Find the conversation this message belongs to
    const conversation = conversations.find(
      (conv) => conv.id === newMessage.conversation_id
    );

    if (conversation) {
      const senderName = userId === conversation.buyer_id
        ? conversation.seller_name
        : conversation.buyer_name;

      const senderAvatar = userId === conversation.buyer_id
        ? conversation.seller_avatar
        : conversation.buyer_avatar;

      setMessage({
        id: newMessage.id,
        senderId: newMessage.sender_id,
        senderName,
        senderAvatar,
        content: newMessage.content,
        conversationId: newMessage.conversation_id,
        timestamp: new Date(newMessage.created_at),
      });

      setOpen(true);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleClick = () => {
    if (message) {
      navigate(`/messages/${message.conversationId}`);
      setOpen(false);
    }
  };

  if (!message) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity="info"
        variant="filled"
        sx={{ 
          width: '100%', 
          bgcolor: 'primary.main',
          '& .MuiAlert-icon': {
            color: 'white',
          },
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
        icon={false}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar 
            src={message.senderAvatar || ''} 
            alt={message.senderName}
            sx={{ 
              width: 32, 
              height: 32, 
              mr: 1.5,
              border: '2px solid white',
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="white" fontWeight="bold">
              {message.senderName}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        </Box>
        
        <Typography 
          variant="body2" 
          color="white" 
          sx={{ 
            mb: 1.5,
            wordBreak: 'break-word',
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {message.content}
        </Typography>
        
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={handleClick}
          sx={{ 
            borderColor: 'rgba(255,255,255,0.5)',
            color: 'white',
            '&:hover': {
              borderColor: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
            }
          }}
        >
          View Message
        </Button>
      </Alert>
    </Snackbar>
  );
};

export default MessageNotification; 