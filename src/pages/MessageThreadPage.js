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
  Breadcrumbs,
  Link,
  Stack,
  alpha
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
  Circle as CircleIcon,
  NavigateNext as NavigateNextIcon,
  LocalOffer as LocalOfferIcon,
  Flag as FlagIcon,
  Menu as MenuIcon,
  ShoppingCart as ShoppingCartIcon,
  Forum as ForumIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { format, isToday, isYesterday, isSameWeek, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { markThreadAsRead, uploadImage } from "../services/supabase";
import { useSnackbar } from 'notistack';
import { useMessaging } from '../contexts/MessagingContext';
import { supabase } from '../supabaseClient';
import { MessageBubble, MessageAttachmentUploader, TypingIndicator } from '../components/messaging';

const MessageThreadPage = () => {
  const { id: conversationId } = useParams();
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
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const { 
    conversations,
    fetchConversations, 
    activeConversation, 
    setActiveConversation,
    sendMessage,
    subscribeToMessages,
    subscribeToTypingIndicators,
    subscribeToReadReceipts,
    sendTypingIndicator,
    typingUsers,
    onlineUsers,
    readReceipts,
    updateReadReceipt,
    markConversationAsRead,
    getMessageAttachments
  } = useMessaging();

  // Fetch messages and conversation data
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId) return;
      
      try {
        setLoading(true);
        setError('');

        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            participants:conversation_participants(
              user_id,
              user:users(id, name, avatar_url, email, university)
            ),
            listing:listings(id, title, price, images, status, description, seller_id)
          `)
          .eq('id', conversationId)
          .single();
        
        if (error) throw error;
        
        // Process the data for easier access
        const otherParticipants = data.participants
          .filter(p => p.user && p.user_id !== user.id)
          .map(p => p.user);
          
        const processedConversation = {
          ...data,
          otherParticipants
        };
        
        setConversation(processedConversation);
        setActiveConversation(processedConversation);
        
        // Check if user is part of this conversation
        const isParticipant = data.participants.some(p => p.user_id === user.id);
        if (!isParticipant) {
          navigate('/messages');
          return;
        }
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users(id, name, email, avatar_url),
            attachments:message_attachments(*)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
          
        if (messagesError) throw messagesError;
        
        setMessages(messagesData || []);
        markConversationAsRead(conversationId);
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError('Failed to load conversation data');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId, user.id, navigate, setActiveConversation, markConversationAsRead]);
  
  // Set up real-time subscriptions
  useEffect(() => {
    if (!conversationId) return;
    
    // Subscribe to new messages
    const messageUnsubscribe = subscribeToMessages(conversationId);
    
    // Subscribe to typing indicators
    const typingUnsubscribe = subscribeToTypingIndicators(conversationId);
    
    // Subscribe to read receipts
    const readReceiptUnsubscribe = subscribeToReadReceipts(conversationId);
    
    // Listen for new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        if (payload.new) {
          // If this is someone else's message, mark it as delivered
          if (payload.new.sender_id !== user.id) {
            updateReadReceipt(conversationId, payload.new.id, 'delivered');
            markConversationAsRead(conversationId);
        
            // Clear typing indicator for this user
            if (typingUsers[payload.new.sender_id]) {
              // The sender just sent a message, so they're no longer typing
              sendTypingIndicator(conversationId, false);
      }
          }
          
          // Fetch sender info and attachments if any
          if (payload.new.has_attachments) {
            const attachments = await getMessageAttachments(payload.new.id);
            payload.new.attachments = attachments;
    }
    
          // Get sender information
          const { data: senderData } = await supabase
            .from('users')
            .select('id, name, email, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();
            
          if (senderData) {
            payload.new.sender = senderData;
          }
          
          // Add message to state
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();
    
    // Clean up subscriptions
    return () => {
      channel.unsubscribe();
      if (messageUnsubscribe) messageUnsubscribe();
      if (typingUnsubscribe) typingUnsubscribe();
      if (readReceiptUnsubscribe) readReceiptUnsubscribe();
    };
  }, [conversationId, user.id, subscribeToMessages, subscribeToTypingIndicators, subscribeToReadReceipts, updateReadReceipt, markConversationAsRead, getMessageAttachments, typingUsers, sendTypingIndicator]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && isAtBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      
      // Reset unread count when scrolled to bottom
      if (unreadCount > 0) {
        setUnreadCount(0);
        
        // Mark thread as read
        markConversationAsRead(conversationId).catch(console.error);
      }
    }
  }, [messages, isAtBottom, unreadCount, conversationId]);
  
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
        markConversationAsRead(conversationId).catch(console.error);
      }
    };
    
    messageList.addEventListener('scroll', handleScroll);
    return () => messageList.removeEventListener('scroll', handleScroll);
  }, [unreadCount, conversationId]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim() && !imageFile && attachments.length === 0) {
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
        conversation_id: conversationId,
        content: newMessage.trim(),
        image: imagePath,
      };
      
      // Add reply metadata if replying to a message
      if (replyingTo) {
        messageData.reply_to_id = replyingTo.id;
      }
      
      // Send message
      const { data, error } = await sendMessage(conversationId, messageData, attachments);
      
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
      setAttachments([]);
      
      // Focus back to the input field
      if (textFieldRef.current) {
        textFieldRef.current.focus();
      }
      
      // Show success notification briefly
      setSuccess('Message sent');
      setTimeout(() => setSuccess(''), 2000);
      
      // Clear typing indicator after sending
      sendTypingIndicator(conversationId, false);
        
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

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(conversationId, true);
    }
    
    // Clear previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Set new timeout - stop typing indicator after 2 seconds of inactivity
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(conversationId, false);
    }, 2000);
  };

  // Handle attaching files
  const handleAttachFiles = (files) => {
    setAttachments(prev => [...prev, ...files]);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumbs"
        sx={{ mb: 3 }}
      >
        <Link component={RouterLink} to="/" color="inherit">
          Home
        </Link>
        <Link component={RouterLink} to="/messages" color="inherit">
          Messages
        </Link>
        <Typography color="text.primary">
          {otherUser?.name || 'Conversation'}
        </Typography>
      </Breadcrumbs>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center' 
        }}>
          <ForumIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {error.includes('recursion') ? 'No Conversations Available' : 'Error Loading Conversation'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
            {error.includes('recursion') ? 
              "We're having trouble loading your conversations. This can happen when you haven't started any conversations yet." :
              "We couldn't load this conversation. Please try again later."}
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/messages"
          >
            Back to Messages
          </Button>
        </Box>
      ) : (
        <Box>
      <Paper 
        sx={{ 
              mb: 4, 
          overflow: 'hidden',
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark' ? '0 5px 20px rgba(0, 0, 0, 0.2)' : '0 5px 20px rgba(0, 0, 0, 0.05)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
            {/* Conversation Header */}
            <Box sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper
            }}>
          <IconButton 
                edge="start" 
                component={RouterLink} 
                to="/messages"
                sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
              {otherUser && (
            <>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color="success"
                    invisible={!onlineUsers[otherUser.id]}
              >
                <Avatar 
                      src={otherUser.avatar_url} 
                      alt={otherUser.name}
                      sx={{ mr: 2, width: 40, height: 40 }}
                    >
                      {otherUser.name ? otherUser.name.charAt(0).toUpperCase() : '?'}
                    </Avatar>
              </Badge>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={500}>
                        {otherUser.name}
                  </Typography>
                  
                      <Button
                        component={RouterLink}
                        to={`/user/${otherUser.id}`}
                      size="small"
                        variant="text"
                        sx={{ fontSize: '0.75rem', textTransform: 'none', ml: 1 }}
                      >
                        View Profile
                      </Button>
                    </Stack>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {onlineUsers[otherUser.id] ? (
                        <>
                          <CircleIcon sx={{ fontSize: 10, color: 'success.main', mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">
                            Online
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Offline
                        </Typography>
                  )}
                </Box>
                  </Box>
                </>
              )}
              
              {/* Action buttons */}
              <Box>
                {conversation?.listing && (
                  <Tooltip title="View Listing">
                    <Button
                    component={RouterLink}
                      to={`/listings/${conversation.listing.id}`}
                      startIcon={<LocalOfferIcon />}
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                  >
                      View Listing
                    </Button>
                  </Tooltip>
                )}
                
                <Tooltip title="Report User">
              <IconButton 
                    color="default"
                    component={RouterLink}
                    to={{
                      pathname: "/report",
                      search: `?type=user&id=${otherUser?.id}`
                }}
              >
                    <FlagIcon />
              </IconButton>
                </Tooltip>
              </Box>
        </Box>
        
            {/* Listing info if applicable */}
            {conversation?.listing && (
        <Box 
          sx={{ 
                  p: 2, 
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: alpha(theme.palette.background.default, 0.4),
            display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Box
                  component="img"
                  src={conversation.listing.images || 'https://via.placeholder.com/100'}
                  alt={conversation.listing.title}
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: 1, 
                    objectFit: 'cover',
                    mr: 2 
                  }}
                />
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">
                    {conversation.listing.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {conversation.listing.price ? `$${parseFloat(conversation.listing.price).toFixed(2)}` : 'Price not specified'}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    Status: <Box component="span" sx={{ 
                      color: conversation.listing.status === 'active' ? 'success.main' : 'text.disabled',
                      fontWeight: 500
                    }}>
                      {conversation.listing.status?.charAt(0).toUpperCase() + conversation.listing.status?.slice(1) || 'Unknown'}
                  </Box>
                  </Typography>
                </Box>
                
                <Button 
                  variant="contained"
                  color="primary"
                  size="small"
                  component={RouterLink}
                  to={`/listings/${conversation.listing.id}`}
                  startIcon={<ShoppingCartIcon />}
                  sx={{ ml: 2 }}
                >
                  View Details
                </Button>
              </Box>
            )}
            
            {/* Messages List */}
            <Box 
              sx={{ 
                height: '50vh', 
                overflowY: 'auto', 
                p: 2,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {messages.length === 0 ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                    alignItems: 'center',
                height: '100%',
                    p: 3,
                    textAlign: 'center'
              }}
            >
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                No messages yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                    Send a message to start the conversation
              </Typography>
            </Box>
          ) : (
            <>
              {messages.map((message, index) => {
                    const isOwnMessage = message.sender_id === user.id;
                    const showSender = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                
                return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={isOwnMessage}
                        showSender={showSender && !isOwnMessage}
                        sender={message.sender}
                        attachments={message.attachments}
                        readReceipts={readReceipts[message.id]}
                        participants={conversation?.participants}
                            />
                    );
                  })}
                  
                  {/* Typing indicator */}
                  {Object.keys(typingUsers).length > 0 && (
                    <TypingIndicator 
                      typingUsers={Object.keys(typingUsers)}
                      usersMap={Object.fromEntries(
                        conversation?.participants
                          .filter(p => p.user_id !== user.id)
                          .map(p => [p.user_id, p.user]) || []
                      )}
                    />
                  )}
                  
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>
        
            {/* Message Input */}
            <Box
              component="form"
              onSubmit={handleSendMessage}
            sx={{ 
              p: 2,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.paper, 0.4) 
                  : theme.palette.background.paper
                }}
              >
              {/* Attachment preview area */}
              {attachments.length > 0 && (
          <Box 
            sx={{ 
                    p: 1, 
                    mb: 1, 
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.background.default, 0.5),
              display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1
            }}
          >
                  {attachments.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => {
                        const newAttachments = [...attachments];
                        newAttachments.splice(index, 1);
                        setAttachments(newAttachments);
                      }}
                      icon={<AttachFileIcon />}
                size="small"
                      sx={{ maxWidth: '100%' }}
                    />
                  ))}
          </Box>
        )}
        
              <Stack direction="row" spacing={1} alignItems="center">
                <MessageAttachmentUploader
                  onChange={handleAttachFiles}
                  buttonProps={{
                    size: 'small',
                    color: 'inherit',
                    sx: { borderRadius: '50%' }
              }}
                />
          
          <TextField
            placeholder="Type a message..."
                  fullWidth
            multiline
            maxRows={4}
                  size="small"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  InputProps={{
                    endAdornment: (
              <IconButton 
                color="primary" 
                type="submit"
                        disabled={newMessage.trim() === '' && attachments.length === 0}
                      >
                        <SendIcon />
              </IconButton>
                    ),
                    sx: {
                      borderRadius: 3,
                      py: 0.5,
                      backgroundColor: alpha(
                        theme.palette.background.default, 
                        theme.palette.mode === 'dark' ? 0.4 : 0.6
                      ),
                    }
                  }}
                />
              </Stack>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default MessageThreadPage; 