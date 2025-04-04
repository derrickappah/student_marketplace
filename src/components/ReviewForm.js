import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Rating,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { createReview } from '../services/supabase';

const ReviewForm = ({ sellerId, listingId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      await createReview({
        sellerId,
        listingId,
        rating,
        comment: comment.trim(),
      });

      setSuccess(true);
      setRating(0);
      setComment('');
      
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
        Leave a Review
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <Typography component="legend">Rating</Typography>
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
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this seller..."
          sx={{ mb: 2 }}
        />
        
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

export default ReviewForm; 