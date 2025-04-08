import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Avatar
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { UserSelector } from './';

/**
 * Modal for creating a new conversation
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onConversationCreated - Called when a conversation is created
 */
const NewConversationModal = ({ open, onClose, onConversationCreated }) => {
  const { user } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle user selection
  const handleUserSelect = (selectedUser) => {
    if (!selectedUser) return;
    
    // Check if user is already selected
    const isAlreadySelected = selectedUsers.some(u => u.id === selectedUser.id);
    if (isAlreadySelected) return;
    
    setSelectedUsers([...selectedUsers, selectedUser]);
  };
  
  // Handle user removal
  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };
  
  // Create a new conversation
  const handleCreateConversation = async () => {
    // Validate
    if (!user) {
      setError('You must be logged in to start a conversation');
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to message');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Get all participant IDs (including current user)
      const participantIds = [user.id, ...selectedUsers.map(u => u.id)];
      
      // Create the conversation with minimal fields
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          // Include only timestamp field which is likely to exist
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (conversationError) throw conversationError;
      
      // Add participants - this is the important part that defines who's in the conversation
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(
          participantIds.map(userId => ({
            conversation_id: conversationData.id,
            user_id: userId
          }))
        );
      
      if (participantsError) throw participantsError;
      
      // Add initial message if provided
      if (message.trim()) {
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationData.id,
            sender_id: user.id,
            content: message.trim()
          });
        
        if (messageError) throw messageError;
      }
      
      // Get the created conversation details with all related data
      const { data: fullConversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            user:users(id, name, avatar_url, email)
          ),
          messages:messages(
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .eq('id', conversationData.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Process the conversation data
      const otherParticipants = fullConversation.participants
        .filter(p => p.user && p.user_id !== user.id)
        .map(p => p.user);
      
      const processedConversation = {
        ...fullConversation,
        otherParticipants,
        unreadCount: 0
      };
      
      // Call the callback with the new conversation
      if (onConversationCreated) {
        onConversationCreated(processedConversation);
      }
      
      // Reset form
      setSelectedUsers([]);
      setMessage('');
      
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle close
  const handleClose = () => {
    // Reset state
    setError('');
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>New Conversation</DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Select Users
          </Typography>
          
          <UserSelector
            onUserSelect={handleUserSelect}
            excludedUserIds={[user?.id, ...selectedUsers.map(u => u.id)]}
            placeholder="Search for users..."
          />
          
          {selectedUsers.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedUsers.map((selectedUser) => (
                <Chip
                  key={selectedUser.id}
                  avatar={<Avatar alt={selectedUser.name} src={selectedUser.avatar_url} />}
                  label={selectedUser.name || selectedUser.email}
                  onDelete={() => handleRemoveUser(selectedUser.id)}
                />
              ))}
            </Box>
          )}
        </Box>
        
        <TextField
          label="Initial message (optional)"
          multiline
          rows={3}
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          placeholder="Write your first message..."
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateConversation} 
          variant="contained" 
          disabled={loading || selectedUsers.length === 0}
          color="primary"
        >
          {loading ? <CircularProgress size={24} /> : 'Start Conversation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewConversationModal; 