import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Box,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Badge,
  Chip,
  Link,
  Tooltip,
  useTheme,
  alpha,
  Fade,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  Send as SendIcon,
  Chat as ChatIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  LocalOffer as LocalOfferIcon,
  MoreVert as MoreVertIcon,
  Message as MessageIcon,
  Forum as ForumIcon,
  PersonOutline as PersonOutlineIcon,
  Circle as CircleIcon,
  FilterList as FilterListIcon,
  InsertEmoticon as EmojiIcon,
  AttachFile as AttachFileIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getConversations, getMessages, sendMessage, subscribeToMessages, trackConversationPresence, subscribeToTypingIndicators, sendTypingIndicator, updateUserPresence, getOnlineUsers } from "../services/supabase";
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationsContext';

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { markConversationNotificationsSeen, getConversationNotifications } = useNotifications();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const presenceChannelRef = useRef(null);
  const typingChannelRef = useRef(null);
  const messageChannelRef = useRef(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 600;
      setIsMobile(mobile);
      if (!mobile) {
        setShowConversationList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const { data, error } = await getConversations();
        if (error) throw error;
        
        // Sort conversations by updated_at
        const sortedConversations = (data || []).sort((a, b) => {
          return new Date(b.updated_at) - new Date(a.updated_at);
        });
        
        setConversations(sortedConversations);
        
        // If there's a conversation and we're not on mobile, select the first one
        if (sortedConversations.length > 0 && !isMobile && !selectedConversation) {
          setSelectedConversation(sortedConversations[0]);
        }
      } catch (err) {
        setError('Error loading conversations');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    
    // Set up an interval to refresh conversations periodically
    const intervalId = setInterval(fetchConversations, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [user, isMobile]);

  // Fetch messages for selected conversation
  useEffect(() => {
    // Cleanup previous subscriptions
    if (messageChannelRef.current) {
      messageChannelRef.current.unsubscribe();
    }
    
    if (presenceChannelRef.current) {
      presenceChannelRef.current.unsubscribe();
    }
    
    if (typingChannelRef.current) {
      typingChannelRef.current.unsubscribe();
    }
    
    // Reset typing state
    setTypingUsers({});
    setOnlineUsers({});
    
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      setLoading(true);
      setError('');
      try {
        const { data, error } = await getMessages(selectedConversation.id);
        if (error) {
          if (error.message.includes('not found')) {
            setError('This conversation no longer exists');
            // Optionally navigate away or handle the case where conversation was deleted
            return;
          }
          throw error;
        }
        setMessages(data || []);

        // Update user presence status for this conversation
        await updateUserPresence(selectedConversation.id, true);
        
        // Get users currently online in this conversation
        const { success, data: onlineUsersData } = await getOnlineUsers(selectedConversation.id);
        if (success && onlineUsersData) {
          setOnlineUsers(onlineUsersData);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        setError(err.message || 'Error loading messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    // On mobile, hide conversation list when a conversation is selected
    if (isMobile && selectedConversation) {
      setShowConversationList(false);
    }
    
    // Set up subscriptions for the selected conversation
    if (selectedConversation && user) {
      // Subscribe to new messages
      messageChannelRef.current = subscribeToMessages(selectedConversation.id, (payload) => {
        if (payload.new && payload.new.conversation_id === selectedConversation.id) {
          // If sender is not current user, clear typing indicator for them
          if (payload.new.sender_id !== user.id) {
            setTypingUsers(prev => {
              const updated = { ...prev };
              delete updated[payload.new.sender_id];
              return updated;
            });
          }
          
          setMessages((prev) => [...prev, payload.new]);
          
          // Move this conversation to the top of the list
          setConversations(prevConvs => {
            // Clone the conversation list
            const updatedConvs = [...prevConvs];
            // Find the conversation that matches the message
            const index = updatedConvs.findIndex(c => c.id === selectedConversation.id);
            if (index > 0) {
              // Remove it from its current position and add it to the beginning
              const [conv] = updatedConvs.splice(index, 1);
              // Update the last message
              conv.last_message = [payload.new];
              updatedConvs.unshift(conv);
              return updatedConvs;
            }
            // If the conversation is already at the top or not found, just update the last message
            if (index === 0) {
              updatedConvs[0].last_message = [payload.new];
            }
            return updatedConvs;
          });
        }
      });
      
      // Track user presence in conversation
      presenceChannelRef.current = trackConversationPresence(selectedConversation.id, user.id);
      
      // Subscribe to typing indicators
      typingChannelRef.current = subscribeToTypingIndicators(selectedConversation.id, (payload) => {
        if (payload.user_id !== user.id) {
          if (payload.is_typing) {
            // Someone started typing
            setTypingUsers(prev => ({
              ...prev,
              [payload.user_id]: {
                timestamp: new Date().getTime(),
                name: selectedConversation.participants?.find(p => p.user_id === payload.user_id)?.users?.name || 'Someone'
              }
            }));
          } else {
            // Someone stopped typing
            setTypingUsers(prev => {
              const updated = { ...prev };
              delete updated[payload.user_id];
              return updated;
            });
          }
        }
      });
      
      // Set up interval to refresh online users and update presence
      const presenceInterval = setInterval(async () => {
        if (selectedConversation?.id) {
          // Update our presence
          await updateUserPresence(selectedConversation.id, true);
          
          // Get fresh online users data
          const { success, data: onlineUsersData } = await getOnlineUsers(selectedConversation.id);
          if (success && onlineUsersData) {
            setOnlineUsers(onlineUsersData);
          }
        }
      }, 30000); // Every 30 seconds
      
      return () => {
        // Cleanup subscriptions when component unmounts or conversation changes
        if (messageChannelRef.current) {
          messageChannelRef.current.unsubscribe();
        }
        
        if (presenceChannelRef.current) {
          presenceChannelRef.current.unsubscribe();
        }
        
        if (typingChannelRef.current) {
          typingChannelRef.current.unsubscribe();
        }
        
        clearInterval(presenceInterval);
        
        // Mark user as offline in this conversation when leaving
        if (selectedConversation?.id) {
          updateUserPresence(selectedConversation.id, false).catch(err => {
            console.error('Error updating offline status:', err);
          });
        }
      };
    }

    return () => {
      // This is now handled in the return function above
    };
  }, [selectedConversation, user, isMobile]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debounced typing indicator
  const handleTyping = useCallback(() => {
    if (!selectedConversation || !user) return;
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Only send typing indicator if not already typing
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(selectedConversation.id, user.id, true);
    }
    
    // Set timeout to clear typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(selectedConversation.id, user.id, false);
    }, 2000);
  }, [selectedConversation, user, isTyping]);

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Clear typing indicator immediately
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
      sendTypingIndicator(selectedConversation.id, user.id, false);
      
      const messageContent = newMessage.trim();
      setNewMessage(''); // Clear input before sending to improve perceived performance
      
      const { error } = await sendMessage({
        conversationId: selectedConversation.id,
        content: messageContent,
      });

      if (error) throw error;
    } catch (err) {
      setError('Error sending message');
      console.error('Error:', err);
    }
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    if (isMobile) {
      setSelectedConversation(null);
    }
  };

  const renderEmptyState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 3,
        textAlign: 'center',
      }}
    >
      <ForumIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No conversations yet
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        When you message a seller about a listing, it will appear here.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate('/')}
        startIcon={<SearchIcon />}
        sx={{ 
          mt: 2,
          borderRadius: 2,
          px: 3,
          py: 1,
          boxShadow: theme.shadows[4],
          background: theme.palette.primary.main,
          '&:hover': {
            background: theme.palette.primary.dark,
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[6],
          },
          transition: 'all 0.2s'
        }}
      >
        Browse Listings
      </Button>
    </Box>
  );

  // Render who's typing indicator
  const renderTypingIndicator = () => {
    const typingUsersList = Object.values(typingUsers);
    if (typingUsersList.length === 0) return null;
    
    const typingNames = typingUsersList.map(u => u.name);
    let message = '';
    
    if (typingNames.length === 1) {
      message = `${typingNames[0]} is typing...`;
    } else if (typingNames.length === 2) {
      message = `${typingNames[0]} and ${typingNames[1]} are typing...`;
    } else {
      message = `${typingNames.length} people are typing...`;
    }
    
    return (
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          display: 'block',
          fontStyle: 'italic',
          px: 2,
          py: 0.5,
          animation: 'pulse 1.5s infinite'
        }}
      >
        {message}
      </Typography>
    );
  };

  // Add event listeners for page visibility to handle presence
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!selectedConversation?.id || !user) return;
      
      if (document.visibilityState === 'visible') {
        // User returned to the page - mark as online
        await updateUserPresence(selectedConversation.id, true);
      } else {
        // User left the page - mark as offline
        await updateUserPresence(selectedConversation.id, false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle when user is about to leave the page
    const handleBeforeUnload = () => {
      if (selectedConversation?.id && user) {
        // Use synchronous approach for beforeunload
        navigator.sendBeacon(
          '/api/set-offline',
          JSON.stringify({
            conversation_id: selectedConversation.id,
            user_id: user.id
          })
        );
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedConversation, user]);

  // When a conversation is selected, mark its notifications as seen
  useEffect(() => {
    if (selectedConversation && user) {
      // Mark any notifications for this conversation as seen
      markConversationNotificationsSeen(selectedConversation.id);
    }
  }, [selectedConversation, user, markConversationNotificationsSeen]);

  // Handler for selecting a conversation
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    
    // Mark notifications as seen immediately
    if (conversation && user) {
      markConversationNotificationsSeen(conversation.id);
    }
    
    // On mobile, hide conversation list when a conversation is selected
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const otherUser = conversation.participants?.find(p => p.user_id !== user.id)?.users;
    const otherUserName = otherUser?.name?.toLowerCase() || '';
    const listing = conversation.listing?.title?.toLowerCase() || '';
    const lastMessage = conversation.last_message?.[0]?.content?.toLowerCase() || '';
    
    return otherUserName.includes(searchQuery.toLowerCase()) || 
           listing.includes(searchQuery.toLowerCase()) || 
           lastMessage.includes(searchQuery.toLowerCase());
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper 
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: theme.palette.background.gradient,
            border: `1px solid ${alpha(theme.palette.primary.main, isDarkMode ? 0.2 : 0.1)}`,
            boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.2)' : '0 8px 32px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => navigate('/')} 
              sx={{ mr: 2 }}
              aria-label="back to listings"
            >
              <ArrowBackIcon />
            </IconButton>
            <MessageIcon 
              sx={{ 
                fontSize: 36, 
                mr: 2, 
                color: theme.palette.primary.main 
              }} 
            />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                background: isDarkMode 
                  ? 'linear-gradient(45deg, #4B7BF5 30%, #2563EB 90%)' 
                  : 'linear-gradient(45deg, #2563EB 30%, #1D4ED8 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Messages
            </Typography>
          </Box>
        </Paper>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: theme.shadows[3]
            }}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Conversations List */}
          {(!isMobile || showConversationList) && (
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  height: '70vh', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: isDarkMode ? '0 5px 20px rgba(0, 0, 0, 0.2)' : '0 5px 20px rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Box sx={{ 
                  p: 2, 
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: isDarkMode ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper
                }}>
                  <TextField
                    fullWidth
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery ? (
                        <InputAdornment position="end">
                          <IconButton 
                            edge="end" 
                            onClick={() => setSearchQuery('')}
                            size="small"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                      sx: {
                        borderRadius: 2,
                        backgroundColor: isDarkMode ? alpha(theme.palette.background.paper, 0.3) : alpha(theme.palette.background.light, 0.7),
                      }
                    }}
                    sx={{ mb: 0 }}
                  />
                </Box>

                <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
                  {loading && !conversations.length ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, flexGrow: 1, alignItems: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : filteredConversations.length === 0 ? (
                    searchQuery ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No conversations matching "{searchQuery}"
                        </Typography>
                        <Button 
                          size="small" 
                          onClick={() => setSearchQuery('')}
                          sx={{ mt: 1 }}
                        >
                          Clear search
                        </Button>
                      </Box>
                    ) : (
                      renderEmptyState()
                    )
                  ) : (
                    <List sx={{ width: '100%', p: 0 }}>
                      {filteredConversations.map((conversation) => {
                        const otherUser = conversation.participants?.find(
                          (p) => p.user_id !== user.id
                        )?.users;
                        
                        // Get the last message
                        const lastMessage = conversation.last_message?.[0];
                        const isOwnMessage = lastMessage?.sender_id === user.id;
                        const listing = conversation.listing;
                        
                        // Check if there are unseen notifications for this conversation
                        const unseenNotifications = getConversationNotifications(conversation.id);
                        const hasUnseenMessages = unseenNotifications.length > 0;
                        
                        return (
                          <ListItem
                            key={conversation.id}
                            button
                            selected={selectedConversation?.id === conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            sx={{ 
                              py: 1.5,
                              px: 2,
                              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              background: selectedConversation?.id === conversation.id ? 
                                alpha(theme.palette.primary.main, isDarkMode ? 0.15 : 0.05) :
                                hasUnseenMessages ? 
                                  alpha(theme.palette.primary.main, isDarkMode ? 0.1 : 0.03) :
                                  'transparent',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: selectedConversation?.id === conversation.id ? 
                                  alpha(theme.palette.primary.main, isDarkMode ? 0.2 : 0.08) :
                                  alpha(theme.palette.action.hover, 1),
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.divider, 0.1)}`
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Badge
                                color="success"
                                variant="dot"
                                overlap="circular"
                                invisible={!onlineUsers[otherUser?.id]}
                                sx={{
                                  '& .MuiBadge-badge': {
                                    boxShadow: `0 0 0 2px ${isDarkMode ? theme.palette.background.paper : 'white'}`,
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                  }
                                }}
                              >
                                <Avatar 
                                  src={otherUser?.avatar_url} 
                                  sx={{ 
                                    bgcolor: selectedConversation?.id === conversation.id ? 
                                      'primary.main' : 'grey.400',
                                    boxShadow: theme.shadows[2]
                                  }}
                                >
                                  {otherUser?.name?.[0]?.toUpperCase() || '?'}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography 
                                    variant="subtitle1" 
                                    noWrap 
                                    sx={{ 
                                      fontWeight: hasUnseenMessages ? 700 : 600,
                                      color: hasUnseenMessages ? 'primary.main' : 'inherit',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    {otherUser?.name || 'Unknown User'}
                                    {hasUnseenMessages && (
                                      <Box
                                        component="span"
                                        sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          minWidth: 20,
                                          height: 20,
                                          borderRadius: 10,
                                          bgcolor: 'primary.main',
                                          color: 'white',
                                          ml: 1,
                                          fontSize: '0.75rem',
                                          px: 0.8,
                                          py: 0,
                                          fontWeight: 700
                                        }}
                                      >
                                        {unseenNotifications.length}
                                      </Box>
                                    )}
                                  </Typography>
                                  {lastMessage && (
                                    <Typography 
                                      variant="caption" 
                                      color="text.secondary"
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        ml: 1,
                                        flexShrink: 0
                                      }}
                                    >
                                      {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  {listing && (
                                    <Link 
                                      component={RouterLink} 
                                      to={`/listings/${listing.id}`}
                                      color="inherit"
                                      underline="hover"
                                      onClick={(e) => e.stopPropagation()}
                                      sx={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 0.5,
                                        fontWeight: 500,
                                        fontSize: '0.75rem',
                                        color: 'primary.main',
                                      }}
                                    >
                                      <LocalOfferIcon sx={{ fontSize: '0.75rem', mr: 0.5 }} />
                                      {listing.title}
                                    </Link>
                                  )}
                                  
                                  {/* Show typing indicator in conversation list if someone is typing */}
                                  {typingUsers[otherUser?.id] ? (
                                    <Typography 
                                      variant="body2" 
                                      color="primary" 
                                      sx={{ 
                                        fontStyle: 'italic',
                                        animation: 'pulse 1.5s infinite',
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      <Box 
                                        component="span" 
                                        sx={{ 
                                          display: 'inline-block', 
                                          width: '8px', 
                                          height: '8px', 
                                          borderRadius: '50%', 
                                          bgcolor: 'primary.main',
                                          mr: 1,
                                          animation: 'pulse 1.5s infinite'
                                        }} 
                                      />
                                      typing...
                                    </Typography>
                                  ) : lastMessage ? (
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary" 
                                      noWrap
                                      sx={{ 
                                        maxWidth: '100%',
                                        display: 'inline-block',
                                        fontStyle: isOwnMessage ? 'italic' : 'normal',
                                        fontWeight: hasUnseenMessages ? 500 : 400,
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      {isOwnMessage ? `You: ${lastMessage.content}` : lastMessage.content}
                                    </Typography>
                                  ) : (
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary" 
                                      fontStyle="italic"
                                      sx={{ fontSize: '0.8rem' }}
                                    >
                                      No messages yet
                                    </Typography>
                                  )}
                                  
                                  {otherUser?.university && (
                                    <Typography 
                                      variant="caption" 
                                      color="text.secondary" 
                                      display="block"
                                      sx={{ fontSize: '0.7rem', mt: 0.5 }}
                                    >
                                      {otherUser.university}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Messages */}
          {(!isMobile || !showConversationList) && (
            <Grid item xs={12} md={8}>
              <Paper 
                sx={{ 
                  height: '70vh', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: isDarkMode ? '0 5px 20px rgba(0, 0, 0, 0.2)' : '0 5px 20px rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  overflow: 'hidden'
                }}
              >
                {selectedConversation ? (
                  <>
                    {/* Message Header */}
                    <Box sx={{ 
                      p: 2, 
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      background: isDarkMode ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper
                    }}>
                      {isMobile && (
                        <IconButton 
                          edge="start" 
                          onClick={handleBackToList}
                          sx={{ mr: 1 }}
                        >
                          <ArrowBackIcon />
                        </IconButton>
                      )}
                      
                      <Badge 
                        color="success" 
                        variant="dot" 
                        overlap="circular"
                        invisible={!onlineUsers[selectedConversation.participants?.find(p => p.user_id !== user.id)?.user_id]}
                        sx={{
                          '& .MuiBadge-badge': {
                            boxShadow: `0 0 0 2px ${isDarkMode ? theme.palette.background.paper : 'white'}`,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                          }
                        }}
                      >
                        <Avatar 
                          src={selectedConversation.participants?.find(
                            (p) => p.user_id !== user.id
                          )?.users?.avatar_url} 
                          sx={{ 
                            mr: 1.5, 
                            bgcolor: 'primary.main',
                            width: 40,
                            height: 40,
                            boxShadow: theme.shadows[3]
                          }}
                        >
                          {selectedConversation.participants?.find(
                            (p) => p.user_id !== user.id
                          )?.users?.name?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                      </Badge>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {selectedConversation.participants?.find(
                            (p) => p.user_id !== user.id
                          )?.users?.name || 'Unknown User'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              fontSize: '0.7rem'
                            }}
                          >
                            {onlineUsers[selectedConversation.participants?.find(p => p.user_id !== user.id)?.user_id] ? (
                              <>
                                <CircleIcon 
                                  sx={{ 
                                    fontSize: '8px', 
                                    color: 'success.main',
                                    mr: 0.5 
                                  }} 
                                />
                                Online
                              </>
                            ) : 'Offline'}
                            
                            {selectedConversation.participants?.find(
                              (p) => p.user_id !== user.id
                            )?.users?.university && (
                              <>
                                <Box 
                                  component="span" 
                                  sx={{ 
                                    mx: 0.5, 
                                    width: '3px', 
                                    height: '3px', 
                                    borderRadius: '50%', 
                                    bgcolor: 'text.secondary',
                                    display: 'inline-block'
                                  }} 
                                />
                                {selectedConversation.participants?.find(
                                  (p) => p.user_id !== user.id
                                )?.users?.university}
                              </>
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {selectedConversation.listing && (
                        <Tooltip title="View listing details">
                          <Link 
                            component={RouterLink} 
                            to={`/listings/${selectedConversation.listing.id}`}
                            color="primary"
                            underline="none"
                            sx={{ 
                              ml: 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 500,
                              fontSize: '0.8rem',
                              transition: 'all 0.2s',
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                                boxShadow: theme.shadows[1]
                              }
                            }}
                          >
                            <LocalOfferIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                            {selectedConversation.listing.title}
                            {selectedConversation.listing.price && (
                              <Box 
                                component="span" 
                                sx={{ 
                                  ml: 1, 
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  py: 0.25,
                                  px: 0.75,
                                  borderRadius: 1,
                                  bgcolor: theme.palette.primary.main,
                                  color: 'white'
                                }}
                              >
                                GHC {parseFloat(selectedConversation.listing.price).toFixed(2)}
                              </Box>
                            )}
                          </Link>
                        </Tooltip>
                      )}
                    </Box>
                    
                    {/* Messages List */}
                    <Box 
                      sx={{ 
                        flexGrow: 1, 
                        overflow: 'auto', 
                        p: 3,
                        background: isDarkMode 
                          ? `radial-gradient(circle, ${alpha('#1a202c', 0.7)}, ${alpha('#0d1117', 0.8)})`
                          : `radial-gradient(circle, #ffffff, #f8fafc)`,
                      }}
                    >
                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                          <CircularProgress />
                        </Box>
                      ) : messages.length === 0 ? (
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          height: '100%',
                          flexDirection: 'column',
                          p: 3
                        }}>
                          <QuestionAnswerIcon 
                            sx={{ 
                              fontSize: 60, 
                              color: alpha(theme.palette.primary.main, 0.2),
                              mb: 2
                            }} 
                          />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No messages yet
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            textAlign="center"
                            sx={{ maxWidth: 300 }}
                          >
                            Start the conversation by sending a message below
                          </Typography>
                        </Box>
                      ) : (
                        <Fade in timeout={500}>
                          <Box>
                            {messages.map((message) => (
                              <Box
                                key={message.id}
                                sx={{
                                  display: 'flex',
                                  justifyContent: message.sender_id === user.id ? 'flex-end' : 'flex-start',
                                  mb: 2,
                                }}
                              >
                                {message.sender_id !== user.id && (
                                  <Avatar 
                                    src={selectedConversation.participants?.find(
                                      (p) => p.user_id === message.sender_id
                                    )?.users?.avatar_url}
                                    sx={{ 
                                      width: 28, 
                                      height: 28, 
                                      mr: 1,
                                      mt: 1,
                                      display: { xs: 'none', sm: 'block' }
                                    }}
                                  >
                                    {selectedConversation.participants?.find(
                                      (p) => p.user_id === message.sender_id
                                    )?.users?.name?.[0]?.toUpperCase() || '?'}
                                  </Avatar>
                                )}
                                <Box
                                  sx={{
                                    maxWidth: '75%',
                                    bgcolor: message.sender_id === user.id 
                                      ? 'primary.main' 
                                      : isDarkMode ? alpha(theme.palette.background.paper, 0.8) : 'background.paper',
                                    color: message.sender_id === user.id ? 'white' : 'text.primary',
                                    borderRadius: message.sender_id === user.id 
                                      ? '18px 18px 4px 18px' 
                                      : '18px 18px 18px 4px',
                                    p: 2,
                                    boxShadow: message.sender_id === user.id
                                      ? `0 2px 12px ${alpha(theme.palette.primary.main, 0.4)}`
                                      : theme.shadows[1],
                                    position: 'relative'
                                  }}
                                >
                                  <Typography variant="body1">{message.content}</Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      display: 'block', 
                                      mt: 0.5, 
                                      opacity: 0.7,
                                      textAlign: 'right',
                                      fontSize: '0.7rem',
                                      color: message.sender_id === user.id ? 'white' : 'text.secondary' 
                                    }}
                                  >
                                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                  </Typography>
                                </Box>
                                {message.sender_id === user.id && (
                                  <Avatar 
                                    src={user.avatar_url}
                                    sx={{ 
                                      width: 28, 
                                      height: 28, 
                                      ml: 1,
                                      mt: 1,
                                      display: { xs: 'none', sm: 'block' }
                                    }}
                                  >
                                    {user.name?.[0]?.toUpperCase() || '?'}
                                  </Avatar>
                                )}
                              </Box>
                            ))}
                            <div ref={messagesEndRef} />
                          </Box>
                        </Fade>
                      )}
                    </Box>

                    {/* Typing indicator */}
                    {renderTypingIndicator()}

                    {/* Message Input */}
                    <Box 
                      sx={{ 
                        p: 2,
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        background: isDarkMode ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper
                      }}
                    >
                      <form onSubmit={handleSendMessage}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Tooltip title="Add attachment">
                            <IconButton color="primary" sx={{ opacity: 0.7 }}>
                              <AttachFileIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <TextField
                            fullWidth
                            placeholder="Type a message"
                            value={newMessage}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            InputProps={{
                              sx: {
                                borderRadius: 3,
                                py: 0.5,
                                boxShadow: isDarkMode 
                                  ? 'none' 
                                  : '0 2px 6px rgba(0,0,0,0.04)'
                              }
                            }}
                          />
                          
                          <Tooltip title="Add emoji">
                            <IconButton color="primary" sx={{ opacity: 0.7 }}>
                              <EmojiIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <IconButton
                            type="submit"
                            color="primary"
                            disabled={!newMessage.trim()}
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              color: 'white',
                              '&:hover': {
                                bgcolor: theme.palette.primary.dark,
                                transform: 'scale(1.05)'
                              },
                              transition: 'all 0.2s',
                              height: 40,
                              width: 40
                            }}
                          >
                            <SendIcon />
                          </IconButton>
                        </Stack>
                      </form>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      flexDirection: 'column',
                      p: 3,
                      background: theme.palette.background.gradient,
                    }}
                  >
                    <MessageIcon 
                      sx={{ 
                        fontSize: 80, 
                        color: alpha(theme.palette.primary.main, 0.2),
                        mb: 3 
                      }} 
                    />
                    <Typography variant="h5" color="text.primary" gutterBottom fontWeight={600}>
                      Select a conversation
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary" 
                      textAlign="center" 
                      sx={{ maxWidth: 400, mb: 3 }}
                    >
                      Choose a conversation from the list to start messaging
                    </Typography>
                    {isMobile && conversations.length > 0 && (
                      <Button 
                        variant="contained" 
                        onClick={handleBackToList}
                        sx={{ 
                          mt: 2,
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          boxShadow: theme.shadows[4],
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[6],
                          },
                          transition: 'all 0.2s'
                        }}
                      >
                        View Conversations
                      </Button>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Add keyframe animation for typing indicator */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </Container>
  );
};

export default MessagesPage; 