import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Rating,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Checkbox,
  FormControlLabel,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { createReview } from '../services/supabase';

const PurchaseReviewForm = ({ 
  sellerId, 
  sellerName, 
  listingId, 
  listingTitle, 
  transactionDate,
  onSuccess 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [reviewAspects, setReviewAspects] = useState({
    itemAsDescribed: false,
    fairPrice: false,
    quickResponse: false,
    goodCommunication: false,
    smoothTransaction: false,
  });

  const handleAspectChange = (aspect) => {
    setReviewAspects({
      ...reviewAspects,
      [aspect]: !reviewAspects[aspect]
    });
  };

  const formatCommentWithAspects = () => {
    const selectedAspects = Object.entries(reviewAspects)
      .filter(([_, selected]) => selected)
      .map(([key, _]) => {
        switch(key) {
          case 'itemAsDescribed': return 'Item was as described';
          case 'fairPrice': return 'Price was fair';
          case 'quickResponse': return 'Quick responses';
          case 'goodCommunication': return 'Good communication';
          case 'smoothTransaction': return 'Smooth transaction';
          default: return '';
        }
      })
      .filter(text => text); // Remove any empty strings

    // If there are selected aspects and user comment, combine them
    if (selectedAspects.length > 0) {
      const aspectsText = '• ' + selectedAspects.join('\n• ');
      return comment.trim() ? `${comment.trim()}\n\n${aspectsText}` : aspectsText;
    }
    
    return comment.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const formattedComment = formatCommentWithAspects();
      
      await createReview({
        sellerId,
        listingId,
        rating,
        comment: formattedComment,
      });

      setSuccess(true);
      setRating(0);
      setComment('');
      setReviewAspects({
        itemAsDescribed: false,
        fairPrice: false,
        quickResponse: false,
        goodCommunication: false,
        smoothTransaction: false,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Review Your Purchase
      </Typography>
      
      {listingTitle && (
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={listingTitle} 
            color="primary" 
            variant="outlined" 
            size="small" 
          />
        </Box>
      )}
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Share your experience with {sellerName || 'this seller'} to help other buyers.
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Typography component="legend">How would you rate this transaction?</Typography>
          <Rating
            name="rating"
            value={rating}
            onChange={(_, newValue) => {
              setRating(newValue);
            }}
            precision={1}
            size="large"
          />
        </Box>
        
        <TextField
          fullWidth
          label="Review"
          multiline
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share details of your experience with this seller..."
          sx={{ mb: 3 }}
        />
        
        <Typography component="legend" sx={{ mb: 1 }}>
          Select all that apply:
        </Typography>
        
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
          <FormControlLabel 
            control={
              <Checkbox 
                checked={reviewAspects.itemAsDescribed}
                onChange={() => handleAspectChange('itemAsDescribed')}
                size="small"
              />
            }
            label="Item as described"
          />
          <FormControlLabel 
            control={
              <Checkbox 
                checked={reviewAspects.fairPrice}
                onChange={() => handleAspectChange('fairPrice')}
                size="small"
              />
            }
            label="Fair price"
          />
          <FormControlLabel 
            control={
              <Checkbox 
                checked={reviewAspects.quickResponse}
                onChange={() => handleAspectChange('quickResponse')}
                size="small"
              />
            }
            label="Quick responses"
          />
          <FormControlLabel 
            control={
              <Checkbox 
                checked={reviewAspects.goodCommunication}
                onChange={() => handleAspectChange('goodCommunication')}
                size="small"
              />
            }
            label="Good communication"
          />
          <FormControlLabel 
            control={
              <Checkbox 
                checked={reviewAspects.smoothTransaction}
                onChange={() => handleAspectChange('smoothTransaction')}
                size="small"
              />
            }
            label="Smooth transaction"
          />
        </Stack>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your review has been submitted!
          </Alert>
        )}
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ mt: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit Review'}
        </Button>
      </form>
    </Paper>
  );
};

export default PurchaseReviewForm; 