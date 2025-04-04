import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ButtonGroup,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  LocalOffer as LocalOfferIcon,
  Favorite as FavoriteIcon,
  DeleteOutline as DeleteIcon,
  Check as CheckIcon,
  MoreHoriz as MoreIcon,
  BugReport as BugIcon,
  PersonOutline as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationsMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const { 
    notifications, 
    unreadCount, 
    badgeCounts,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    debugNotifications,
  } = useNotifications();
  const navigate = useNavigate();

  // Log notifications on mount and when they change
  useEffect(() => {
    console.log('NotificationsMenu: Notifications updated', { 
      count: notifications?.length,
      unreadCount, 
      badgeCounts,
      notifications
    });
    
    // Debug: log if notifications array is empty or has items
    if (!notifications || notifications.length === 0) {
      console.warn('NotificationsMenu: No notifications found in context');
    } else {
      console.log(`NotificationsMenu: Found ${notifications.length} notifications`);
      
      // Log the first notification as example
      if (notifications[0]) {
        console.log('First notification example:', notifications[0]);
      }
    }
  }, [notifications, unreadCount, badgeCounts]);

  const handleOpen = (event) => {
    console.log('NotificationsMenu: Opening menu');
    debugNotifications(); // Run debug when menu opens
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    handleClose();

    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        navigate(`/messages${notification.conversation_id ? '' : ''}`);
        break;
      case 'listing':
        navigate(`/listings/${notification.listing_id}`);
        break;
      case 'offer':
      case 'offer_response':
        navigate(`/offers`);
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageIcon fontSize="small" />;
      case 'listing':
        return <LocalOfferIcon fontSize="small" />;
      case 'offer':
        return <LocalOfferIcon fontSize="small" color="primary" />;
      case 'offer_response':
        return <FavoriteIcon fontSize="small" color="secondary" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    if (!notifications) return [];
    
    switch (activeTab) {
      case 0: // All
        return notifications;
      case 1: // Messages
        return notifications.filter(n => n.type === 'message');
      case 2: // Offers
        return notifications.filter(n => n.type === 'offer' || n.type === 'offer_response');
      case 3: // Other
        return notifications.filter(n => 
          n.type !== 'message' && n.type !== 'offer' && n.type !== 'offer_response'
        );
      default:
        return notifications;
    }
  };

  // Limit the number of notifications in the dropdown
  const filteredNotifications = getFilteredNotifications();
  const displayedNotifications = filteredNotifications.slice(0, 5);
  const hasMoreNotifications = filteredNotifications.length > 5;

  // Check if we have notifications data to display
  const hasNotifications = Array.isArray(notifications) && notifications.length > 0;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        aria-label={`${unreadCount} unread notifications`}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 600,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
            <Tooltip title="Debug Notifications">
              <IconButton 
                size="small" 
                onClick={() => {
                  console.log('Running notification debug...');
                  debugNotifications();
                }}
                color="default"
              >
                <BugIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {hasNotifications && (
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              label="All" 
              icon={
                <Badge badgeContent={badgeCounts.total} color="error" max={99}>
                  <NotificationsIcon fontSize="small" />
                </Badge>
              } 
              iconPosition="start"
            />
            <Tab 
              label="Messages" 
              icon={
                <Badge badgeContent={badgeCounts.messages} color="error" max={99}>
                  <MessageIcon fontSize="small" />
                </Badge>
              } 
              iconPosition="start"
            />
            <Tab 
              label="Offers" 
              icon={
                <Badge badgeContent={badgeCounts.offers} color="error" max={99}>
                  <LocalOfferIcon fontSize="small" />
                </Badge>
              } 
              iconPosition="start"
            />
          </Tabs>
        )}

        {!hasNotifications ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary" variant="body2" gutterBottom>
              No notifications yet
            </Typography>
            <Typography color="text.secondary" variant="caption" display="block">
              You'll see updates about your listings, offers, and messages here
            </Typography>
            
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<BugIcon />}
              sx={{ mt: 2 }}
              component={Link}
              to="/notifications"
              onClick={handleClose}
            >
              View Notifications Page
            </Button>
          </Box>
        ) : displayedNotifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              No {activeTab === 1 ? 'message' : activeTab === 2 ? 'offer' : ''} notifications
            </Typography>
          </Box>
        ) : (
          <>
            {displayedNotifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  px: 2,
                  backgroundColor: notification.read ? 'inherit' : 'action.hover',
                  position: 'relative',
                }}
              >
                {notification.sender ? (
                  <ListItemAvatar>
                    <Avatar 
                      src={notification.sender.avatar_url}
                      alt={notification.sender.name}
                      sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: notification.read ? 'grey.400' : 'primary.main'
                      }}
                    >
                      {notification.sender.name?.[0]?.toUpperCase() || <PersonIcon />}
                    </Avatar>
                  </ListItemAvatar>
                ) : (
                  <ListItemIcon sx={{ color: notification.read ? 'text.secondary' : 'primary.main' }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                )}
                
                <ListItemText
                  primary={notification.message}
                  secondary={
                    <>
                      {notification.preview && (
                        <Typography 
                          variant="body2" 
                          component="div" 
                          sx={{ 
                            color: 'text.secondary',
                            fontStyle: 'italic',
                            mt: 0.5,
                            mb: 0.5,
                            fontSize: '0.8rem',
                            opacity: 0.8
                          }}
                        >
                          "{notification.preview}"
                        </Typography>
                      )}
                      <Typography variant="caption" component="div">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </Typography>
                    </>
                  }
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: notification.read ? 'text.primary' : 'primary',
                    fontWeight: notification.read ? 'normal' : 'medium',
                  }}
                  secondaryTypographyProps={{
                    component: 'div',
                  }}
                />
                
                {!notification.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      position: 'absolute',
                      right: 12,
                      top: 12,
                    }}
                  />
                )}
              </MenuItem>
            ))}
            
            {hasMoreNotifications && (
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  + {filteredNotifications.length - 5} more notifications
                </Typography>
              </Box>
            )}
            
            <Divider />
            
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center' }}>
              <Button
                fullWidth
                component={Link}
                to="/notifications"
                onClick={handleClose}
                color="primary"
                size="small"
              >
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationsMenu; 