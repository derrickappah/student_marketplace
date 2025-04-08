import React from 'react';
import {
  Box,
  Typography,
  Rating,
  LinearProgress,
  Grid,
  Divider,
  Link,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';

const ListingRatings = ({ rating, totalReviews, ratingDistribution }) => {
  // If no rating data is available
  if (!rating && !totalReviews) return null;
  
  // Default values if not provided
  const averageRating = rating || 0;
  const reviewCount = totalReviews || 0;
  
  // Default distribution if not provided
  const distribution = ratingDistribution || {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };
  
  // Calculate percentages for progress bars
  const getPercentage = (count) => {
    if (!reviewCount) return 0;
    return (count / reviewCount) * 100;
  };
  
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        {/* Left side - Average rating */}
        <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
          <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
            {averageRating.toFixed(1)}<Typography variant="h5" component="span">/5</Typography>
          </Typography>
          
          <Rating 
            value={averageRating} 
            readOnly 
            precision={0.5}
            sx={{ color: '#FF9800', mb: 1 }}
          />
          
          <Typography variant="body2" color="text.secondary">
            {reviewCount} verified ratings
          </Typography>
        </Grid>
        
        {/* Right side - Rating distribution */}
        <Grid item xs={12} sm={8}>
          {[5, 4, 3, 2, 1].map((star) => (
            <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ minWidth: '30px' }}>
                {star}
              </Typography>
              <StarIcon sx={{ fontSize: 16, color: '#FF9800', mr: 1 }} />
              <LinearProgress 
                variant="determinate" 
                value={getPercentage(distribution[star])}
                sx={{ 
                  flexGrow: 1, 
                  height: 8, 
                  borderRadius: 5,
                  backgroundColor: '#f5f5f5',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#FF9800',
                  }
                }}
              />
              <Typography variant="body2" sx={{ ml: 1, minWidth: '40px' }}>
                ({distribution[star] || 0})
              </Typography>
            </Box>
          ))}
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="#reviews" underline="hover" sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2">See All Reviews</Typography>
        </Link>
      </Box>
    </Box>
  );
};

export default ListingRatings;