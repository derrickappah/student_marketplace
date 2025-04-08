import React from 'react';
import { Box, Chip } from '@mui/material';
import { Verified as VerifiedIcon, LocalOffer as LocalOfferIcon } from '@mui/icons-material';

const ListingBadges = ({ listing }) => {
  // Check if listing has any badges to display
  const hasBadges = listing?.is_official_store || listing?.is_deal || listing?.is_promoted;
  
  if (!hasBadges) return null;
  
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      {listing?.is_official_store && (
        <Chip
          label="Official Store"
          color="primary"
          size="small"
          icon={<VerifiedIcon />}
          sx={{
            bgcolor: '#2E7D32', // Dark green
            color: 'white',
            fontWeight: 'bold',
          }}
        />
      )}
      
      {listing?.is_deal && (
        <Chip
          label="Ghana Fest Deal"
          color="secondary"
          size="small"
          icon={<LocalOfferIcon />}
          sx={{
            bgcolor: '#FF9800', // Orange
            color: 'white',
            fontWeight: 'bold',
          }}
        />
      )}
      
      {listing?.is_promoted && (
        <Chip
          label="Featured"
          size="small"
          sx={{
            bgcolor: '#1976D2', // Blue
            color: 'white',
            fontWeight: 'bold',
          }}
        />
      )}
    </Box>
  );
};

export default ListingBadges;