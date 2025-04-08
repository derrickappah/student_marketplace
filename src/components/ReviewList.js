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
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';

const ReviewList = ({ 
  userId, 
  listingId, 
  reviewType = 'seller',
  onEdit,
  onDelete,
  getReviews,
  getRating,
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ rating: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const [reviewsData, ratingData] = await Promise.all([
          getReviews(reviewType === 'seller' ? userId : listingId),
          getRating(reviewType === 'seller' ? userId : listingId),
        ]);

        setReviews(reviewsData.data || []);
        setRating(ratingData);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId, listingId, reviewType]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Rating value={rating.rating} precision={0.5} readOnly />
          <Typography variant="h6" sx={{ ml: 1 }}>
            {rating.rating.toFixed(1)}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          ({rating.count} {rating.count === 1 ? 'review' : 'reviews'})
        </Typography>
      </Box>

      {reviews.length === 0 ? (
        <Typography color="text.secondary">
          No reviews yet.
        </Typography>
      ) : (
        <Box>
          {reviews.map((review) => (
            <Paper key={review.id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Avatar
                  src={review.reviewer?.avatar_url}
                  alt={review.reviewer?.name || 'User'}
                  sx={{ width: 32, height: 32, mr: 1 }}
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
                    
                    {user && review.reviewer_id === user.id && (
                      <Box>
                        <Tooltip title="Edit Review">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => onEdit(review)}
                            disabled={deleteLoading}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Review">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => onDelete(review.id)}
                            disabled={deleteLoading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                  
                  <Rating 
                    value={review.rating} 
                    readOnly 
                    size="small" 
                    precision={0.5}
                    sx={{ my: 0.5 }}
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
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ReviewList;