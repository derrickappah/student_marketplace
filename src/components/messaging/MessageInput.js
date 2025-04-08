import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { MessageAttachmentUploader } from './';

/**
 * MessageInput component for typing and sending messages
 * 
 * @param {Object} props
 * @param {string} props.value - Current message text value
 * @param {Function} props.onChange - Callback when the input value changes
 * @param {Function} props.onSend - Callback when a message is sent
 * @param {Function} props.onTyping - Callback when user is typing
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {Array} props.attachments - Array of attachments
 * @param {Function} props.onAttachmentsChange - Callback when attachments change
 */
const MessageInput = ({
  value = '',
  onChange,
  onSend,
  onTyping,
  disabled = false,
  attachments = [],
  onAttachmentsChange
}) => {
  const [isComposing, setIsComposing] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  // Handle sending the message
  const handleSendMessage = () => {
    if ((value.trim() || attachments.length > 0) && !disabled) {
      onSend();
    }
  };
  
  // Handle key press events (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle typing events with debounce
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Trigger typing indicator with debounce
    if (onTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Send typing indication
      onTyping(true);
      
      // Clear typing indication after delay
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    }
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle composition (IME) events for languages like Chinese, Japanese, etc.
  const handleCompositionStart = () => {
    setIsComposing(true);
  };
  
  const handleCompositionEnd = () => {
    setIsComposing(false);
  };
  
  // Toggle attachments panel
  const handleToggleAttachments = () => {
    setShowAttachments(!showAttachments);
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      p: 2, 
      borderTop: '1px solid',
      borderColor: 'divider'
    }}>
      {/* Attachments area */}
      {showAttachments && (
        <Box sx={{ mb: 2 }}>
          <MessageAttachmentUploader
            attachments={attachments}
            onAttachmentsChange={onAttachmentsChange}
            disabled={disabled}
          />
        </Box>
      )}
      
      {/* Input area */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
        <Tooltip title="Add attachment">
          <IconButton 
            color={showAttachments ? "primary" : "default"} 
            onClick={handleToggleAttachments}
            disabled={disabled}
            sx={{ mr: 1 }}
          >
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Add emoji">
          <IconButton 
            color="default" 
            disabled={disabled}
            sx={{ mr: 1 }}
          >
            <EmojiEmotionsIcon />
          </IconButton>
        </Tooltip>
        
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          disabled={disabled}
          InputProps={{
            endAdornment: (
              <IconButton 
                color="primary" 
                onClick={handleSendMessage}
                disabled={disabled || (value.trim() === '' && attachments.length === 0) || isComposing}
              >
                <SendIcon />
              </IconButton>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
      </Box>
    </Box>
  );
};

export default MessageInput; 