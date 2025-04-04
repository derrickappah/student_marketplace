import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Alert, 
  CircularProgress,
  Snackbar
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "../services/supabase";

const reportReasons = [
  'Inappropriate content',
  'Scam or fraud',
  'Harmful behavior',
  'Counterfeit product',
  'Offensive messaging',
  'Suspicious activity',
  'Policy violation',
  'Other'
];

const ReportForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reportType, itemId, itemData } = location.state || {};
  
  const [formData, setFormData] = useState({
    reason: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  if (!reportType || !itemId) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Error</Typography>
          <Alert severity="error">
            Invalid report request. Please try again from the item you want to report.
          </Alert>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </Paper>
      </Container>
    );
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason) {
      setError('Please select a reason for reporting');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to submit a report');
        setLoading(false);
        return;
      }
      
      const reportData = {
        reporter_id: user.id,
        reason: formData.reason,
        description: formData.description,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      // Add the appropriate ID field based on report type
      switch (reportType) {
        case 'user':
          reportData.reported_user_id = itemId;
          break;
        case 'listing':
          reportData.listing_id = itemId;
          break;
        case 'message':
          reportData.message_id = itemId;
          break;
        default:
          setError('Invalid report type');
          setLoading(false);
          return;
      }
      
      const { error: submitError } = await supabase
        .from('reports')
        .insert([reportData]);
      
      if (submitError) throw submitError;
      
      setSuccess(true);
      setFormData({
        reason: '',
        description: ''
      });
      
      // Automatically go back after 3 seconds
      setTimeout(() => {
        navigate(-1);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Report {reportType === 'user' ? 'User' : reportType === 'listing' ? 'Listing' : 'Message'}
        </Typography>
        
        {itemData && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              You are reporting:
            </Typography>
            <Typography variant="body2">
              {reportType === 'user' && `User: ${itemData.name || 'Unknown user'}`}
              {reportType === 'listing' && `Listing: ${itemData.title || 'Unknown listing'}`}
              {reportType === 'message' && `Message from: ${itemData.sender || 'Unknown sender'}`}
            </Typography>
          </Box>
        )}
        
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="reason-label">Reason for reporting</InputLabel>
            <Select
              labelId="reason-label"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              label="Reason for reporting"
              required
            >
              {reportReasons.map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {reason}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            name="description"
            label="Additional details (optional)"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            fullWidth
            sx={{ mb: 3 }}
          />
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
          
          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
        </form>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Report submitted successfully"
      />
    </Container>
  );
};

export default ReportForm; 