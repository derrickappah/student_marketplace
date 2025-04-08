import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Chip,
  Tooltip,
  Button,
  Alert,
  Stack,
  useMediaQuery,
  Badge,
  Divider,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  SwipeableDrawer,
  Fade,
  Zoom
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Search as SearchIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  AccountCircle as AccountCircleIcon,
  Forum as ForumIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CloudOff as CloudOffIcon,
  ErrorOutline as ErrorOutlineIcon,
  QuestionAnswer as QuestionAnswerIcon,
  AttachFile as AttachFileIcon,
  LocalOffer as LocalOfferIcon,
  MoreVert as MoreVertIcon,
  Message as MessageIcon,
  FilterList as FilterListIcon,
  InsertEmoticon as EmojiIcon,
  Inbox as InboxIcon,
  Archive as ArchiveIcon,
  PersonAdd as PersonAddIcon,
  Done as DoneIcon,
  PhotoCamera as PhotoCameraIcon,
  Mic as MicIcon,
  Image as ImageIcon,
  PriorityHigh as PriorityHighIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  ContentCopy as CopyIcon,
  Forward as ShareIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import { useMessaging } from '../contexts/MessagingContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { MessageBubble, MessageAttachmentUploader, TypingIndicator, MESSAGE_STATUS } from '../components/messaging';
import { formatDistanceToNow, format } from 'date-fns';
import { getConversations, getMessages, sendMessage, subscribeToMessages, trackConversationPresence, subscribeToTypingIndicators, sendTypingIndicator, updateUserPresence, getOnlineUsers, downloadConversationAttachments, downloadMessageAttachment as downloadAttachment } from "../services/supabase";

