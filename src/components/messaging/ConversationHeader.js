import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { UserAvatar } from './';

/**
 * ConversationHeader component displays information about the current conversation
 * 
 * @param {Object} props
 * @param {Object} props.conversation - The current conversation object
 * @param {boolean} props.isMobile - Whether the app is in mobile mode
 * @param {Function} props.onBack - Callback for back button (mobile only)
 * @param {Function} props.onMenuOpen - Callback for opening the menu
 */
const ConversationHeader = (props) => {
  const {
    conversation,
    isMobile = false,
    onBack,
    onMenuOpen
  } = props;
  
  if (!conversation) return null;
  
  // Get the first other participant in the conversation
  const otherUser = conversation.otherParticipants?.[0] || {};
  
  // Determine online status
  const isOnline = otherUser.online || false;
  const status = isOnline ? 'online' : 'offline';
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {isMobile && (
          <IconButton 
            edge="start" 
            onClick={onBack}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        
        <UserAvatar
          user={otherUser}
          status={status}
          size={40}
          showStatus
        />
        
        <Box sx={{ ml: 2 }}>
          <Typography variant="subtitle1">
            {otherUser.name || 'Unknown User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {status === 'online' ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </Box>
      
      <Box>
        <Tooltip title="More options">
          <IconButton 
            edge="end" 
            onClick={onMenuOpen}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ConversationHeader; 