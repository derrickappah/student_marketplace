import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  useTheme,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useAuth } from '../contexts/AuthContext';
import { getProductRating, getProductReviews } from '../services/productReviews';
import { createReview, upgradeReviewsTable } from '../services/supabase';

const ProductReviews = ({ listingId }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [rating, setRating] = useState({ rating: 0, count: 0 });
  const [ratingStats, setRatingStats] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  });
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [schemaUpgraded, setSchemaUpgraded] = useState(false);

  useEffect(() => {
    // Check and upgrade schema if needed
    const checkSchema = async () => {
      try {
        const result = await upgradeReviewsTable();
        console.log('Schema check result:', result);
        setSchemaUpgraded(result.success);
      } catch (err) {
        console.error('Schema upgrade error:', err);
        // Continue anyway
      }
    };
    
    checkSchema();
  }, []);

  useEffect(() => {
    const fetchRatingData = async () => {
      try {
        const [ratingData, reviewsData] = await Promise.all([
          getProductRating(listingId),
          getProductReviews(listingId)
        ]);

        setRating(ratingData);

        // Calculate rating statistics
        const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsData.data.forEach(review => {
          if (review.rating >= 1 && review.rating <= 5) {
            stats[Math.floor(review.rating)]++;
          }
        });
        setRatingStats(stats);
      } catch (err) {
        console.error('Error fetching rating data:', err);
        setError('Failed to load ratings');
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchRatingData();
    }
  }, [listingId, schemaUpgraded]);

  const handleReviewSubmit = async () => {
    if (!newReview.rating) {
      setSubmitError('Please select a rating');
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');

    try {
      // Create the review with selected tags
      const reviewText = [
        newReview.comment,
        ...selectedTags
      ].filter(Boolean).join('\n');

      console.log('Submitting review:', {
        listingId,
        rating: newReview.rating,
        comment: reviewText,
        reviewType: 'product'
      });

      await createReview({
        listingId,
        rating: newReview.rating,
        comment: reviewText,
        reviewType: 'product'
      });

      // Reset form and close dialog
      setNewReview({ rating: 0, comment: '' });
      setSelectedTags([]);
      setOpenReviewDialog(false);

      // Refresh rating data
      const [newRatingData, newReviewsData] = await Promise.all([
        getProductRating(listingId),
        getProductReviews(listingId)
      ]);
      setRating(newRatingData);

      // Recalculate stats
      const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      newReviewsData.data.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          stats[Math.floor(review.rating)]++;
        }
      });
      setRatingStats(stats);

    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitError(`Failed to submit review: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StarIcon sx={{ color: 'primary.main' }} />
        Product Reviews
      </Typography>

      {/* Summary Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left side - Overall rating */}
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 2,
            borderRadius: 1,
            bgcolor: 'background.paper'
          }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {rating.rating.toFixed(1)}
            </Typography>
            <Rating 
              value={rating.rating} 
              precision={0.5} 
              readOnly 
              size="large"
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Based on {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
            </Typography>
          </Box>
        </Grid>
        
        {/* Right side - Rating breakdown */}
        <Grid item xs={12} md={8}>
          <Box sx={{ p: 1 }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingStats[star] || 0;
              const percentage = rating.count > 0 
                ? Math.round((count / rating.count) * 100) 
                : 0;

              return (
                <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: 40 }}>
                    <Typography variant="body2">{star}</Typography>
                    <StarIcon sx={{ fontSize: 16, ml: 0.5 }} />
                  </Box>
                  <Box sx={{ 
                    flexGrow: 1, 
                    mx: 1, 
                    height: 8, 
                    bgcolor: 'grey.200',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      bgcolor: theme.palette.primary.main,
                      borderRadius: 4
                    }} />
                  </Box>
                  <Typography variant="body2" sx={{ minWidth: 40 }}>
                    {percentage}%
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Write a Review Button */}
      {user && (
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setOpenReviewDialog(true)}
          >
            Write a Review
          </Button>
        </Box>
      )}

      {/* Review Form Dialog */}
      <Dialog 
        open={openReviewDialog} 
        onClose={() => setOpenReviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review This Product</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography component="legend" sx={{ mb: 1 }}>
              Rating
            </Typography>
            <Rating
              name="rating"
              value={newReview.rating}
              onChange={(_, value) => setNewReview({ ...newReview, rating: value })}
              size="large"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your review"
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Share your experience with this product..."
              sx={{ mb: 2 }}
            />

            <Typography variant="body2" gutterBottom>
              Quick Tags:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {['Quality as expected', 'Accurate description', 'Good value', 'Would recommend'].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => handleTagToggle(tag)}
                  color={selectedTags.includes(tag) ? 'primary' : 'default'}
                  variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
            
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleReviewSubmit} 
            variant="contained"
            disabled={submitLoading}
          >
            {submitLoading ? <CircularProgress size={24} /> : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* No reviews message */}
      {rating.count === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No reviews yet. Be the first to review!
        </Typography>
      )}
    </Box>
  );
};

export default ProductReviews; 