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
import { hasUserReviewedProduct, getUserProductReview, updateProductReview, deleteProductReview } from '../services/productReviews';
import { useAuth } from '../contexts/AuthContext';

const ProductReviewForm = ({ sellerId, listingId, listingTitle, onSuccess }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [reviewAspects, setReviewAspects] = useState({
    qualityAsExpected: false,
    accurateDescription: false,
    goodValue: false,
    wouldRecommend: false,
  });
  const [existingReview, setExistingReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [checkingReview, setCheckingReview] = useState(true);

  // Check if user has already reviewed this product
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!user) {
        setCheckingReview(false);
        return;
      }
      
      try {
        const { data } = await getUserProductReview(listingId, user.id);
        
        if (data) {
          setExistingReview(data);
          // If in edit mode, populate the form with existing review data
          if (isEditing) {
            setRating(data.rating);
            setComment(data.comment);
            
            // Extract aspects from comment if they exist
            const aspectsFromComment = {
              qualityAsExpected: data.comment.includes('Quality as expected'),
              accurateDescription: data.comment.includes('Accurate description'),
              goodValue: data.comment.includes('Good value'),
              wouldRecommend: data.comment.includes('Would recommend')
            };
            
            setReviewAspects(aspectsFromComment);
          }
        }
      } catch (err) {
        console.error('Error checking existing review:', err);
      } finally {
        setCheckingReview(false);
      }
    };

    checkExistingReview();
  }, [user, listingId, isEditing]);

  const handleAspectToggle = (aspect) => {
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
          case 'qualityAsExpected': return 'Quality as expected';
          case 'accurateDescription': return 'Accurate description';
          case 'goodValue': return 'Good value for money';
          case 'wouldRecommend': return 'Would recommend';
          default: return '';
        }
      })
      .filter(text => text);

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
      
      if (existingReview && isEditing) {
        // Update existing review
        await updateProductReview(existingReview.id, {
          rating,
          comment: formattedComment,
        });
        setSuccess(true);
        setIsEditing(false);
      } else {
        // Create new review
        await createReview({
          sellerId,
          listingId,
          rating,
          comment: formattedComment,
          reviewType: 'product', // Specify this is a product review
        });

        setSuccess(true);
        // Refresh the existing review data
        const { data } = await getUserProductReview(listingId, user.id);
        setExistingReview(data);
      }

      // Reset form if not editing
      if (!isEditing) {
        setRating(0);
        setComment('');
        setReviewAspects({
          qualityAsExpected: false,
          accurateDescription: false,
          goodValue: false,
          wouldRecommend: false,
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting product review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setRating(0);
    setComment('');
    setReviewAspects({
      qualityAsExpected: false,
      accurateDescription: false,
      goodValue: false,
      wouldRecommend: false,
    });
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    
    setLoading(true);
    try {
      const { success, error } = await deleteProductReview(existingReview.id);
      
      if (success) {
        setExistingReview(null);
        setSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
      } else if (error) {
        setError(error);
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingReview) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // If user has already reviewed and not editing, show their review with edit/delete options
  if (existingReview && !isEditing) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Review
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Rating value={existingReview.rating} readOnly size="large" />
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {existingReview.comment}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleEdit}
            disabled={loading}
          >
            Edit Review
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete Review'}
          </Button>
        </Box>
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Your review has been updated successfully!
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }} id="product-review-form">
      <Typography variant="h6" gutterBottom>
        {isEditing ? 'Edit Your Review' : 'Review This Product'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <Typography component="legend">Rating</Typography>
          <Rating
            name="product-rating"
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
          placeholder="Share your experience with this product..."
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" gutterBottom>
          Quick Tags:
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            label="Quality as expected" 
            onClick={() => handleAspectToggle('qualityAsExpected')}
            color={reviewAspects.qualityAsExpected ? 'primary' : 'default'}
            variant={reviewAspects.qualityAsExpected ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Accurate description" 
            onClick={() => handleAspectToggle('accurateDescription')}
            color={reviewAspects.accurateDescription ? 'primary' : 'default'}
            variant={reviewAspects.accurateDescription ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Good value" 
            onClick={() => handleAspectToggle('goodValue')}
            color={reviewAspects.goodValue ? 'primary' : 'default'}
            variant={reviewAspects.goodValue ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Would recommend" 
            onClick={() => handleAspectToggle('wouldRecommend')}
            color={reviewAspects.wouldRecommend ? 'primary' : 'default'}
            variant={reviewAspects.wouldRecommend ? 'filled' : 'outlined'}
          />
        </Stack>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your product review has been submitted!
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (isEditing ? 'Update Review' : 'Submit Review')}
          </Button>
          
          {isEditing && (
            <Button
              variant="outlined"
              onClick={handleCancelEdit}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </Box>
      </form>
    </Paper>
  );
};

export default ProductReviewForm;