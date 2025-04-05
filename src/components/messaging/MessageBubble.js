import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Chip,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Report as ReportIcon,
  AccessTime as AccessTimeIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon,
  Share as ShareIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { MESSAGE_STATUS } from './constants';
import { downloadMessageAttachment } from '../../services/supabase';

const MessageBubble = ({
  message,
  isOwnMessage,
  showAvatar = true,
  showName = true,
  status = MESSAGE_STATUS.SENT,
  onRetry,
  onAction
}) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Get sender information consistently
  const sender = message.sender || {
    id: message.sender_id,
    name: 'Unknown User',
    avatar_url: null
  };
  
  // Get the first letter of sender's name for avatar fallback
  const senderInitial = sender.name?.charAt(0) || 'U';

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    event.stopPropagation();
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    if (onAction) {
      onAction(action, message);
    }
    handleMenuClose();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (err) {
      console.error('Date formatting error:', err);
      return '';
    }
  };

  const renderStatus = () => {
    if (!isOwnMessage) return null;

    switch (status) {
      case MESSAGE_STATUS.SENDING:
        return <CircularProgress size={12} thickness={8} sx={{ ml: 0.5 }} />;
      case MESSAGE_STATUS.SENT:
        return <CheckIcon fontSize="small" sx={{ width: 14, height: 14, color: 'text.secondary' }} />;
      case MESSAGE_STATUS.DELIVERED:
        return <DoneAllIcon fontSize="small" sx={{ width: 14, height: 14, color: 'text.secondary' }} />;
      case MESSAGE_STATUS.READ:
        return <DoneAllIcon fontSize="small" color="primary" sx={{ width: 14, height: 14 }} />;
      case MESSAGE_STATUS.FAILED:
        return (
          <Tooltip title="Failed to send. Click to retry.">
            <IconButton 
              size="small" 
              color="error" 
              onClick={onRetry}
              sx={{ p: 0, m: 0, ml: 0.5 }}
            >
              <ErrorIcon fontSize="small" sx={{ width: 14, height: 14 }} />
            </IconButton>
          </Tooltip>
        );
      default:
        return <AccessTimeIcon fontSize="small" sx={{ width: 14, height: 14, color: 'text.secondary' }} />;
    }
  };

  // Handle message with attachments
  const renderAttachments = () => {
    // Check for different possible attachment structures
    const attachmentsList = message.attachments || 
                           (message.message_images && message.message_images.length > 0 ? 
                             message.message_images.map(img => ({ 
                               file_url: img, 
                               file_name: 'Image',
                               file_type: 'image/*'
                             })) : 
                             []);
    
    if (!attachmentsList || attachmentsList.length === 0) {
      if (message.has_attachments) {
        // Message indicates it has attachments, but none are available
        console.warn("Message indicates it has attachments, but no attachments data found:", message);
        return (
          <Box sx={{ mt: 1, p: 1, bgcolor: alpha('#000', 0.05), borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              This message has attachments, but they couldn't be loaded.
            </Typography>
          </Box>
        );
      }
      return null;
    }
    
    // Function to safely handle download
    const handleDownload = async (attachment) => {
      try {
        // Validate attachment data
        if (!attachment) {
          console.error("Attempted to download undefined attachment");
          alert("Cannot download: Missing attachment data");
          return;
        }
        
        console.log("Download attachment called with:", attachment);
        
        // Try to extract file_url from various formats
        let fileUrl = attachment.file_url;
        
        if (!fileUrl) {
          // Try different property names that might contain the URL
          fileUrl = attachment.url || 
                   attachment.publicUrl || 
                   attachment.storage_url || 
                   attachment.src || 
                   attachment.link || 
                   attachment.path;
          
          // If we have a message_id and file_name but no URL, we might need to construct it
          if (!fileUrl && attachment.message_id && attachment.file_name) {
            // Try to construct a URL for Supabase storage
            const messagePath = `message_attachments/${attachment.message_id}`;
            if (attachment.id) {
              // For attachments with an ID, try to get the URL via the ID
              try {
                const { supabase } = await import('../../supabaseClient');
                const { data } = supabase.storage
                  .from('attachments')
                  .getPublicUrl(`${messagePath}/${attachment.file_name}`);
                  
                if (data?.publicUrl) {
                  fileUrl = data.publicUrl;
                  console.log("Constructed public URL:", fileUrl);
                }
              } catch (e) {
                console.error("Error constructing URL:", e);
              }
            }
          }
          
          if (!fileUrl && typeof attachment === 'string') {
            // If attachment is a direct URL string
            fileUrl = attachment;
          }
          
          if (!fileUrl) {
            console.error("Cannot find URL in attachment:", attachment);
            alert("Cannot download: Missing file URL. Please contact support with this error message.");
            return;
          }
        }
        
        // Create an enhanced attachment object with the URL we found
        const enhancedAttachment = {
          ...attachment,
          file_url: fileUrl,
          file_name: attachment.file_name || attachment.filename || 'download',
          file_type: attachment.file_type || attachment.type || 'application/octet-stream'
        };
        
        console.log("Attempting to download with:", enhancedAttachment);
        
        // Attempt to download
        const result = await downloadMessageAttachment(enhancedAttachment);
        
        if (!result.success && result.error) {
          throw new Error(result.error || "Download failed");
        }
      } catch (error) {
        console.error("Error downloading attachment:", error);
        alert(`Download failed: ${error.message}`);
      }
    };
    
    return (
      <Box sx={{ mt: 1 }}>
        {attachmentsList.map((attachment, index) => {
          // Determine if this is an image based on file type or URL pattern
          const isImage = (attachment.file_type && attachment.file_type.startsWith('image/')) ||
                         (attachment.file_url && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(attachment.file_url));
          
          // Get a URL to display/link to
          const fileUrl = attachment.file_url || attachment.url || '#';
          
          // Get a display name
          const fileName = attachment.file_name || attachment.filename || 
                         (fileUrl !== '#' ? fileUrl.split('/').pop() : 'Attachment');
          
          return (
          <Box
            key={index}
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              mt: 1,
              p: 1,
              borderRadius: 1,
              bgcolor: isOwnMessage
                ? alpha('#fff', 0.1)
                : alpha('#000', 0.05),
              textDecoration: 'none',
              color: isOwnMessage ? 'white' : 'text.primary',
              '&:hover': {
                bgcolor: isOwnMessage
                  ? alpha('#fff', 0.15)
                  : alpha('#000', 0.08),
              }
              }}
            >
              <Box
                component="a"
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textDecoration: 'none',
                  color: isOwnMessage ? 'white' : 'text.primary',
                  flexGrow: 1,
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                  {fileName}
            </Typography>
            {attachment.file_size && (
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>
                {formatFileSize(attachment.file_size)}
              </Typography>
            )}
          </Box>
              <Tooltip title="Download attachment">
                <IconButton 
                  size="small" 
                  onClick={() => handleDownload(attachment)}
                  sx={{ 
                    color: isOwnMessage ? 'rgba(255,255,255,0.8)' : 'primary.main',
                    '&:hover': {
                      color: isOwnMessage ? 'white' : 'primary.dark',
                    }
                  }}
                >
                  <GetAppIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
      </Box>
    );
  };
  
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 1.5,
        maxWidth: '90%',
        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {!isOwnMessage && showAvatar && (
          <Avatar
            src={sender.avatar_url}
            alt={sender.name}
            sx={{ width: 28, height: 28, mt: 'auto' }}
          >
            {senderInitial}
          </Avatar>
        )}

        <Paper
          elevation={0}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            maxWidth: '350px',
            backgroundColor: isOwnMessage
              ? theme => theme.palette.primary.main
              : 'background.paper',
            color: isOwnMessage ? 'white' : 'text.primary',
            position: 'relative',
            borderTopRightRadius: isOwnMessage ? 0 : undefined,
            borderTopLeftRadius: !isOwnMessage ? 0 : undefined,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
            },
          }}
        >
          {!isOwnMessage && showName && (
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 0.5, 
                display: 'block', 
                color: 'text.secondary'
              }}
            >
              {sender.name}
            </Typography>
          )}

          <Typography 
            variant="body2" 
            sx={{ 
              wordBreak: 'break-word', 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.4
            }}
          >
            {message.content}
          </Typography>

          {renderAttachments()}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: 0.5,
              gap: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              }}
            >
              {formatTime(message.created_at)}
            </Typography>
            {renderStatus()}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default MessageBubble; 