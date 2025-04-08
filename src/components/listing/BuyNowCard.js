 import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const BuyNowCard = ({ listing, isOwner }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  
  if (!listing) return null;
  
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

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="h5" gutterBottom>
        {formatPrice(listing.price)}
      </Typography>
      
      {isOwner ? (
        <>
          <Typography variant="body2" color="text.secondary" paragraph>
            This is your listing. You can edit or delete it.
          </Typography>
          <Button 
            variant="contained" 
            fullWidth 
            sx={{ mb: 2 }}
            onClick={() => navigate(`/listings/edit/${listing.id}`)}
          >
            Edit Listing
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            fullWidth
            onClick={() => {
              // Add delete confirmation logic here
              if (window.confirm('Are you sure you want to delete this listing?')) {
                // Delete logic
              }
            }}
          >
            Delete Listing
          </Button>
        </>
      ) : (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Button 
            variant="contained" 
            fullWidth 
            sx={{ mb: 2 }}
            onClick={() => {
              if (!user) {
                navigate('/login', { state: { from: `/listings/${listing.id}` } });
                return;
              }
              // Add contact seller logic
            }}
          >
            Contact Seller
          </Button>
          
          <Button 
            variant="outlined" 
            fullWidth
            onClick={() => {
              if (!user) {
                navigate('/login', { state: { from: `/listings/${listing.id}` } });
                return;
              }
              // Add make offer logic
            }}
          >
            Make an Offer
          </Button>
        </>
      )}
    </Paper>
  );
};

export default BuyNowCard;