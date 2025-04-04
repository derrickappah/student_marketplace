import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Email as EmailIcon,
  EmailOutlined as NewEmailIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getContactMessages, updateContactMessageStatus, deleteContactMessage } from "../../services/supabase";
import { supabase } from "../../services/supabase";

const ContactMessages = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResponseDialog, setOpenResponseDialog] = useState(false);
  const [responseNotes, setResponseNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const channelRef = useRef(null);

  // This effect is for fetching messages when page, rowsPerPage, or filterStatus changes
  useEffect(() => {
    fetchMessages();
  }, [page, rowsPerPage, filterStatus]);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getContactMessages({
        status: filterStatus || null,
        page: page + 1,
        limit: rowsPerPage
      });
      
      if (result.error) {
        setError(result.error);
        setMessages([]);
      } else {
        setMessages(result.data || []);
        setTotalCount(result.count || 0);
      }
    } catch (err) {
      setError('Failed to load contact messages. Please try again.');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // This effect is for setting up real-time subscription
  useEffect(() => {
    // Set up real-time listener for new contact messages
    const setupRealtimeListener = () => {
      // Clean up any existing channel
      if (channelRef.current && channelRef.current.unsubscribe) {
        channelRef.current.unsubscribe();
      }
      
      // Create a new subscription channel for contact messages
      const channel = supabase
        .channel('admin-contact-messages')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'contact_messages' }, 
          (payload) => {
            console.log('Contact messages table updated:', payload);
            
            // Check the event type and update the UI accordingly
            if (payload.eventType === 'INSERT') {
              // If we're on the first page and showing all or 'new' messages, 
              // add this to our list and update the total count
              if (page === 0 && (!filterStatus || filterStatus === 'new')) {
                const newMessage = payload.new;
                if (newMessage) {
                  setMessages(prevMessages => [newMessage, ...prevMessages]);
                  setTotalCount(prevCount => prevCount + 1);
                  
                  // Show a notification about the new message
                  setSuccess('New contact message received!');
                  setTimeout(() => setSuccess(null), 5000); // Clear after 5 seconds
                }
              } else {
                // Otherwise just show a notification for refresh
                setSuccess('New contact message received! Refresh to view.');
                setTimeout(() => setSuccess(null), 5000);
              }
            } else if (payload.eventType === 'DELETE') {
              // If a message is deleted, remove it from our list if it exists
              const deletedId = payload.old?.id;
              if (deletedId) {
                setMessages(prevMessages => 
                  prevMessages.filter(message => message.id !== deletedId)
                );
                setTotalCount(prevCount => Math.max(0, prevCount - 1));
              }
            } else if (payload.eventType === 'UPDATE') {
              // If a message is updated, update it in our list if it exists
              const updatedMessage = payload.new;
              if (updatedMessage) {
                setMessages(prevMessages => 
                  prevMessages.map(message => 
                    message.id === updatedMessage.id ? updatedMessage : message
                  )
                );
              }
            }
          }
        )
        .subscribe();
      
      // Store the channel for cleanup
      channelRef.current = channel;
    };
    
    setupRealtimeListener();
    
    // Clean up subscription on unmount
    return () => {
      if (channelRef.current && channelRef.current.unsubscribe) {
        channelRef.current.unsubscribe();
      }
    };
  }, [page, filterStatus]);  // Include dependencies that are used in the subscription callback

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetails = (message) => {
    setSelectedMessage(message);
    setOpenDetailsDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDetailsDialog(false);
    setOpenDeleteDialog(false);
    setOpenResponseDialog(false);
    setResponseNotes('');
  };

  const handleOpenDelete = (message) => {
    setSelectedMessage(message);
    setOpenDeleteDialog(true);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    
    setLoading(true);
    try {
      const result = await deleteContactMessage(selectedMessage.id);
      
      if (result.success) {
        setSuccess('Message deleted successfully');
        // Remove the deleted message from the list
        setMessages(messages.filter(m => m.id !== selectedMessage.id));
        setTotalCount(prevCount => prevCount - 1);
        handleCloseDialog();
      } else {
        setError(result.error || 'Failed to delete message');
      }
    } catch (err) {
      setError('An error occurred while deleting the message');
      console.error('Error deleting message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponse = (message) => {
    setSelectedMessage(message);
    setResponseNotes(message.notes || '');
    setOpenResponseDialog(true);
  };

  const handleMarkAsResponded = async () => {
    if (!selectedMessage) return;
    
    setLoading(true);
    try {
      const result = await updateContactMessageStatus(
        selectedMessage.id, 
        'responded', 
        responseNotes
      );
      
      if (result.success) {
        setSuccess('Message marked as responded');
        // Update the message in the list
        setMessages(messages.map(m => 
          m.id === selectedMessage.id 
            ? { ...m, status: 'responded', notes: responseNotes, responded_at: new Date().toISOString() } 
            : m
        ));
        handleCloseDialog();
      } else {
        setError(result.error || 'Failed to update message status');
      }
    } catch (err) {
      setError('An error occurred while updating the message');
      console.error('Error updating message:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilter = () => {
    setFilterStatus('');
    setPage(0);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'new':
        return <Chip label="New" color="primary" size="small" icon={<NewEmailIcon />} />;
      case 'responded':
        return <Chip label="Responded" color="success" size="small" icon={<MarkEmailReadIcon />} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Calculate if we have messages to show
  const hasMessages = messages && messages.length > 0;

  return (
    <Container maxWidth="xl" sx={{ py: 3, mt: 2 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
            <EmailIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Contact Messages
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={fetchMessages}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="status-filter-label">Filter Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter Status"
                disabled={loading}
              >
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="responded">Responded</MenuItem>
              </Select>
            </FormControl>
            
            {filterStatus && (
              <IconButton 
                size="small" 
                onClick={resetFilter} 
                sx={{ ml: 1 }}
                color="primary"
              >
                <ClearIcon />
              </IconButton>
            )}
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Topic</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                      Loading messages...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : !hasMessages ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      No messages found
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      {filterStatus 
                        ? `Try clearing the "${filterStatus}" filter`
                        : 'No contact messages have been submitted yet'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow 
                    key={message.id}
                    hover
                    sx={{ 
                      '&:hover': { cursor: 'pointer' },
                      bgcolor: message.status === 'new' ? alpha(theme.palette.primary.light, 0.1) : 'inherit'
                    }}
                    onClick={() => handleOpenDetails(message)}
                  >
                    <TableCell>
                      {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>{message.name}</TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell>{message.topic}</TableCell>
                    <TableCell>{getStatusChip(message.status)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Respond">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenResponse(message);
                            }}
                          >
                            <MarkEmailReadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDelete(message);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Message Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedMessage && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Message from {selectedMessage.name}
                </Typography>
                {getStatusChip(selectedMessage.status)}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    From
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedMessage.name} ({selectedMessage.email})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {format(new Date(selectedMessage.created_at), 'MMMM d, yyyy h:mm a')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Topic
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedMessage.topic}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedMessage.status === 'responded' 
                      ? `Responded on ${format(new Date(selectedMessage.responded_at || Date.now()), 'MMMM d, yyyy')}`
                      : 'Awaiting response'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Message
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, minHeight: '100px', bgcolor: 'background.default' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedMessage.message}
                    </Typography>
                  </Paper>
                </Grid>
                
                {selectedMessage.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Response Notes
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedMessage.notes}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>
                Close
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  handleCloseDialog();
                  handleOpenResponse(selectedMessage);
                }}
                color="primary"
                startIcon={<MarkEmailReadIcon />}
                disabled={loading}
              >
                {selectedMessage.status === 'responded' ? 'Update Response' : 'Mark as Responded'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Delete Message</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this message from {selectedMessage?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteMessage} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Response Dialog */}
      <Dialog
        open={openResponseDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedMessage?.status === 'responded' ? 'Update Response' : 'Mark as Responded'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Record notes about how this message was handled or responded to.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="notes"
            label="Response Notes"
            fullWidth
            variant="outlined"
            multiline
            rows={6}
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
            placeholder="Enter details about the response provided to this message..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleMarkAsResponded} 
            color="primary" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <MarkEmailReadIcon />}
          >
            {selectedMessage?.status === 'responded' ? 'Update Response' : 'Mark as Responded'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Helper function to create transparent color
const alpha = (color, opacity) => {
  return theme => {
    const rgbValues = theme.palette[color]?.main 
      ? theme.palette[color].main
      : color;
    return rgbValues.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  };
};

export default ContactMessages; 