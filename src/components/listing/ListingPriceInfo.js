import React from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import { LocalOffer as LocalOfferIcon, Timer as TimerIcon } from '@mui/icons-material';

const ListingPriceInfo = ({ listing }) => {
  // If no listing data is available
  if (!listing || !listing.price) return null;
  
  // Format price with correct currency symbol
  const formatPrice = (price) => {
    if (typeof price !== 'number') return 'Price not available';
    
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).replace('GHS', 'GHC');
  };
  
  // Calculate discount percentage if original price exists
  const calculateDiscount = () => {
    if (!listing.original_price || listing.original_price <= listing.price) return null;
    
    const discount = ((listing.original_price - listing.price) / listing.original_price) * 100;
    return Math.round(discount);
  };
  
  const discount = calculateDiscount();
  
  return (
    <Box sx={{ mb: 3 }}>
      {/* Flash sales timer if applicable */}
      {listing.flash_sale && (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: '#e53935', 
            color: 'white',
            p: 1,
            borderRadius: 1,
            mb: 2
          }}
        >
          <TimerIcon sx={{ mr: 1 }} />
          <Typography variant="body2" fontWeight="bold">
            Flash Sales
          </Typography>
          <Box sx={{ flexGrow: 1, textAlign: 'right' }}>
            <Typography variant="body2">
              Time Left: {listing.flash_sale_time || '08h : 55m : 49s'}
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Current price */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
        <Typography variant="h4" component="div" fontWeight="bold" color="text.primary">
          {formatPrice(listing.price)}
        </Typography>
        
        {discount && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Typography 
              variant="body1" 
              component="span" 
              color="text.secondary"
              sx={{ textDecoration: 'line-through', mr: 1 }}
            >
              {formatPrice(listing.original_price)}
            </Typography>
            
            <Chip 
              label={`-${discount}%`} 
              size="small" 
              color="error"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        )}
      </Box>
      
      {/* Stock information */}
      {listing.stock_quantity && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {listing.stock_quantity} items left
            </Typography>
            {listing.stock_quantity < 20 && (
              <Typography variant="body2" color="error.main">
                Low in stock
              </Typography>
            )}
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min((listing.stock_quantity / 100) * 100, 100)}
            sx={{ 
              height: 8, 
              borderRadius: 5,
              backgroundColor: '#f5f5f5',
              '& .MuiLinearProgress-bar': {
                backgroundColor: listing.stock_quantity < 20 ? '#e53935' : '#4caf50',
              }
            }}
          />
        </Box>
      )}
      
      {/* Free delivery tag if applicable */}
      {listing.free_delivery && (
        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
          Free delivery to {listing.location || 'Tema'}
        </Typography>
      )}
    </Box>
  );
};

export default ListingPriceInfo;