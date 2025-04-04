import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  CircularProgress,
  Divider,
  IconButton,
  Alert,
  Tooltip,
  Badge,
  Chip,
  Skeleton,
  Menu,
  MenuItem,
  Fade,
  Zoom,
  Popper,
  ClickAwayListener,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  AccessTime as AccessTimeIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  EmojiEmotions as EmojiIcon,
  Reply as ReplyIcon,
  ContentCopy as CopyIcon,
  AttachFile as AttachFileIcon,
  ExpandLess as ExpandLessIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Report as ReportIcon,
  Block as BlockIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  Gif as GifIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { format, isToday, isYesterday, isSameWeek, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, sendMessage, markThreadAsRead, uploadImage, getConversation, sendTypingIndicator, subscribeToTypingIndicators, subscribeToMessages } from "../services/supabase";
import { useSnackbar } from 'notistack';

const MessageThreadPage = () => {
  const { id: threadId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textFieldRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [messageActionsAnchor, setMessageActionsAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messageListRef = useRef(null);
  const typingTimeout = useRef(null);
  const messageSubscription = useRef(null);
  const typingSubscription = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);

  // Fetch messages and conversation data
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError('');

        // Get conversation details
        const { data: conversationData, error: convError } = await getConversation(threadId);
        if (convError) throw new Error(convError.message);
        
        if (!conversationData) {
          navigate('/messages');
          return;
        }
        
        setConversation(conversationData);
        
        // Get messages for this thread
        const { data: messagesData, error: messagesError } = await getMessages(threadId);
        if (messagesError) throw new Error(messagesError.message);
        
        setMessages(messagesData || []);
        
        // Mark thread as read
        await markThreadAsRead(threadId);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (threadId && user) {
      fetchMessages();
    }
    
    return () => {
      // Clean up any subscriptions on unmount
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
      if (typingSubscription.current) {
        typingSubscription.current.unsubscribe();
      }
    };
  }, [threadId, user, navigate]);
  
  // Set up real-time subscriptions for messages and typing indicators
  useEffect(() => {
    if (!threadId || !user) return;
    
    // Subscribe to new messages
    messageSubscription.current = subscribeToMessages(threadId, (payload) => {
      if (payload.new && payload.new.sender_id !== user.id) {
        // Add the new message to our list
        setMessages(prev => [...prev, payload.new]);
        
        // Mark as read if we're at the bottom of the chat
        if (isAtBottom) {
          markThreadAsRead(threadId).catch(console.error);
        } else {
          // Increment unread count if we're not at the bottom
          setUnreadCount(prev => prev + 1);
        }
      }
    });
    
    // Subscribe to typing indicators
    typingSubscription.current = subscribeToTypingIndicators(threadId, (payload) => {
      if (payload.new && payload.new.user_id !== user.id) {
        setTypingUsers(prev => {
          const newState = new Set(prev);
          newState.add(payload.new.user_id);
          return newState;
        });
        
        // Clear typing indicator after 5 seconds of inactivity
        setTimeout(() => {
          setTypingUsers(prev => {
            const newState = new Set(prev);
            newState.delete(payload.new.user_id);
            return newState;
          });
        }, 5000);
      }
    });
    
    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
      if (typingSubscription.current) {
        typingSubscription.current.unsubscribe();
      }
    };
  }, [threadId, user, isAtBottom]);
  
  // Handle typing indicator
  useEffect(() => {
    if (!threadId || !user || !newMessage) return;
    
    // Clear any existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Send typing indicator
    sendTypingIndicator(threadId, user.id, true)
      .catch(err => console.error('Error sending typing indicator:', err));
    
    // Set timeout to clear typing indicator after 3 seconds
    typingTimeout.current = setTimeout(() => {
      sendTypingIndicator(threadId, user.id, false)
        .catch(err => console.error('Error clearing typing indicator:', err));
    }, 3000);
    
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [threadId, user, newMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && isAtBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      
      // Reset unread count when scrolled to bottom
      if (unreadCount > 0) {
        setUnreadCount(0);
        
        // Mark thread as read
        markThreadAsRead(threadId).catch(console.error);
      }
    }
  }, [messages, isAtBottom, unreadCount, threadId]);
  
  // Track scroll position
  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messageList;
      
      // Consider "at bottom" if within 100px of the bottom
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(atBottom);
      
      // Show/hide scroll button
      setShowScrollButton(!atBottom);
      
      // If scrolled to bottom, reset unread count and mark as read
      if (atBottom && unreadCount > 0) {
        setUnreadCount(0);
        markThreadAsRead(threadId).catch(console.error);
      }
    };
    
    messageList.addEventListener('scroll', handleScroll);
    return () => messageList.removeEventListener('scroll', handleScroll);
  }, [unreadCount, threadId]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim() && !imageFile) {
      return; // Don't send empty messages
    }
    
    setSending(true);
    setError('');
    
    try {
      let imagePath = null;
      
      // Upload image if selected
      if (imageFile) {
        const { success, data, error: uploadError } = await uploadImage(
          imageFile, 
          'message-attachments', 
          'messages/'
        );
        
        if (!success || uploadError) {
          throw new Error(uploadError || 'Failed to upload image');
        }
        
        imagePath = data.path;
      }
      
      // Create message data
      const messageData = {
        conversation_id: threadId,
        content: newMessage.trim(),
        image_url: imagePath,
      };
      
      // Add reply metadata if replying to a message
      if (replyingTo) {
        messageData.reply_to_id = replyingTo.id;
      }
      
      // Send message
      const { data, error } = await sendMessage(messageData);
      
      if (error) throw new Error(error.message);
      
      // Add new message to the list optimistically
      const newMessageObject = {
        ...data,
        status: 'sent', // For tracking message status
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessageObject]);
      setNewMessage('');
      setImageFile(null);
      setImagePreview('');
      setReplyingTo(null);
      
      // Focus back to the input field
      if (textFieldRef.current) {
        textFieldRef.current.focus();
      }
      
      // Show success notification briefly
      setSuccess('Message sent');
      setTimeout(() => setSuccess(''), 2000);
      
      // Clear typing indicator after sending
      sendTypingIndicator(threadId, user.id, false)
        .catch(err => console.error('Error clearing typing indicator:', err));
        
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Focus to text field after selecting image
      if (textFieldRef.current) {
        textFieldRef.current.focus();
      }
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleKeyPress = (e) => {
    // Send message on Ctrl+Enter or Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const handleMessageAction = (action, message) => {
    setSelectedMessage(message);
    
    switch (action) {
      case 'reply':
        setReplyingTo(message);
        if (textFieldRef.current) {
          textFieldRef.current.focus();
        }
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content)
          .then(() => {
            enqueueSnackbar('Message copied to clipboard', { 
              variant: 'success',
              autoHideDuration: 2000
            });
          })
          .catch(err => {
            console.error('Could not copy text: ', err);
          });
        break;
      case 'delete':
        // Handle message deletion
        if (window.confirm('Are you sure you want to delete this message?')) {
          // Delete message logic
        }
        break;
      case 'report':
        // Navigate to report form with message details
        navigate('/report', {
          state: {
            reportType: 'message',
            itemId: message.id,
            itemData: {
              sender: message.sender_name || 'Unknown sender',
              content: message.content?.substring(0, 50) + (message.content?.length > 50 ? '...' : '')
            }
          }
        });
        break;
      default:
        break;
    }
    setMessageActionsAnchor(null);
  };
  
  const handleCancelReply = () => {
    setReplyingTo(null);
  };
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setUnreadCount(0);
  };

  const formatMessageDate = (dateString) => {
    const messageDate = new Date(dateString);
    
    if (isToday(messageDate)) {
      // Message is from today, show time only
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      // Message is from yesterday
      return 'Yesterday, ' + format(messageDate, 'h:mm a');
    } else if (isThisWeek(messageDate)) {
      // Message is from this week
      return format(messageDate, 'EEEE, h:mm a');
    } else if (isThisMonth(messageDate)) {
      // Message is from this month
      return format(messageDate, 'MMM d, h:mm a');
    } else if (isThisYear(messageDate)) {
      // Message is from this year
      return format(messageDate, 'MMM d, h:mm a');
    } else {
      // Message is from a previous year
      return format(messageDate, 'MMM d, yyyy, h:mm a');
    }
  };
  
  const shouldShowDateSeparator = (message, index) => {
    if (index === 0) return true;
    
    const currentDate = new Date(message.created_at);
    const prevDate = new Date(messages[index - 1].created_at);
    
    // Show separator if dates are different
    return (
      currentDate.getDate() !== prevDate.getDate() ||
      currentDate.getMonth() !== prevDate.getMonth() ||
      currentDate.getFullYear() !== prevDate.getFullYear()
    );
  };
  
  const formatDateSeparator = (dateString) => {
    const messageDate = new Date(dateString);
    
    if (isToday(messageDate)) {
      return 'Today';
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else if (isThisWeek(messageDate)) {
      return format(messageDate, 'EEEE');
    } else if (isThisYear(messageDate)) {
      return format(messageDate, 'MMMM d');
    } else {
      return format(messageDate, 'MMMM d, yyyy');
    }
  };
  
  const getMessageStatus = (message) => {
    // For demo purposes - in a real app this would come from the server
    if (message.sender_id === user?.id) {
      if (message.read_at) {
        return 'read';
      } else if (message.delivered_at) {
        return 'delivered';
      } else {
        return 'sent';
      }
    }
    return null;
  };
  
  const renderStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckIcon fontSize="small" sx={{ opacity: 0.7 }} />;
      case 'delivered':
        return <DoneAllIcon fontSize="small" sx={{ opacity: 0.7 }} />;
      case 'read':
        return <DoneAllIcon fontSize="small" sx={{ color: 'primary.main' }} />;
      default:
        return <AccessTimeIcon fontSize="small" sx={{ opacity: 0.5 }} />;
    }
  };

  // Get other user's details (not the current user)
  const otherUser = conversation 
    ? user.id === conversation.buyer_id
      ? { id: conversation.seller_id, name: conversation.seller_name, avatar: conversation.seller_avatar }
      : { id: conversation.buyer_id, name: conversation.buyer_name, avatar: conversation.buyer_avatar }
    : null;

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const results = messages.filter((message) =>
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  };

  // Navigate to search result
  const navigateToSearchResult = (index) => {
    if (index < 0 || index >= searchResults.length) return;

    const message = searchResults[index];
    const messageElement = document.getElementById(`message-${message.id}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight');
      setTimeout(() => {
        messageElement.classList.remove('highlight');
      }, 2000);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          height: 'calc(100vh - 160px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1px',
            background: 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
            zIndex: 1,
          },
        }}
      >
        {/* Header */}
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: 'background.light',
            borderBottom: 1,
            borderColor: 'divider',
            position: 'relative',
            zIndex: 0,
          }}
        >
          <IconButton 
            onClick={() => navigate('/messages')} 
            sx={{ mr: 1 }}
            aria-label="back to messages"
          >
            <ArrowBackIcon />
          </IconButton>
          
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="text" width={80} height={16} sx={{ mt: 0.5 }} />
              </Box>
            </Box>
          ) : (
            <>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      border: '2px solid white',
                    }}
                  />
                }
                invisible={!Array.from(typingUsers).length}
              >
                <Avatar 
                  src={otherUser?.avatar || ''}
                  alt={otherUser?.name || 'User'}
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    mr: 2, 
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                />
              </Badge>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {otherUser?.name || 'User'}
                  </Typography>
                  
                  {Array.from(typingUsers).length > 1 && (
                    <Chip
                      label={`${Array.from(typingUsers).length} people typing...`}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        ml: 1, 
                        height: 20, 
                        fontSize: '0.65rem',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  )}
                </Box>
                
                {conversation?.listing_title && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    component={RouterLink}
                    to={`/listings/${conversation.listing_id}`}
                    sx={{ 
                      maxWidth: 240,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.main'
                      }
                    }}
                  >
                    Re: {conversation.listing_title}
                  </Typography>
                )}
              </Box>
              
              <IconButton 
                aria-label="conversation options" 
                size="small"
                sx={{ 
                  ml: 1,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    color: 'primary.main',
                  }
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </>
          )}
        </Box>
        
        {/* Messages area */}
        <Box 
          ref={messageListRef}
          sx={{ 
            p: 3, 
            flexGrow: 1, 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            position: 'relative',
            scrollBehavior: 'smooth',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 50% 100%, rgba(25, 118, 210, 0.03), transparent 70%)',
              pointerEvents: 'none',
            },
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, my: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Box 
                  key={i} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end'
                  }}
                >
                  {i % 2 === 0 && (
                    <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} />
                  )}
                  <Box 
                    sx={{ 
                      maxWidth: '70%',
                      width: `${Math.random() * 50 + 20}%`
                    }}
                  >
                    <Skeleton 
                      variant="rounded" 
                      width="100%" 
                      height={Math.random() * 40 + 40} 
                      sx={{ borderRadius: 3 }} 
                    />
                    <Skeleton width={40} height={16} sx={{ mt: 0.5, ml: i % 2 === 0 ? 1 : 'auto' }} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : error ? (
            <Alert 
              severity="error" 
              sx={{ 
                mx: 'auto', 
                mt: 3,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : messages.length === 0 ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                opacity: 0.7,
              }}
            >
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                No messages yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start the conversation by sending a message below
              </Typography>
            </Box>
          ) : (
            <>
              {messages.map((message, index) => {
                const isCurrentUser = message.sender_id === user.id;
                const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                const messageStatus = getMessageStatus(message);
                const showDateSeparator = shouldShowDateSeparator(message, index);
                
                return (
                  <React.Fragment key={message.id}>
                    {showDateSeparator && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          my: 2,
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            right: 0,
                            height: '1px',
                            backgroundColor: 'divider',
                            zIndex: 0,
                          }
                        }}
                      >
                        <Chip
                          label={formatDateSeparator(message.created_at)}
                          size="small"
                          sx={{
                            backgroundColor: 'background.paper',
                            fontSize: '0.75rem',
                            zIndex: 1,
                            px: 1,
                          }}
                        />
                      </Box>
                    )}
                    
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                        mb: 1,
                      }}
                    >
                      {!isCurrentUser && showAvatar && (
                        <Avatar 
                          src={otherUser?.avatar || ''}
                          alt={otherUser?.name || 'User'}
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 1, 
                            mt: 0.5,
                            border: '1.5px solid white',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          }}
                        />
                      )}
                      
                      {!isCurrentUser && !showAvatar && <Box sx={{ width: 32, height: 32, mr: 1 }} />}
                      
                      <Box 
                        sx={{ 
                          maxWidth: '70%',
                          minWidth: '100px',
                          position: 'relative',
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setSelectedMessage(message);
                          setMessageActionsAnchor(e.currentTarget);
                        }}
                      >
                        {message.reply_to_id && (
                          <Box
                            sx={{
                              ml: isCurrentUser ? 0 : 0,
                              mr: isCurrentUser ? 0 : 0,
                              mb: 0.5,
                              p: 1,
                              borderRadius: 1.5,
                              backgroundColor: 'action.hover',
                              borderLeft: '2px solid',
                              borderColor: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              position: 'relative',
                              fontSize: '0.85rem',
                              opacity: 0.85,
                            }}
                          >
                            <ReplyIcon 
                              sx={{ 
                                fontSize: 16, 
                                mr: 1, 
                                color: 'primary.main',
                                transform: 'scaleX(-1)'
                              }} 
                            />
                            <Typography
                              variant="body2"
                              sx={{ 
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '90%',
                                fontSize: 'inherit',
                              }}
                            >
                              {/* This would show the replied-to message content */}
                              {message.reply_to_content || 'Original message'}
                            </Typography>
                          </Box>
                        )}
                      
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: isCurrentUser 
                              ? '16px 16px 4px 16px' 
                              : '16px 16px 16px 4px',
                            backgroundColor: isCurrentUser 
                              ? 'rgba(25, 118, 210, 0.12)'
                              : 'background.paper',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            position: 'relative',
                            transition: 'all 0.2s',
                            '&:hover': {
                              backgroundColor: isCurrentUser 
                                ? 'rgba(25, 118, 210, 0.15)'
                                : 'rgba(255, 255, 255, 0.95)',
                            },
                            ...(isCurrentUser && {
                              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.15) 100%)',
                            }),
                          }}
                          onClick={() => {
                            setSelectedMessage(message);
                            setMessageActionsAnchor(document.getElementById(`message-${message.id}`));
                          }}
                        >
                          <Box id={`message-${message.id}`} sx={{ position: 'absolute', inset: 0 }} />
                          
                          {message.content && (
                            <Typography variant="body1">
                              {message.content}
                            </Typography>
                          )}
                          
                          {message.image_url && (
                            <Box 
                              component="img"
                              src={message.image_url}
                              alt="Message attachment"
                              sx={{
                                maxWidth: '100%',
                                borderRadius: 1,
                                mt: message.content ? 2 : 0,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  transform: 'scale(0.985)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(message.image_url, '_blank');
                              }}
                            />
                          )}
                        </Box>
                        
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                            mt: 0.5,
                            mx: 1,
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: '0.7rem' }}
                          >
                            {formatMessageDate(message.created_at)}
                          </Typography>
                          
                          {isCurrentUser && messageStatus && (
                            <Box 
                              component="span" 
                              sx={{ 
                                display: 'inline-flex', 
                                ml: 0.5,
                                fontSize: '0.7rem',
                                color: messageStatus === 'read' ? 'primary.main' : 'text.secondary',
                              }}
                            >
                              {renderStatusIcon(messageStatus)}
                            </Box>
                          )}
                        </Box>
                      </Box>
                      
                      <IconButton
                        size="small"
                        sx={{
                          ml: 0.5,
                          opacity: 0,
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.04)',
                          },
                          '.message-row:hover &': {
                            opacity: 0.5,
                          },
                        }}
                        onClick={() => {
                          setSelectedMessage(message);
                          setMessageActionsAnchor(document.getElementById(`message-${message.id}`));
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Zoom in={showScrollButton}>
            <Box
              onClick={scrollToBottom}
              sx={{
                position: 'absolute',
                bottom: imagePreview ? 144 : 80,
                right: 24,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <IconButton
                color="primary"
                sx={{
                  backgroundColor: 'background.paper',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  },
                }}
              >
                <KeyboardArrowDownIcon />
              </IconButton>
              
              {unreadCount > 0 && (
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{
                    transform: 'translateY(-14px)',
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      height: 18,
                      minWidth: 18,
                    },
                  }}
                />
              )}
            </Box>
          </Zoom>
        )}
        
        {/* Reply preview area */}
        {replyingTo && (
          <Box 
            sx={{ 
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              backgroundColor: 'action.hover',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <ReplyIcon sx={{ fontSize: 14, mr: 0.5, color: 'primary.main' }} />
                <Typography variant="caption" fontWeight="medium" color="primary">
                  Replying to {replyingTo.sender_id === user.id ? 'yourself' : otherUser?.name}
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  color: 'text.secondary',
                  fontSize: '0.85rem',
                }}
              >
                {replyingTo.content}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleCancelReply}
              sx={{ mt: -0.5 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        
        {/* Image preview area */}
        {imagePreview && (
          <Box 
            sx={{ 
              p: 2,
              borderTop: (theme) => replyingTo ? 0 : 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'background.default',
            }}
          >
            <Box sx={{ position: 'relative', width: 70, height: 70 }}>
              <img
                src={imagePreview}
                alt="Selected attachment"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
              <IconButton
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: -8, 
                  right: -8, 
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'error.dark',
                  },
                  width: 22,
                  height: 22,
                  boxShadow: '0 2px 6px rgba(239,83,80,0.4)',
                }}
                onClick={handleRemoveImage}
              >
                <DeleteIcon fontSize="small" sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Image attached
            </Typography>
          </Box>
        )}
        
        {/* Message input area */}
        <Box 
          component="form" 
          onSubmit={handleSendMessage}
          sx={{ 
            p: 2, 
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'background.light',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            position: 'relative',
          }}
        >
          <Tooltip title="Attach files">
            <IconButton 
              component="label" 
              aria-label="attach files"
              sx={{
                transition: 'all 0.2s',
                color: imageFile ? 'primary.main' : 'inherit',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  color: 'primary.main',
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                hidden
              />
              <AttachFileIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Add emoji">
            <IconButton 
              aria-label="add emoji"
              sx={{
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  color: 'primary.main',
                }
              }}
            >
              <EmojiIcon />
            </IconButton>
          </Tooltip>
          
          <TextField
            fullWidth
            inputRef={textFieldRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={sending || loading}
            multiline
            maxRows={4}
            InputProps={{
              sx: {
                borderRadius: 3,
                bgcolor: 'background.paper',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s',
                '&.Mui-focused': {
                  boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)',
                }
              }
            }}
          />
          
          <Tooltip title="Send message (Ctrl+Enter)">
            <span>
              <IconButton 
                color="primary" 
                type="submit"
                disabled={(!newMessage.trim() && !imageFile) || sending || loading}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px) scale(1.05)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  }
                }}
              >
                {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Paper>
      
      {/* Success message */}
      {success && (
        <Fade in={!!success}>
          <Alert 
            severity="success" 
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              right: 16, 
              borderRadius: 2,
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              minWidth: 200,
            }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        </Fade>
      )}
      
      {/* Message context menu */}
      <Menu
        anchorEl={messageActionsAnchor}
        open={!!messageActionsAnchor}
        onClose={() => setMessageActionsAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 180,
          }
        }}
      >
        <MenuItem onClick={() => handleMessageAction('reply', selectedMessage)}>
          <ReplyIcon fontSize="small" sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        <MenuItem onClick={() => handleMessageAction('copy', selectedMessage)}>
          <CopyIcon fontSize="small" sx={{ mr: 1 }} />
          Copy text
        </MenuItem>
        <MenuItem onClick={() => handleMessageAction('delete', selectedMessage)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
        <MenuItem onClick={() => handleMessageAction('report', selectedMessage)}>
          <ReportIcon fontSize="small" sx={{ mr: 1 }} />
          Report
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default MessageThreadPage; 