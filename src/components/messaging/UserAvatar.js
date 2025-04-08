import React, { useState } from 'react';
import {
  Avatar,
  Badge,
  Tooltip,
  Box
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Badge for online status
const StyledBadge = styled(Badge)(({ theme, status }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: 
      status === 'online' ? theme.palette.success.main : 
      status === 'away' ? theme.palette.warning.main : 
      theme.palette.grey[500],
    color: 
      status === 'online' ? theme.palette.success.main : 
      status === 'away' ? theme.palette.warning.main : 
      theme.palette.grey[500],
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: status === 'typing' ? 'ripple 1.2s infinite ease-in-out' : 'none',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

/**
 * UserAvatar component displays a user's avatar with optional online status
 * 
 * @param {Object} props
 * @param {Object} props.user - User object with name and avatar_url
 * @param {number} props.size - Size of the avatar in pixels
 * @param {boolean} props.showStatus - Whether to show online status
 * @param {boolean} props.isOnline - Whether the user is online
 * @param {Object} props.sx - Additional styles
 */
const UserAvatar = ({ 
  user, 
  size = 40,
  showStatus = false,
  isOnline = false,
  sx = {},
  ...props
}) => {
  const [imgError, setImgError] = useState(false);
  
  if (!user) return null;
  
  // Handle image load errors
  const handleError = () => {
    setImgError(true);
  };
  
  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  const avatar = (
    <Avatar
      src={!imgError ? user.avatar_url : undefined}
      alt={user.name || 'User'}
      sx={{ 
        width: size, 
        height: size,
        fontSize: size / 2,
        ...sx 
      }}
      onError={handleError}
      {...props}
    >
      {getInitials(user.name)}
    </Avatar>
  );
  
  // If status indicator is requested, wrap in Badge
  if (showStatus) {
    return (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        color="success"
        invisible={!isOnline}
      >
        {avatar}
      </Badge>
    );
  }
  
  return avatar;
};

export default UserAvatar; 