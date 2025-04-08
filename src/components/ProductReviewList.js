import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  Avatar,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Button,
  IconButton,
  Tooltip,
  
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDistanceToNow } from 'date-fns';
import { getProductReviews, getProductRating, deleteProductReview } from '../services/productReviews';
import { upgradeReviewsTable } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

const ProductReviewList = ({ listingId, refreshTrigger }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [productRating, setProductRating] = useState({ rating: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [debug, setDebug] = useState(null);

  // Function to force refresh the reviews
  const refreshReviews = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  useEffect(() => {
    // Check and upgrade schema if needed
    const checkSchema = async () => {
      try {
        const result = await upgradeReviewsTable();
        console.log('Schema check result:', result);
        // Refresh after schema upgrade
        if (result.success) {
          refreshReviews();
        }
      } catch (err) {
        console.error('Schema upgrade error:', err);
        // Continue anyway
      }
    };
    
    checkSchema();
  }, []);

  useEffect(() => {
    const fetchProductReviews = async () => {
      try {
        if (!listingId) {
          throw new Error('Listing ID is required');
        }

        setLoading(true);
        console.log('Fetching product reviews for listing:', listingId);

        // Fetch reviews and rating for this specific listing
        const [reviewsData, ratingData] = await Promise.all([
          getProductReviews(listingId),
          getProductRating(listingId),
        ]);

        console.log('Reviews data:', reviewsData);
        console.log('Rating data:', ratingData);
        
        setDebug({
          reviewsData: reviewsData,
          ratingData: ratingData
        });

        setReviews(reviewsData.data || []);
        setProductRating(ratingData);
      } catch (err) {
        console.error('Error fetching product reviews:', err);
        setError(`Failed to load product reviews: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchProductReviews();
    }
  }, [listingId, refreshKey, refreshTrigger]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <>
        <Alert severity="error">{error}</Alert>
        {debug && (
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="subtitle2">Debug Info:</Typography>
            <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
              {JSON.stringify(debug, null, 2)}
            </pre>
          </Paper>
        )}
      </>
    );
  }

  const handleDeleteReview = async (reviewId) => {
    if (!user) return;
    
    setDeleteLoading(true);
    setActionSuccess('');
    setError('');
    
    try {
      const { success, error } = await deleteProductReview(reviewId);
      
      if (success) {
        setActionSuccess('Review deleted successfully');
        // Refresh the reviews list
        refreshReviews();
      } else if (error) {
        setError(error);
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Typography variant="h4" component="span" sx={{ mr: 1 }}>
            {productRating.rating.toFixed(1)}
          </Typography>
          <StarIcon color="primary" />
        </Box>
        
        <Box>
          <Rating value={productRating.rating} precision={0.5} readOnly sx={{ mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            Based on {productRating.count} {productRating.count === 1 ? 'review' : 'reviews'}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />

      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess('')}>
          {actionSuccess}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {reviews.length === 0 ? (
        <Typography color="text.secondary">
          This product has no reviews yet.
        </Typography>
      ) : (
        <Box>
          {reviews.map((review) => (
            <Box key={review.id} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Avatar
                  src={review.reviewer?.avatar_url}
                  alt={review.reviewer?.name || 'User'}
                  sx={{ width: 40, height: 40, mr: 2 }}
                >
                  {(review.reviewer?.name || 'U').charAt(0).toUpperCase()}
                </Avatar>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">
                      {review.reviewer?.name || 'Anonymous'}
                      {user && review.reviewer_id === user.id && (
                        <Chip 
                          size="small" 
                          label="Your Review" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Typography>
                    
                    <Box>
                      {user && review.reviewer_id === user.id && (
                        <>
                          <Tooltip title="Edit Review">
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => window.location.href = `#product-review-form`}
                              disabled={deleteLoading}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Review">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteReview(review.id)}
                              disabled={deleteLoading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                  
                  <Rating 
                    value={review.rating} 
                    readOnly 
                    size="small" 
                    precision={0.5}
                    sx={{ my: 0.5 }}
                  />
                  
                  <Chip 
                    label="Product Review" 
                    size="small" 
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                  
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                    {review.comment}
                  </Typography>
                  
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {review.updated_at && review.updated_at !== review.created_at ? (
                      <>Updated {formatDistanceToNow(new Date(review.updated_at), { addSuffix: true })}</>
                    ) : (
                      formatDistanceToNow(new Date(review.created_at), { addSuffix: true })
                    )}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProductReviewList;