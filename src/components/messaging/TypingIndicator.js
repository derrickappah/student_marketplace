import React from 'react';
import {
  Box,
  Typography,
  keyframes,
  Avatar,
  AvatarGroup,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';

// Animation for the typing dots
const bounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-5px);
  }
`;

// Fade in animation
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const TypingIndicator = ({ 
  typingUsers = [], 
  participants = [],
  displayNames = true
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  
  // Filter out current user
  const activeTypingUsers = Array.isArray(typingUsers) 
    ? typingUsers.filter(userId => userId !== user?.id)
    : [];
  
  if (activeTypingUsers.length === 0) {
    return null;
  }
  
  // Find user information from participants
  const typingParticipants = Array.isArray(participants) 
    ? participants.filter(p => activeTypingUsers.includes(p.id))
    : [];

  // Format typing message
  const formatTypingMessage = () => {
    if (typingParticipants.length === 1) {
      return `${typingParticipants[0]?.name || 'Someone'} is typing...`;
    } else if (typingParticipants.length === 2) {
      return `${typingParticipants[0]?.name || 'Someone'} and ${typingParticipants[1]?.name || 'someone else'} are typing...`;
    } else if (typingParticipants.length > 2) {
      return `${typingParticipants.length} people are typing...`;
    }
    return 'Someone is typing...';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        borderRadius: 4,
        ml: 1,
        mb: 1,
        maxWidth: '250px',
        animation: `${fadeIn} 0.3s ease-in-out`,
      }}
    >
      <AvatarGroup
        max={2}
        sx={{
          '& .MuiAvatar-root': { 
            width: 24, 
            height: 24, 
            fontSize: '0.75rem',
            borderColor: 'transparent'
          },
          mr: 1
        }}
      >
        {typingParticipants.map((participant, index) => (
          <Avatar
            key={index}
            src={participant?.avatar_url}
            alt={participant?.name || `User ${index + 1}`}
            sx={{ 
              width: 24, 
              height: 24,
              border: `1px solid ${theme.palette.background.paper}`
            }}
          />
        ))}
      </AvatarGroup>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {displayNames && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '0.7rem', mr: 0.5 }}
          >
            {formatTypingMessage()}
          </Typography>
        )}
        
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: theme => alpha(theme.palette.divider, 0.2),
            borderRadius: 5,
            px: 0.8,
            py: 0.4
          }}
        >
          {[0, 1, 2].map((dot) => (
            <Box
              key={dot}
              component="span"
              sx={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                mx: 0.2,
                display: 'inline-block',
                animation: `${bounce} 1.4s infinite ease-in-out both`,
                animationDelay: `${dot * 0.16}s`,
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default TypingIndicator; 