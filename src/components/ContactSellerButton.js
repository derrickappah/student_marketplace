import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createOrGetConversation } from '../services/supabase';
import ChatIcon from '@mui/icons-material/Chat';

const ContactSellerButton = ({ 
  seller, 
  listing, 
  buttonText = "Contact Seller",
  variant = "contained", 
  fullWidth = false,
  size = "medium",
  color = "primary",
  startIcon = <ChatIcon />,
  redirectToMessages = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // Early return if seller or listing is missing to prevent null reference errors
  if (!seller || !listing) {
    console.warn('ContactSellerButton: Missing required props (seller or listing)');
    return null;
  }

  const handleClickOpen = () => {
    if (!user) {
      navigate('/login', { state: { from: `/listings/${listing.id || ''}` } });
      return;
    }
    setDialogOpen(true);
    setError(null);
    
    // Suggest a default message
    if (!message) {
      // Use username or fallback to a generic greeting if name is not available
      const sellerName = seller.name || seller.username || 'there';
      setMessage(`Hi ${sellerName}, I'm interested in your listing "${listing.title || 'your item'}". Is it still available?`);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    // Reset error state when closing
    setError(null);
  };

  const handleRetry = () => {
    setError(null);
    setAttemptCount(prev => prev + 1);
    handleSend();
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    setError(null);
    
    try {
      console.log('Sending message to seller:', seller.id, 'about listing:', listing.id);
      
      // Validate required fields
      if (!seller || !seller.id) {
        throw new Error('Invalid seller information');
      }
      
      if (!listing || !listing.id) {
        throw new Error('Invalid listing information');
      }
      
      const { conversation, error } = await createOrGetConversation({
        receiverId: seller.id,
        listingId: listing.id,
        initialMessage: message
      });
      
      if (error) {
        console.error('Error from createOrGetConversation:', error);
        
        // Provide more user-friendly error messages based on the error
        if (error.includes('not authenticated')) {
          throw new Error('Please log in to send messages');
        } else if (error.includes('conversation with yourself')) {
          throw new Error('You cannot message yourself');
        } else {
          throw new Error(error);
        }
      }
      
      console.log('Message sent successfully, conversation:', conversation?.id);
      
      setDialogOpen(false);
      
      if (redirectToMessages) {
        navigate('/messages');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Set more user-friendly error message
      if (err.message.includes('network') || err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message.includes('permission') || err.message.includes('unauthorized')) {
        setError('Permission denied. You may not have access to this feature.');
      } else if (err.message.includes('invalid')) {
        setError('Invalid data provided. Please refresh and try again.');
      } else {
        setError(`Failed to send message: ${err.message}`);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button 
        variant={variant}
        color={color}
        onClick={handleClickOpen}
        fullWidth={fullWidth}
        size={size}
        startIcon={startIcon}
      >
        {buttonText}
      </Button>
      
      <Dialog 
        open={dialogOpen} 
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Contact {seller.name || seller.username || 'Seller'}</DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              About the listing:
            </Typography>
            <Typography variant="body2" gutterBottom>
              {listing.title || 'Item'} - GHC {parseFloat(listing.price || 0).toFixed(2)}
            </Typography>
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleRetry}
                  disabled={sending}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Your Message"
            fullWidth
            multiline
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            error={!!error}
            helperText={error ? "There was an error. You can edit your message and try again." : ""}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            variant="contained" 
            disabled={!message.trim() || sending}
            startIcon={sending ? <CircularProgress size={20} /> : null}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContactSellerButton;