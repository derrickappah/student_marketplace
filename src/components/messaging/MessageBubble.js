import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  CircularProgress
} from '@mui/material';
import { UserAvatar } from './';
import SafeImage from './SafeImage';
import { useMessaging } from '../../contexts/MessagingContext';

// Message status constants
const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

/**
 * MessageBubble component displays an individual message in a conversation
 * 
 * @param {Object} props
 * @param {Object} props.message - The message object to display
 * @param {boolean} props.isCurrentUser - Whether the message was sent by the current user
 * @param {string} props.status - The message status (sending, sent, delivered, read, failed)
 */
const MessageBubble = ({
  message,
  isCurrentUser = false, 
  status = MESSAGE_STATUS.SENT
}) => {
  const { readReceipts } = useMessaging();
  
  if (!message) return null;
  
  // Get message status from context if available
  const messageStatus = readReceipts[message.id] || status || MESSAGE_STATUS.SENT;
  
  // Format the timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render the appropriate status indicator
  const renderStatus = () => {
    if (!isCurrentUser) return null;

    switch (messageStatus) {
      case MESSAGE_STATUS.SENDING:
        return <CircularProgress size={12} thickness={2} sx={{ ml: 0.5 }} />;
      case MESSAGE_STATUS.SENT:
        return <Typography variant="caption" color="text.secondary">✓</Typography>;
      case MESSAGE_STATUS.DELIVERED:
        return <Typography variant="caption" color="text.secondary">✓✓</Typography>;
      case MESSAGE_STATUS.READ:
        return <Typography variant="caption" color="primary">✓✓</Typography>;
      case MESSAGE_STATUS.FAILED:
        return <Typography variant="caption" color="error">!</Typography>;
      default:
        return null;
    }
  };
  
  // Get sender information
  const sender = message.sender || {};
  
  // Check if the message has attachments
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isCurrentUser ? 'row-reverse' : 'row',
        mb: 1.5,
        alignItems: 'flex-end',
      }}
    >
      {!isCurrentUser && (
        <UserAvatar
          user={sender}
          size={32}
          sx={{ mr: 1 }}
        />
      )}

      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 2,
          maxWidth: '70%',
          bgcolor: isCurrentUser ? 'primary.main' : 'background.paper',
          color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
          borderTopRightRadius: isCurrentUser ? 0 : 2,
          borderTopLeftRadius: !isCurrentUser ? 0 : 2,
        }}
      >
        {!isCurrentUser && (
          <Typography variant="caption" component="div" color="text.secondary" fontWeight="medium">
            {sender.name || 'Unknown User'}
          </Typography>
        )}

        {hasAttachments && (
          <Box sx={{ mb: message.content ? 1.5 : 0 }}>
            {message.attachments.map((attachment, index) => {
              // Clean up URLs if they're comma-separated
              let attachmentUrl = attachment.url;
              if (attachmentUrl && attachmentUrl.includes(',http')) {
                attachmentUrl = attachmentUrl.split(',')[0]; // Take just the first URL
              }
              
              // If it's an image, render it with SafeImage
              if (attachment.type && attachment.type.startsWith('image/')) {
                return (
                  <SafeImage
                    key={`${message.id}-attachment-${index}`}
                    src={attachmentUrl}
                    alt={attachment.name || 'Image attachment'}
                    sx={{ 
                      width: '100%', 
                      maxHeight: 200,
                      borderRadius: 1,
                      mb: index < message.attachments.length - 1 ? 1 : 0
                    }}
                  />
                );
              }
              
              // For other file types, just show the filename
              return (
                <Box 
                  key={`${message.id}-attachment-${index}`}
                  sx={{ 
                    p: 1, 
                    mb: index < message.attachments.length - 1 ? 1 : 0,
                    bgcolor: isCurrentUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderRadius: 1,
                    wordBreak: 'break-word'
                  }}
                >
                  <Typography variant="caption" component="div">
                    {attachment.name || 'Attachment'}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        {message.content && (
          <Typography variant="body2">
            {message.content}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 0.5 }}>
          <Typography variant="caption" color={isCurrentUser ? 'inherit' : 'text.secondary'} sx={{ opacity: 0.7 }}>
            {formatTime(message.created_at)}
          </Typography>
          {renderStatus()}
        </Box>
      </Paper>
    </Box>
  );
};

export default MessageBubble; 