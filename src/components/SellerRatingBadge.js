import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  Tooltip,
  Skeleton,
  Chip,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { getUserRating } from '../services/supabase';

const SellerRatingBadge = ({ sellerId, variant = 'default', size = 'medium' }) => {
  const [rating, setRating] = useState({ rating: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const ratingData = await getUserRating(sellerId);
        setRating({
          rating: ratingData.rating || 0,
          count: ratingData.count || 0
        });
      } catch (error) {
        console.error('Error fetching seller rating:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (sellerId) {
      fetchRating();
    }
  }, [sellerId]);
  
  if (loading) {
    return variant === 'chip' ? (
      <Skeleton variant="rounded" width={80} height={24} />
    ) : (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Skeleton variant="rounded" width={80} height={24} />
      </Box>
    );
  }
  
  // If no ratings yet
  if (rating.count === 0) {
    return variant === 'chip' ? (
      <Chip 
        label="New Seller" 
        size="small" 
        variant="outlined" 
      />
    ) : (
      <Typography variant="body2" color="text.secondary">
        New Seller
      </Typography>
    );
  }
  
  const ratingText = `${rating.rating.toFixed(1)} (${rating.count})`;
  
  if (variant === 'chip') {
    return (
      <Tooltip title={`${rating.count} ${rating.count === 1 ? 'review' : 'reviews'}`}>
        <Chip
          icon={<StarIcon sx={{ fontSize: '16px !important' }} />}
          label={ratingText}
          size="small"
          color={rating.rating >= 4 ? 'success' : rating.rating >= 3 ? 'primary' : 'default'}
        />
      </Tooltip>
    );
  }
  
  return (
    <Tooltip title={`${rating.count} ${rating.count === 1 ? 'review' : 'reviews'}`}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Rating
          value={rating.rating}
          precision={0.5}
          readOnly
          size={size === 'small' ? 'small' : 'medium'}
          sx={{ mr: 0.5 }}
        />
        <Typography
          variant={size === 'small' ? 'caption' : 'body2'}
          color="text.secondary"
        >
          ({rating.count})
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default SellerRatingBadge; 