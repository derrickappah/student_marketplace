import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Snackbar
} from '@mui/material';
import { Link } from 'react-router-dom';
import { createTestConversations, getConversations } from '../services/supabase';

const TestMessagingPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [count, setCount] = useState(5);
  const [conversations, setConversations] = useState([]);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleGenerateConversations = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await createTestConversations(count);
      
      if (!result.success) {
        setError(result.error);
        return;
      }
      
      setSuccess(`Successfully created ${result.data.length} test conversations`);
      setShowSnackbar(true);
      
      // Load the conversations
      await loadConversations();
    } catch (err) {
      setError(err.message || 'An error occurred while creating test conversations');
    } finally {
      setLoading(false);
    }
  };
  
  const loadConversations = async () => {
    try {
      const { data, error } = await getConversations();
      
      if (error) {
        if (error.message && (
          error.message.includes('user_status does not exist') || 
          error.message.includes('read_status does not exist') ||
          error.message.includes('database schema issue')
        )) {
          setError('Database schema error: There are missing columns in the database. Please contact the administrator to update the database schema.');
        } else {
          setError('Failed to load conversations: ' + (error.message || 'Unknown error'));
        }
        return;
      }
      
      setConversations(data || []);
    } catch (err) {
      setError('Failed to load conversations: ' + (err.message || 'Unknown error'));
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Test Messaging System
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Generate Test Conversations
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          This tool will create test conversations with random users and messages to help you test the messaging system. 
          The conversations will include realistic back-and-forth messages about various topics related to marketplace listings.
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              label="Number of Conversations"
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              fullWidth
              inputProps={{ min: 1, max: 20 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              onClick={handleGenerateConversations}
              disabled={loading}
              fullWidth
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate Test Conversations'}
            </Button>
          </Grid>
        </Grid>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
      
      <Divider sx={{ my: 4 }} />
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Your Conversations
        </Typography>
        
        <Button 
          variant="outlined"
          onClick={loadConversations}
          disabled={loading}
        >
          Refresh List
        </Button>
      </Box>
      
      {conversations.length === 0 ? (
        <Card sx={{ p: 2, textAlign: 'center' }}>
          <CardContent>
            <Typography color="text.secondary">
              No conversations found. Generate some test conversations above, or go to the Messages page to start a real conversation.
            </Typography>
            <Button 
              component={Link} 
              to="/messages"
              variant="text" 
              sx={{ mt: 2 }}
            >
              Go to Messages
            </Button>
          </CardContent>
        </Card>
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {conversations.map((conversation) => (
            <ListItem 
              key={conversation.id}
              divider
              secondaryAction={
                <Button 
                  component={Link}
                  to={`/messages/${conversation.id}`}
                  size="small"
                >
                  View
                </Button>
              }
            >
              <ListItemText
                primary={conversation.otherParticipants?.[0]?.name || 'Unknown User'}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {conversation.listing?.title || 'General conversation'}
                    </Typography>
                    {' — '}
                    {conversation.latestMessage?.content?.substring(0, 60)}
                    {conversation.latestMessage?.content?.length > 60 ? '...' : ''}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        message={success}
      />
    </Container>
  );
};

export default TestMessagingPage; 