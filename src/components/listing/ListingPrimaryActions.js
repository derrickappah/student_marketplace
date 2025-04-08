import React from 'react';
import {
  Box,
  Button,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Chat as ChatIcon, LocalOffer as OfferIcon } from '@mui/icons-material';

const ListingPrimaryActions = ({ listing, isOwner }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  
  if (!listing) return null;
  
  const handleContactSeller = () => {
    if (!user) {
      navigate('/login', { state: { from: `/listings/${listing.id}` } });
      return;
    }
    
    // Navigate to messages with this seller or create a new conversation
    navigate(`/messages/new?seller=${listing.user_id}&listing=${listing.id}`);
  };
  
  const handleMakeOffer = () => {
    if (!user) {
      navigate('/login', { state: { from: `/listings/${listing.id}` } });
      return;
    }
    
    // Open offer dialog or navigate to offer page
    // This would depend on your app's implementation
  };

  return (
    <Box sx={{ mb: 3 }}>
      {isOwner ? (
        <>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Listing Management
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
          <Button 
            variant="contained" 
            fullWidth 
            sx={{ mb: 2 }}
            startIcon={<ChatIcon />}
            onClick={handleContactSeller}
          >
            Contact Seller
          </Button>
          
          <Button 
            variant="outlined" 
            fullWidth
            startIcon={<OfferIcon />}
            onClick={handleMakeOffer}
          >
            Make an Offer
          </Button>
        </>
      )}
    </Box>
  );
};

export default ListingPrimaryActions;