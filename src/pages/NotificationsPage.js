import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Paper,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Stack,
  alpha,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  LocalOffer as LocalOfferIcon,
  Favorite as FavoriteIcon,
  DeleteOutline as DeleteIcon,
  Check as CheckIcon,
  FilterList as FilterIcon,
  MarkChatRead as MarkReadIcon,
  NotificationsNone as EmptyNotificationIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationsContext';

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, debugNotifications } = useNotifications();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [calculatedUnreadCount, setCalculatedUnreadCount] = useState(0);
  // Add state to track locally modified notifications
  const [modifiedNotifications, setModifiedNotifications] = useState([]);
  
  // Initialize modified notifications when notifications change
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      // Parse read value to ensure Boolean type
      const processed = notifications.map(n => ({
        ...n,
        read: n.read === true || n.read === 'true' || n.read === 1 ? true : false
      }));
      setModifiedNotifications(processed);
      
      // Calculate unread count based on processed notifications
      const actualUnreadCount = processed.filter(n => n.read === false).length;
      setCalculatedUnreadCount(actualUnreadCount);
      console.log(`NotificationsPage: Actual unread count: ${actualUnreadCount}, Context unreadCount: ${unreadCount}`);
      console.log(`Original vs Processed notifications:`, {
        original: notifications.map(n => ({ id: n.id, read: n.read, type: typeof n.read })),
        processed: processed.map(n => ({ id: n.id, read: n.read, type: typeof n.read }))
      });
    } else {
      setModifiedNotifications([]);
      setCalculatedUnreadCount(0);
    }
  }, [notifications, unreadCount]);
  
  // Debug: log notifications when component renders
  useEffect(() => {
    console.log('NotificationsPage: Rendered with', { 
      notificationsCount: notifications?.length || 0,
      modifiedNotificationsCount: modifiedNotifications?.length || 0,
      contextUnreadCount: unreadCount,
      calculatedUnreadCount,
      hasNotifications: Array.isArray(notifications) && notifications.length > 0
    });
    
    if (!modifiedNotifications || modifiedNotifications.length === 0) {
      console.warn('NotificationsPage: No modified notifications');
    } else {
      console.log(`NotificationsPage: Found ${modifiedNotifications.length} notifications`);
      
      // Debug: log read/unread status of each notification
      const unreadNotifications = modifiedNotifications.filter(n => n.read === false);
      console.log(`NotificationsPage: Found ${unreadNotifications.length} unread notifications`);
      
      modifiedNotifications.forEach((notification, index) => {
        console.log(`Notification ${index+1}: id=${notification.id}, type=${notification.type}, read=${notification.read}, readType=${typeof notification.read}`);
      });
    }
  }, [notifications, modifiedNotifications, unreadCount, calculatedUnreadCount]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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

  // Local handler for marking notification as read
  const handleNotificationClick = async (notification) => {
    // Mark as read in database first
    if (notification.read !== true) {
      await markAsRead(notification.id);
      
      // Update local state immediately without waiting for context update
      setModifiedNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      
      // Update calculated unread count
      setCalculatedUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        navigate('/messages');
        break;
      case 'listing':
      case 'offer':
      case 'offer_response':
        if (notification.listing_id) {
          navigate(`/listings/${notification.listing_id}`);
        }
        break;
      default:
        break;
    }
  };

  // Local handler for marking all as read
  const handleMarkAllAsRead = async () => {
    // Call context method
    await markAllAsRead();
    
    // Update local state immediately
    setModifiedNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    
    // Update calculated unread count
    setCalculatedUnreadCount(0);
  };

  // Get filtered notifications based on active tab
  const getFilteredNotifications = () => {
    // Handle case where notifications is undefined or null
    if (!modifiedNotifications || modifiedNotifications.length === 0) return [];
    
    let result = [];
    
    switch (activeTab) {
      case 0: // All tab
        result = modifiedNotifications;
        break;
      case 1: // Unread tab
        // Use strict boolean comparison for unread notifications
        result = modifiedNotifications.filter(n => n.read === false);
        break;
      case 2: // Offers tab
        result = modifiedNotifications.filter(n => n.type === 'offer' || n.type === 'offer_response');
        break;
      case 3: // Messages tab
        result = modifiedNotifications.filter(n => n.type === 'message');
        break;
      case 4: // Other tab
        result = modifiedNotifications.filter(n => 
          n.type !== 'offer' && 
          n.type !== 'offer_response' && 
          n.type !== 'message'
        );
        break;
      default:
        result = modifiedNotifications;
    }
    
    console.log(`Tab ${activeTab} filtered notifications: ${result.length}`);
    return result;
  };
  
  const filteredNotifications = getFilteredNotifications();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            p: 2.5, 
            background: (theme) => theme.palette.background.gradient,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Badge 
              badgeContent={calculatedUnreadCount} 
              color="error" 
              invisible={calculatedUnreadCount === 0}
            >
              <NotificationsIcon color="primary" />
            </Badge>
            <Typography variant="h5" component="h1" fontWeight="600">
              Notifications
            </Typography>
          </Stack>
          
          {calculatedUnreadCount > 0 && (
            <Button 
              variant="contained" 
              size="small" 
              disableElevation
              startIcon={<MarkReadIcon />}
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            px: 1,
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 100,
              py: 1.5
            }
          }}
        >
          <Tab 
            label="All" 
            icon={modifiedNotifications?.length > 0 ? <Chip size="small" label={modifiedNotifications.length} /> : null}
            iconPosition="end"
          />
          <Tab 
            label="Unread" 
            icon={calculatedUnreadCount > 0 ? <Chip size="small" color="error" label={calculatedUnreadCount} /> : null}
            iconPosition="end"
          />
          <Tab 
            label="Offers" 
            icon={modifiedNotifications?.filter(n => n.type === 'offer' || n.type === 'offer_response').length > 0 ? 
              <Chip size="small" label={modifiedNotifications.filter(n => n.type === 'offer' || n.type === 'offer_response').length} /> : null}
            iconPosition="end"
          />
          <Tab 
            label="Messages" 
            icon={modifiedNotifications?.filter(n => n.type === 'message').length > 0 ? 
              <Chip size="small" label={modifiedNotifications.filter(n => n.type === 'message').length} /> : null}
            iconPosition="end"
          />
          <Tab 
            label="Other" 
            icon={modifiedNotifications?.filter(n => n.type !== 'offer' && n.type !== 'offer_response' && n.type !== 'message').length > 0 ? 
              <Chip size="small" label={modifiedNotifications.filter(n => n.type !== 'offer' && n.type !== 'offer_response' && n.type !== 'message').length} /> : null}
            iconPosition="end"
          />
        </Tabs>

        {filteredNotifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <EmptyNotificationIcon sx={{ fontSize: 70, color: 'text.secondary', mb: 2, opacity: 0.6 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 0 ? 
                "You don't have any notifications yet" : 
                activeTab === 1 ? 
                "You don't have any unread notifications" :
                activeTab === 2 ?
                "You don't have any offer notifications" :
                activeTab === 3 ?
                "You don't have any message notifications" :
                "You don't have any other notifications"}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    backgroundColor: notification.read === true ? 'inherit' : (theme) => alpha(theme.palette.primary.light, 0.08),
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.2s',
                  }}
                  secondaryAction={
                    <Tooltip title="Delete notification">
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                          // Also update local state
                          setModifiedNotifications(prev => prev.filter(n => n.id !== notification.id));
                          if (notification.read === false) {
                            setCalculatedUnreadCount(prev => Math.max(0, prev - 1));
                          }
                        }}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        bgcolor: notification.read === true ? 'action.selected' : 'primary.light',
                        color: notification.read === true ? 'text.secondary' : 'primary.contrastText',
                        width: 40, 
                        height: 40 
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography 
                          variant="body1"
                          sx={{ 
                            fontWeight: notification.read === true ? 'normal' : 600,
                            color: 'text.primary'
                          }}
                        >
                          {notification.message}
                        </Typography>
                        {notification.read === false && (
                          <Chip 
                            label="New" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ ml: 1.5, height: 20, fontWeight: 500 }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {notification.created_at ? 
                          formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : 
                          'Just now'}
                      </Typography>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Card>
    </Container>
  );
};

export default NotificationsPage; 