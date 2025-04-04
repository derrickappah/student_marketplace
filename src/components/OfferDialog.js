import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import { createOffer } from '../services/supabase';

const OfferDialog = ({ open, onClose, listing }) => {
  const [offerData, setOfferData] = useState({
    amount: listing ? listing.price * 0.9 : 0, // Default offer is 90% of list price
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOfferData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async () => {
    if (offerData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await createOffer({
        listingId: listing.id, 
        offerAmount: offerData.amount, 
        message: offerData.message
      });
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setOfferData({
          amount: 0,
          message: '',
        });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error submitting offer');
      console.error('Error making offer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Make an Offer</DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            Your offer has been sent successfully!
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Listing: {listing?.title}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Listed Price: GHC {listing?.price.toFixed(2)}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Your Offer"
              name="amount"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">GHC</InputAdornment>,
              }}
              value={offerData.amount}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Message to Seller (Optional)"
              name="message"
              multiline
              rows={4}
              value={offerData.message}
              onChange={handleChange}
              margin="normal"
              placeholder="Explain your offer, ask questions, or suggest a meeting place..."
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {!success && (
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading || offerData.amount <= 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Offer'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OfferDialog; 