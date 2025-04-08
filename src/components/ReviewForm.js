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
  Chip,
  Stack,
} from '@mui/material';
import { createReview } from '../services/supabase';

const ReviewForm = ({ sellerId, listingId, reviewType = 'seller', onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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
      const formattedComment = selectedTags.length > 0
        ? `${comment.trim()}\n\n• ${selectedTags.join('\n• ')}`
        : comment.trim();

      const reviewData = {
        seller_id: sellerId,
        listing_id: listingId,
        rating: Number(rating), // 🔥 ensure it's a number
        comment: formattedComment,
        review_type: reviewType
      };

      console.log('Review being sent to backend:', reviewData); // 👀 helpful debug

      await createReview(reviewData);

      setSuccess(true);
      setRating(0);
      setComment('');
      setSelectedTags([]);
      
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

  const getTags = () => {
    return reviewType === 'seller' 
      ? ['Responsive', 'Professional', 'On time', 'Great communication']
      : ['Quality as expected', 'Accurate description', 'Good value', 'Would recommend'];
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Leave a {reviewType === 'seller' ? 'Seller' : 'Listing'} Review
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <Typography component="legend">Rating</Typography>
          <Rating
            name="rating"
            value={rating}
            onChange={(_, newValue) => {
              console.log('User picked rating:', newValue); // 🔍 helpful debug
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
          placeholder={`Share your experience with this ${reviewType}...`}
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" gutterBottom>
          Quick Tags:
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {getTags().map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => handleTagToggle(tag)}
              color={selectedTags.includes(tag) ? 'primary' : 'default'}
              variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
            />
          ))}
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

export default ReviewForm;
