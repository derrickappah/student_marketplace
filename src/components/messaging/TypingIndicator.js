import React from 'react';
import { Box, Typography } from '@mui/material';
import { UserAvatar } from './';

/**
 * TypingIndicator component shows which users are currently typing
 * 
 * @param {Object} props
 * @param {Array} props.typingUsers - Array of user IDs who are typing
 * @param {Object} props.usersMap - Object mapping user IDs to user objects
 */
const TypingIndicator = ({ 
  typingUsers = [],
  usersMap = {}
}) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  // Get the typing user
  const typingUserId = typingUsers[0];
  const typingUser = usersMap[typingUserId] || { name: 'Someone' };
  
  // Create the typing message
  const typingMessage = `${typingUser.name || 'Someone'} is typing...`;
  
  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      mb: 2
    }}>
      <UserAvatar
        user={typingUser}
        status="typing"
        size={24}
        showStatus={true}
      />
      
      <Box sx={{ 
        ml: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Typography variant="caption" color="text.secondary">
          {typingMessage}
        </Typography>
        
        <Box 
          sx={{ 
            display: 'flex',
            mt: 0.5
          }}
        >
          {/* Animated dots to indicate typing */}
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                mx: 0.2,
                animation: 'typing-dot 1.4s infinite ease-in-out',
                animationDelay: `${i * 0.2}s`,
                '@keyframes typing-dot': {
                  '0%': {
                    transform: 'translateY(0)',
                    opacity: 0.5,
                  },
                  '50%': {
                    transform: 'translateY(-5px)',
                    opacity: 1,
                  },
                  '100%': {
                    transform: 'translateY(0)',
                    opacity: 0.5,
                  },
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default TypingIndicator; 