// New component for conversation item
const ConversationItem = ({ conversation, isActive, onClick, currentUserId }) => {
  const lastMessage = conversation.last_message;
  const otherUser = conversation.otherParticipants?.[0];
  const hasUnseenMessages = (conversation.unseen_messages || 0) > 0;
  const listingTitle = conversation.listing?.title;
  const listingImage = conversation.listing?.images;
  
  // Get a display name even if user info is incomplete
  const displayName = otherUser?.name || 'Unknown User';
  const userInitial = displayName.charAt(0) || 'U';
  
  // Determine if there's a last message or not
  const lastMessageText = lastMessage && lastMessage.content ? lastMessage.content : 'Start a conversation';
  
  return (
    <ListItem 
      disablePadding 
      sx={{ 
        mb: 0.5,
        overflow: 'hidden',
        bgcolor: isActive ? 'action.selected' : 'transparent',
        borderRadius: 1,
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'action.hover',
        }
      }}
    >
      <ListItemButton 
        onClick={onClick}
        sx={{ 
          py: 1.5,
          px: 2,
          borderRadius: 1,
        }}
      >
        <ListItemAvatar>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color={otherUser?.status === 'online' ? 'success' : 'default'}
            invisible={otherUser?.status !== 'online'}
          >
            <Avatar
              src={otherUser?.avatar_url}
              alt={displayName}
              sx={{ 
                width: 48, 
                height: 48,
                bgcolor: hasUnseenMessages ? 'primary.main' : 'grey.300',
              }}
            >
              {userInitial}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        
        <ListItemText
          primary={
            <Box 
              component="span" 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: hasUnseenMessages ? 600 : 500,
                  color: hasUnseenMessages ? 'text.primary' : 'text.primary',
                }}
              >
                {displayName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: hasUnseenMessages ? 500 : 400,
                }}
              >
                {lastMessage?.created_at
                  ? formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })
                  : ''}
              </Typography>
            </Box>
          }
          secondary={
            <Box
              component="span"
              sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="body2"
                component="span"
                noWrap
                sx={{
                  color: hasUnseenMessages
                    ? 'text.primary'
                    : 'text.secondary',
                  fontWeight: hasUnseenMessages ? 500 : 400,
                  maxWidth: '70%',
                }}
              >
                {lastMessageText}
              </Typography>
              {hasUnseenMessages && (
                <Chip
                  size="small"
                  label={conversation.unseen_messages}
                  color="primary"
                  sx={{ height: 20, fontSize: '0.7rem', ml: 1 }}
                />
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

// New component for conversation details header
const ConversationHeader = ({ conversation, onBack, isMobile }) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();
  const currentUserId = useAuth().user?.id;
  
  // Get the other participant with better fallbacks
  const otherUser = conversation?.participants?.find(p => p?.user_id !== currentUserId)?.user || 
                   conversation?.otherParticipants?.[0] || 
                   {};
  
  const displayName = otherUser?.name || 
                     (otherUser?.email ? otherUser.email.split('@')[0] : null) || 
                     `User ${(otherUser?.id || '').substring(0, 8)}`;
                     
  const userInitial = (displayName || 'U').charAt(0).toUpperCase();
  const isOnline = otherUser?.status === 'online';
  
  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };
  
  const handleViewProfile = () => {
    navigate(`/profile/${otherUser?.id}`);
    handleMenuClose();
  };
  
  const handleBlockUser = () => {
    // Implement block user functionality
    handleMenuClose();
  };
  
  const handleReportUser = () => {
    // Implement report user functionality
    handleMenuClose();
  };
  
  const handleDownloadAllAttachments = async () => {
    try {
      setIsDownloading(true);
      handleMenuClose();
      
      if (!conversation || !conversation.id) {
        throw new Error('Invalid conversation data');
      }
      
      // Add validation to display name
      const safeDisplayName = displayName || 'Conversation';
      
      // Download all attachments
      const result = await downloadConversationAttachments(
        conversation.id, 
        safeDisplayName
      );
      
      if (!result.success) {
        if (result.error === 'No attachments were found or could be downloaded') {
          alert('No attachments found in this conversation.');
        } else {
          throw new Error(result.error || 'Unknown error');
        }
        return;
      }
      
      if (result.filesAdded === 0) {
        alert('No attachments were found in this conversation.');
      } else {
        console.log(`Downloaded ${result.filesAdded} attachments`);
      }
    } catch (error) {
      console.error('Error downloading attachments:', error);
      alert(`Failed to download attachments: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <Box 
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {isMobile && (
          <IconButton onClick={onBack} edge="start" sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          color={isOnline ? 'success' : 'default'}
          invisible={!isOnline}
        >
          <Avatar 
            src={otherUser?.avatar_url} 
            alt={displayName}
            sx={{ width: 40, height: 40, mr: 1.5 }}
          >
            {userInitial}
          </Avatar>
        </Badge>
        
        <Box>
          <Typography variant="subtitle1" fontWeight={500}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isOnline ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </Box>
      
      <Box>
        {isDownloading ? (
          <CircularProgress size={24} />
        ) : (
          <Tooltip title="More options">
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleViewProfile}>
            <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
            View Profile
          </MenuItem>
          <MenuItem onClick={handleDownloadAllAttachments}>
            <GetAppIcon fontSize="small" sx={{ mr: 1 }} />
            Download All Attachments
          </MenuItem>
          <MenuItem onClick={handleBlockUser}>
            <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
            Block User
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleReportUser} sx={{ color: 'error.main' }}>
            <PriorityHighIcon fontSize="small" sx={{ mr: 1 }} />
            Report
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

// Main MessagesPage component
const MessagesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { 
    conversations, 
    loading: isLoadingConversations,
    error,
    fetchConversations,
    markConversationAsRead,
    sendMessage: contextSendMessage,
    sendTypingIndicator: contextSendTypingIndicator,
    subscribeToMessages,
    subscribeToTypingIndicators,
    typingUsers
  } = useMessaging();
  
  // State for conversation management
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeConversationMessages, setActiveConversationMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [emojiMenuAnchor, setEmojiMenuAnchor] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [messageFilter, setMessageFilter] = useState('all');
  const [fixingRLS, setFixingRLS] = useState(false);
  
  // Refs
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastCheckedServiceStatus = useRef(Date.now());
  const messageSubscription = useRef(null);
  
  // Constants
  const SERVICE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Define initialLoad function to load conversations
  const initialLoad = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 600) {
        setShowConversationList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch conversations on component mount with service status check
  useEffect(() => {
    initialLoad();
    
    // Set up interval to check for new messages
    const intervalId = setInterval(() => {
      fetchConversations();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchConversations, initialLoad]);

  // Select first conversation if none selected (on desktop)
  useEffect(() => {
    if (conversations.length > 0 && !isMobile && !activeConversation) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, isMobile, activeConversation, setActiveConversation]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;
    
    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await getMessages(activeConversation.id);
        
        if (error) {
          console.error('Failed to fetch messages:', error);
          return;
        }
        
        // Process messages to ensure they have sender information
        const processedMessages = data.map(message => {
          // If message doesn't have sender info, try to get it from conversation participants
          if (!message.sender && message.sender_id) {
            // First check if it's the current user
            if (message.sender_id === user?.id) {
              message.sender = {
                id: user.id,
                name: user.name || 'You',
                avatar_url: user.avatar_url,
                email: user.email,
                university: user.university || ''
              };
            } else {
              // Try to find participant in the conversation
              const participant = activeConversation.otherParticipants?.find(p => p.id === message.sender_id);
              if (participant) {
                message.sender = participant;
              } else {
                // Create a placeholder
                message.sender = {
                  id: message.sender_id,
                  name: 'User',
                  avatar_url: null
                };
              }
            }
          }
          
          return message;
        });
        
        setActiveConversationMessages(processedMessages || []);
        
        // Mark conversation as read
        if (activeConversation.unseen_messages > 0) {
          markConversationAsRead(activeConversation.id);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
    
    // Subscribe to new messages and typing indicators
    const unsubscribeMessages = subscribeToMessages(activeConversation.id);
    const unsubscribeTyping = subscribeToTypingIndicators(activeConversation.id);
    
    // Track presence in conversation
    if (activeConversation?.id && user?.id) {
      trackConversationPresence(activeConversation.id, user.id);
    }
    
    return () => {
      unsubscribeMessages && unsubscribeMessages();
      unsubscribeTyping && unsubscribeTyping();
    };
  }, [activeConversation, user?.id, markConversationAsRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current && activeConversationMessages.length > 0) {
      // Scroll to bottom of messages container
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeConversationMessages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!activeConversation) return;
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      contextSendTypingIndicator(activeConversation.id, true);
    }
    
    // Set timeout to clear typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      contextSendTypingIndicator(activeConversation.id, false);
    }, 2000);
  };

  // Function to fix RLS issues when encountering permission errors
  const handleFixRLSIssues = async () => {
    try {
      setFixingRLS(true);
      setSendError("Fixing permissions issue...");

      // Import the fixConversationParticipantsRLS function dynamically
      const { fixConversationParticipantsRLS } = await import('../services/supabase');
      
      // Call the RLS fix function
      const result = await fixConversationParticipantsRLS();
      
      if (result.success) {
        setSendError("Permissions fixed! Try sending your message again.");
        // Try to resend the message automatically
        setTimeout(() => {
          setSendError(null);
          handleSendMessage();
        }, 1500);
      } else {
        setSendError(`Couldn't fix permissions: ${result.error}`);
      }
    } catch (err) {
      console.error('Error fixing RLS issues:', err);
      setSendError(`Error fixing permissions: ${err.message}`);
    } finally {
      setFixingRLS(false);
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    if (!activeConversation || (!newMessage.trim() && attachments.length === 0)) return;
    
    try {
      setSendError(null);
      
      // Prepare a temporary message ID for optimistic UI updates
      const tempId = `temp-${Date.now()}`;
      
      // Add message to UI immediately (optimistic update)
      const tempMessage = {
        id: tempId,
        temp_id: tempId,
        content: newMessage.trim(),
        sender_id: user?.id,
        created_at: new Date().toISOString(),
        has_attachments: attachments.length > 0,
        status: MESSAGE_STATUS.SENDING
      };
      
      setActiveConversationMessages(prev => [...prev, tempMessage]);
      
      // Clear input
      setNewMessage('');
      
      // Send the actual message
      const result = await contextSendMessage(
        activeConversation.id, 
        newMessage.trim(),
        attachments
      );
      
      if (!result) {
        throw new Error('Failed to send message');
      }
      
      // Clear attachments after successful send
      setAttachments([]);
      
      // Replace temp message with actual message
      setActiveConversationMessages(prev => 
        prev.map(msg => msg.temp_id === tempId ? { ...result, status: MESSAGE_STATUS.SENT } : msg)
      );
      
      // Refresh conversations list to update last message
      fetchConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Check if this is an RLS error (code 42501)
      if (err.code === '42501' || (err.message && err.message.includes('violates row-level security policy'))) {
        setSendError(
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" gutterBottom>
              Permission error: Can't send message due to security restrictions.
            </Typography>
            <Button 
              variant="contained"
              color="primary"
              size="small"
              onClick={handleFixRLSIssues}
              disabled={fixingRLS}
              startIcon={fixingRLS ? <CircularProgress size={16} /> : null}
            >
              {fixingRLS ? 'Fixing...' : 'Fix Permissions'}
            </Button>
          </Box>
        );
      } else {
        setSendError('Failed to send message. Please try again.');
      }
      
      // Update status of the temporary message to FAILED
      setActiveConversationMessages(prev => 
        prev.map(msg => msg.temp_id === tempId ? { ...msg, status: MESSAGE_STATUS.FAILED } : msg)
      );
    }
  };
  
  // Retry sending a failed message
  const handleRetryMessage = async (failedMessage) => {
    // Remove the failed message
    setActiveConversationMessages(prev => prev.filter(msg => msg.id !== failedMessage.id));
    
    // Set the message content back in the input
    setNewMessage(failedMessage.content);
    
    // Focus the input
    document.querySelector('input[name="messageInput"]')?.focus();
  };

  // Handle file selection for attachment
  const handleFileSelect = (files) => {
    // For simplicity in this example, just store the files directly
    // In a real implementation, you'd upload the files and store URLs
    setAttachments(prev => [...prev, ...files]);
  };
  
  // Remove a file from attachments
  const handleRemoveFile = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Back to conversation list (mobile)
  const handleBackToList = () => {
    setShowConversationList(true);
    if (isMobile) {
      setActiveConversation(null);
    }
  };

  // Handle selecting a conversation
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    
    // On mobile, hide conversation list
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  // Filter conversations based on search and current tab
  const filteredConversations = conversations.filter(conversation => {
    // First filter by search query
    if (searchQuery) {
      const otherUser = conversation.otherParticipants?.[0];
      const otherUserName = otherUser?.name?.toLowerCase() || '';
      const listing = conversation.listing?.title?.toLowerCase() || '';
      const lastMessage = conversation.last_message?.content?.toLowerCase() || '';
      
      const matchesSearch = otherUserName.includes(searchQuery.toLowerCase()) || 
                           listing.includes(searchQuery.toLowerCase()) || 
                           lastMessage.includes(searchQuery.toLowerCase());
                           
      if (!matchesSearch) return false;
    }
    
    // Then filter by tab
    if (currentTab === 1) { // Archived tab
      return conversation.archived;
    } else if (currentTab === 0) { // Inbox tab
      return !conversation.archived;
    }
    
    return true;
  });

  // Handle retry for service status
  const handleRetryFetch = async () => {
    fetchConversations();
  };
  
  // Clear send error
  const handleClearSendError = () => {
    setSendError(null);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Handle message menu open
  const handleMessageMenuOpen = (event, message) => {
    setMessageMenuAnchor(event.currentTarget);
    setSelectedMessage(message);
  };
  
  // Handle message menu close
  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
  };
  
  // Handle message action
  const handleMessageAction = (action) => {
    if (!selectedMessage) return;
    
    switch (action) {
      case 'reply':
        // Implement reply functionality
        break;
      case 'copy':
        navigator.clipboard.writeText(selectedMessage.content);
        break;
      case 'delete':
        // Implement delete message functionality
        break;
      case 'forward':
        // Implement forward functionality
        break;
      case 'download':
        // Download all attachments from the message
        if (selectedMessage.attachments && selectedMessage.attachments.length > 0) {
          // For each attachment in the message, trigger a download
          selectedMessage.attachments.forEach(async (attachment) => {
            try {
              // Check if attachment is valid before downloading
              if (!attachment || !attachment.file_url) {
                console.error("Invalid attachment data:", attachment);
                throw new Error("Missing attachment URL");
              }
              
              const result = await downloadAttachment(attachment);
              if (!result.success && result.error) {
                throw new Error(result.error);
              }
            } catch (error) {
              console.error("Error downloading attachment:", error);
              alert(`Failed to download attachment: ${error.message}`);
            }
          });
        } else {
          console.warn("No attachments found to download");
          alert("No attachments available to download");
        }
        break;
      default:
        break;
    }
    
    handleMessageMenuClose();
  };
  
  // Handle emoji menu
  const handleEmojiMenuOpen = (event) => {
    setEmojiMenuAnchor(event.currentTarget);
  };
  
  const handleEmojiMenuClose = () => {
    setEmojiMenuAnchor(null);
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    handleEmojiMenuClose();
  };
  
  // Handle scroll to bottom
  const handleScrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      setShowScrollButton(false);
    }
  };
  
  // Detect scroll position to show/hide scroll button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollButton(!isNearBottom);
  };
  
  // Render error message
  const renderErrorMessage = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 3
      }}
    >
      <ErrorOutlineIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
      <Typography variant="h6" gutterBottom align="center">
        Failed to load conversations
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" paragraph>
        Please check your internet connection and try again.
      </Typography>
      <Button 
        variant="outlined" 
        startIcon={<RefreshIcon />}
        onClick={handleRetryFetch}
      >
        Retry
      </Button>
    </Box>
  );

  // Render message bubble
  const renderMessage = (message, index, messages) => {
    const isOwnMessage = message.sender_id === user?.id;
    const showAvatar = !isOwnMessage && 
      (index === 0 || messages[index - 1].sender_id !== message.sender_id);
    const showName = !isOwnMessage && 
      (index === 0 || messages[index - 1].sender_id !== message.sender_id);
    
    // Generate a unique ID for the message if it doesn't have one
    const messageId = message.id || `temp-${Date.now()}-${index}`;
    
    return (
      <Box 
        key={messageId}
        sx={{ 
          position: 'relative',
          '&:hover .message-actions': {
            opacity: 1,
          }
        }}
      >
        <MessageBubble
          message={message}
          isOwnMessage={isOwnMessage}
          showAvatar={showAvatar}
          showName={showName}
          status={message.status || MESSAGE_STATUS.SENT}
          onRetry={message.status === MESSAGE_STATUS.FAILED ? () => handleRetryMessage(message) : undefined}
        />
        
        <Box 
          className="message-actions"
          sx={{ 
            position: 'absolute',
            top: 0,
            right: isOwnMessage ? 'auto' : 0,
            left: isOwnMessage ? 0 : 'auto',
            opacity: 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <IconButton 
            size="small"
            onClick={(e) => handleMessageMenuOpen(e, message)}
            sx={{ 
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'background.paper',
              }
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  };

  // Handler for user profile creation events
  const handleUserProfileCreated = useCallback(() => {
    console.log('User profile created, refreshing conversations');
    // Refresh conversation list
    initialLoad();
  }, [initialLoad]);
  
  // Effect to listen for window resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    
    // Listen for user profile created events
    window.addEventListener('userProfileCreated', handleUserProfileCreated);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('userProfileCreated', handleUserProfileCreated);
    };
  }, [handleUserProfileCreated]);
  
  // Set initial state based on screen size
  useEffect(() => {
    if (isMobile) {
      setShowConversationList(true);
    }
  }, [isMobile]);
  
  const handleResize = () => {
    if (window.innerWidth >= 900) { // md breakpoint
      setShowConversationList(true);
    }
  };
  
  // Load initial conversations
  useEffect(() => {
    initialLoad();
  }, [user?.id, initialLoad]);

  return (
    <Box sx={{ 
      display: 'flex', 
      height: 'calc(100vh - 64px)',
      overflow: 'hidden'
    }}>
      {/* Conversations List - Always visible on desktop, conditionally on mobile */}
      <Box
        sx={{
          width: { xs: '100%', md: 320 },
          borderRight: '1px solid',
          borderColor: 'divider',
          display: { xs: showConversationList ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" component="h1" gutterBottom>
            Messages
          </Typography>
          <TextField
            placeholder="Search messages..."
            variant="outlined"
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={() => setSearchQuery('')}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ minHeight: '48px' }}
          >
            <Tab 
              icon={<InboxIcon />} 
              label="Inbox" 
              iconPosition="start" 
              sx={{ 
                minHeight: '48px',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            />
            <Tab 
              icon={<ArchiveIcon />} 
              label="Archived" 
              iconPosition="start"
              sx={{ 
                minHeight: '48px',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            />
          </Tabs>
        </Box>
        
        {isLoadingConversations ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          renderErrorMessage()
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No conversations match your search' : 
                currentTab === 0 ? 'No conversations yet' : 'No archived conversations'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ overflow: 'auto', flexGrow: 1, p: 1 }}>
            {filteredConversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversation?.id === conversation.id}
                onClick={() => handleSelectConversation(conversation)}
                currentUserId={user?.id}
              />
            ))}
          </List>
        )}
      </Box>

      {/* Conversation Detail - Always visible on desktop, conditionally on mobile */}
      <Box
        sx={{
          flexGrow: 1,
          display: { 
            xs: !showConversationList ? 'flex' : 'none', 
            md: 'flex' 
          },
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {!activeConversation ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            p: 3
          }}>
            <Box sx={{ 
              textAlign: 'center', 
              maxWidth: 400,
              p: 3
            }}>
              <ForumIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                Select a conversation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a conversation from the list to view messages, or start a new conversation by messaging a seller about a listing.
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {/* Conversation Header */}
            <ConversationHeader 
              conversation={activeConversation}
              onBack={handleBackToList}
              isMobile={isMobile}
            />

            {/* Message List */}
            <Box
              ref={messagesContainerRef}
              onScroll={handleScroll}
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                p: 2,
                bgcolor: 'background.default',
              }}
            >
              {isLoadingMessages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : activeConversationMessages.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  p: 3
                }}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    maxWidth: 300,
                    p: 3
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      No messages yet. Send a message to start the conversation!
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <>
                  {activeConversationMessages.map((message, index, messages) => 
                    renderMessage(message, index, messages)
                  )}
                  {isTyping && <TypingIndicator />}
                </>
              )}
            </Box>

            {/* Scroll to bottom button */}
            <Zoom in={showScrollButton}>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 100,
                  right: 16,
                  zIndex: 1,
                }}
              >
                <Tooltip title="Scroll to bottom">
                  <IconButton
                    onClick={handleScrollToBottom}
                    color="primary"
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': {
                        bgcolor: 'background.paper',
                      }
                    }}
                  >
                    <ArrowBackIcon sx={{ transform: 'rotate(-90deg)' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Zoom>

            {/* Message Input */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
              }}
            >
              {sendError && (
                <Alert 
                  severity="warning" 
                  sx={{ mb: 2 }}
                  action={
                    <IconButton
                      aria-label="close"
                      color="inherit"
                      size="small"
                      onClick={handleClearSendError}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  }
                >
                  {sendError}
                </Alert>
              )}
              
              {attachments.length > 0 && (
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 2
                  }}
                >
                  {attachments.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => handleRemoveFile(index)}
                      icon={file.type.startsWith('image/') ? <ImageIcon /> : <AttachFileIcon />}
                      sx={{ maxWidth: 200 }}
                    />
                  ))}
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <Box sx={{ display: 'flex', mr: 1 }}>
                  <Tooltip title="Attach files">
                    <IconButton color="primary" onClick={() => document.getElementById('file-uploader').click()}>
                      <AttachFileIcon />
                    </IconButton>
                  </Tooltip>
                  <input
                    type="file"
                    id="file-uploader"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(Array.from(e.target.files))}
                    multiple
                  />
                  
                  <Tooltip title="Add emoji">
                    <IconButton color="primary" onClick={handleEmojiMenuOpen}>
                      <EmojiIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {/* Simple emoji menu */}
                  <Menu
                    anchorEl={emojiMenuAnchor}
                    open={Boolean(emojiMenuAnchor)}
                    onClose={handleEmojiMenuClose}
                  >
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', p: 1 }}>
                      {['😊', '👍', '❤️', '😂', '🎉', '👌', '🔥', '✨', '🙏', '😍', '😎', '🤔'].map(emoji => (
                        <IconButton key={emoji} onClick={() => handleEmojiSelect(emoji)}>
                          {emoji}
                        </IconButton>
                      ))}
                    </Box>
                  </Menu>
                </Box>
                
                <TextField
                  placeholder="Type a message..."
                  variant="outlined"
                  fullWidth
                  multiline
                  maxRows={4}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          color="primary"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() && attachments.length === 0}
                        >
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </>
        )}
      </Box>
      
      {/* Message actions menu */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={handleMessageMenuClose}
      >
        <MenuItem onClick={() => handleMessageAction('reply')}>
          <ReplyIcon fontSize="small" sx={{ mr: 1 }} /> Reply
        </MenuItem>
        <MenuItem onClick={() => handleMessageAction('copy')}>
          <CopyIcon fontSize="small" sx={{ mr: 1 }} /> Copy Text
        </MenuItem>
        <MenuItem onClick={() => handleMessageAction('forward')}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} /> Forward
        </MenuItem>
        {selectedMessage?.attachments && selectedMessage.attachments.length > 0 && (
          <MenuItem onClick={() => handleMessageAction('download')}>
            <GetAppIcon fontSize="small" sx={{ mr: 1 }} /> Download Attachments
          </MenuItem>
        )}
        {selectedMessage?.sender_id === user?.id && (
          <MenuItem onClick={() => handleMessageAction('delete')} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

export default MessagesPage; 