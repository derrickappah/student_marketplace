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
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { getUserReviews, getUserRating } from '../services/supabase';

const ReviewList = ({ userId }) => {
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState({ rating: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const [reviewsData, ratingData] = await Promise.all([
          getUserReviews(userId),
          getUserRating(userId),
        ]);

        setReviews(reviewsData.data || []);
        setUserRating(ratingData);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

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
          <Rating value={userRating.rating} precision={0.5} readOnly />
          <Typography variant="h6" sx={{ ml: 1 }}>
            {userRating.rating.toFixed(1)}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          ({userRating.count} {userRating.count === 1 ? 'review' : 'reviews'})
        </Typography>
      </Box>

      {reviews.length === 0 ? (
        <Typography color="text.secondary">
          This seller has no reviews yet.
        </Typography>
      ) : (
        <Box>
          {reviews.map((review) => (
            <Paper key={review.id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  src={review.reviewer?.avatar_url}
                  alt={review.reviewer?.name || 'User'}
                  sx={{ width: 32, height: 32, mr: 1 }}
                />
                <Typography variant="subtitle2">
                  {review.reviewer?.name || 'Anonymous'}
                </Typography>
              </Box>
              <Rating value={review.rating} size="small" readOnly />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {review.comment}
              </Typography>
              {review.listing && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1 }}
                >
                  For: {review.listing.title}
                </Typography>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                {formatDistanceToNow(new Date(review.created_at), {
                  addSuffix: true,
                })}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ReviewList; 