import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import { LocalShipping as ShippingIcon, LocationOn as LocationIcon } from '@mui/icons-material';

const ListingPromotions = ({ listing }) => {
  // If no listing data is available
  if (!listing) return null;
  
  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        PROMOTIONS
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ShippingIcon sx={{ color: 'orange', mr: 2 }} />
        <Typography variant="body1">
          Enjoy cheaper delivery fees when you select a pickup station at checkout
        </Typography>
      </Box>
      
      {listing.free_delivery && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ShippingIcon sx={{ color: 'orange', mr: 2 }} />
          <Typography variant="body1">
            Free Delivery in Accra and Kumasi for Orders above GHC150. Pick-up stations only! (Excluding Large)
          </Typography>
        </Box>
      )}
      
      {listing.location && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocationIcon sx={{ color: 'orange', mr: 2 }} />
          <Typography variant="body1">
            Free delivery to {listing.location}
          </Typography>
        </Box>
      )}
      
      {listing.special_offer && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              color: 'orange', 
              mr: 2,
              fontWeight: 'bold',
              fontSize: '1.5rem'
            }}
          >
            %
          </Box>
          <Typography variant="body1">
            {listing.special_offer}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ListingPromotions;