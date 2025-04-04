import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Slider,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { createOffer } from "../services/offersService";
;

const MakeOfferForm = ({ listing, onOfferSuccess }) => {
  const [open, setOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState(listing.price);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minPrice = Math.max(1, Math.floor(listing.price * 0.5));
  const maxPrice = Math.ceil(listing.price * 1.2);
  
  const handleOpen = () => {
    setOpen(true);
    setOfferAmount(listing.price);
    setMessage('');
    setError('');
  };
  
  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createOffer({
        listingId: listing.id,
        offerAmount,
        message: message.trim(),
      });
      
      setOpen(false);
      if (onOfferSuccess) {
        onOfferSuccess();
      }
    } catch (err) {
      console.error('Error making offer:', err);
      setError(err.message || 'Failed to make offer');
    } finally {
      setLoading(false);
    }
  };

  const getOfferPercentage = () => {
    const percentage = ((offerAmount - listing.price) / listing.price) * 100;
    return percentage.toFixed(0);
  };

  const getOfferColor = () => {
    const percentage = parseInt(getOfferPercentage());
    if (percentage > 0) return 'success.main';
    if (percentage < 0) return 'error.main';
    return 'text.secondary';
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        fullWidth
      >
        Make an Offer
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Make an Offer</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Listed price: GHC {listing.price.toFixed(2)}
            </Typography>
            
            <Typography
              variant="h5"
              color={getOfferColor()}
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              GHC {offerAmount.toFixed(2)}
              <Typography
                component="span"
                variant="body2"
                color={getOfferColor()}
                sx={{ ml: 1 }}
              >
                ({getOfferPercentage()}% {offerAmount > listing.price ? 'above' : offerAmount < listing.price ? 'below' : 'same as'} asking price)
              </Typography>
            </Typography>

            <Slider
              value={offerAmount}
              min={minPrice}
              max={maxPrice}
              step={1}
              onChange={(_, newValue) => setOfferAmount(newValue)}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `GHC ${value}`}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Your Offer"
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(Math.max(1, Number(e.target.value)))}
              InputProps={{
                startAdornment: 'GHC',
              }}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Message to Seller (optional)"
              multiline
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to explain your offer..."
              sx={{ mb: 2 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Offer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MakeOfferForm; 