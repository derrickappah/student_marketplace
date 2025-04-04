import React, { useState, useEffect, useCallback } from 'react';
import { 
  Snackbar, 
  Alert, 
  Stack, 
  Box, 
  Avatar, 
  Typography, 
  Button,
  IconButton,
  Slide
} from '@mui/material';
import { 
  Close as CloseIcon,
  Circle as CircleIcon,
  Message as MessageIcon,
  LocalOffer as OfferIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { markNotificationAsRead } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';

/**
 * Component for displaying real-time notification toasts
 */
const NotificationToast = ({ notification, onClose }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  
  // Handle notification click based on type
  const handleClick = useCallback(async () => {
    // Mark as read first
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        if (notification.conversation_id) {
          navigate(`/messages/${notification.conversation_id}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'offer':
      case 'offer_response':
        if (notification.offer_id) {
          navigate(`/offers/${notification.offer_id}`);
        } else if (notification.listing_id) {
          navigate(`/listings/${notification.listing_id}`);
        }
        break;
      case 'listing_status':
      case 'promotion':
        if (notification.listing_id) {
          navigate(`/listings/${notification.listing_id}`);
        }
        break;
      default:
        if (notification.listing_id) {
          navigate(`/listings/${notification.listing_id}`);
        } else if (notification.related_id) {
          navigate(`/notifications?highlight=${notification.id}`);
        } else {
          navigate('/notifications');
        }
    }
    
    handleClose();
  }, [notification, navigate]);
  
  // Handle closing the notification
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };
  
  // Get the icon based on notification type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageIcon color="primary" />;
      case 'offer':
      case 'offer_response':
        return <OfferIcon color="secondary" />;
      default:
        return <NotificationIcon color="info" />;
    }
  };
  
  // Get the avatar component
  const getAvatar = () => {
    if (notification.sender && notification.sender.avatar_url) {
      return (
        <Avatar 
          src={notification.sender.avatar_url} 
          alt={notification.sender.name || 'User'}
          sx={{ width: 40, height: 40 }}
        />
      );
    }
    
    // Default avatar with notification icon
    return (
      <Avatar sx={{ 
        bgcolor: notification.type === 'message' ? 'primary.main' : 
                notification.type === 'offer' || notification.type === 'offer_response' ? 'secondary.main' : 
                'info.main',
        width: 40, 
        height: 40
      }}>
        {getNotificationIcon()}
      </Avatar>
    );
  };
  
  // Format the time ago
  const timeAgo = notification.created_at ? 
    formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : 
    '';
    
  // Render preview content for messages if available
  const renderPreview = () => {
    if (notification.type === 'message' && notification.preview) {
      return (
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
          "{notification.preview}"
        </Typography>
      );
    }
    return null;
  };
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={Slide}
    >
      <Alert 
        severity="info" 
        variant="filled"
        icon={false}
        sx={{ 
          width: '100%', 
          p: 0, 
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderLeft: notification.type === 'message' ? '4px solid' : 'none',
          borderLeftColor: 'primary.main',
          boxShadow: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2 }}>
          {getAvatar()}
          
          <Box sx={{ ml: 2, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {notification.message}
            </Typography>
            
            {renderPreview()}
            
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
              {timeAgo}
            </Typography>
            
            <Stack direction="row" spacing={1} mt={1}>
              <Button 
                size="small" 
                variant="contained" 
                disableElevation 
                onClick={handleClick}
              >
                View
              </Button>
              
              <Button 
                size="small"
                variant="text"
                color="inherit"
                onClick={handleClose}
              >
                Dismiss
              </Button>
            </Stack>
          </Box>
          
          <IconButton 
            size="small" 
            aria-label="close" 
            color="inherit" 
            onClick={handleClose}
            sx={{ 
              alignSelf: 'flex-start',
              mt: -0.5, 
              mr: -0.5
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default NotificationToast; 