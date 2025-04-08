import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Badge,
  Divider
} from '@mui/material';
import { UserAvatar } from './';

/**
 * ConversationList component displays a list of conversations
 * 
 * @param {Object} props
 * @param {Array} props.conversations - Array of conversation objects
 * @param {string} props.activeConversationId - ID of the currently active conversation
 * @param {Function} props.onSelectConversation - Callback when a conversation is selected
 */
const ConversationList = ({
  conversations = [],
  activeConversationId,
  onSelectConversation
}) => {
  // Format the timestamp to a readable time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      {conversations.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No conversations yet
          </Typography>
        </Box>
      ) : (
        conversations.map((conversation) => {
          // Get the other participant info
          const otherUser = conversation.otherParticipants?.[0] || {};
          
          return (
            <React.Fragment key={conversation.id}>
              <ListItem 
                disablePadding
                alignItems="flex-start"
                sx={{ 
                  bgcolor: activeConversationId === conversation.id ? 
                    'action.selected' : 'transparent'
                }}
              >
                <ListItemButton onClick={() => onSelectConversation(conversation)}>
                  <ListItemAvatar>
                    <Badge
                      color="primary"
                      badgeContent={conversation.unreadCount > 0 ? conversation.unreadCount : 0}
                      overlap="circular"
                      invisible={conversation.unreadCount <= 0}
                    >
                      <UserAvatar 
                        user={otherUser}
                        size={40}
                        showStatus
                      />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center' 
                        }}
                      >
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: conversation.unreadCount > 0 ? 600 : 400 
                          }}
                        >
                          {otherUser?.name || 'Unknown User'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                        >
                          {formatTime(conversation.latestMessage?.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ 
                          maxWidth: '90%',
                          fontWeight: conversation.unreadCount > 0 ? 500 : 400
                        }}
                      >
                        {conversation.latestMessage?.content || 'No messages yet'}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          );
        })
      )}
    </List>
  );
};

export default ConversationList; 