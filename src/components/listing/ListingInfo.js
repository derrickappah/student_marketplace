import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import {
  Category as CategoryIcon,
  LocalOffer as LocalOfferIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const ListingInfo = ({ listing }) => {
  if (!listing) return null;
  
  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Listing Details
      </Typography>
      
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {listing.category && (
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CategoryIcon color="action" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  {listing.category}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}
        
        {listing.condition && (
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon color="action" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Condition
                </Typography>
                <Typography variant="body1">
                  {listing.condition}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}
        
        {listing.location && (
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationIcon color="action" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1">
                  {listing.location}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}
        
        {listing.tags && listing.tags.length > 0 && (
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Array.isArray(listing.tags) ? 
                listing.tags.map((tag, index) => (
                  <Chip 
                    key={index} 
                    label={tag} 
                    size="small" 
                    icon={<LocalOfferIcon />}
                  />
                )) : 
                typeof listing.tags === 'string' ? 
                  listing.tags.split(',').map((tag, index) => (
                    <Chip 
                      key={index} 
                      label={tag.trim()} 
                      size="small" 
                      icon={<LocalOfferIcon />}
                    />
                  )) : null
              }
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default ListingInfo;