import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Divider,
  Rating,
  Chip,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Person as PersonIcon, 
  Star as StarIcon,
  VerifiedUser as VerifiedUserIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const SellerInfoSidebarCard = ({ seller, listing }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  if (!seller) return null;
  
  const handleContactSeller = () => {
    if (!user) {
      navigate('/login', { state: { from: `/listings/${listing?.id}` } });
      return;
    }
    
    // Navigate to messages with this seller
    navigate(`/messages/new?seller=${seller.id}&listing=${listing?.id}`);
  };
  
  const memberSince = seller.created_at 
    ? new Date(seller.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    : 'Unknown';

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        About the Seller
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar 
          src={seller.avatar_url} 
          alt={seller.username || 'Seller'}
          sx={{ width: 60, height: 60, mr: 2 }}
        >
          {(seller.username || 'S').charAt(0).toUpperCase()}
        </Avatar>
        
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {seller.username || 'Anonymous'}
            {seller.is_verified && (
              <VerifiedUserIcon 
                color="primary" 
                fontSize="small" 
                sx={{ ml: 0.5, verticalAlign: 'middle' }} 
              />
            )}
          </Typography>
          
          {seller.rating > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating 
                value={seller.rating} 
                readOnly 
                size="small" 
                precision={0.5}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                ({seller.total_reviews || 0})
              </Typography>
            </Box>
          )}
          
          <Typography variant="body2" color="text.secondary">
            Member since {memberSince}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Stack spacing={1}>
        {seller.total_listings > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Active Listings
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {seller.total_listings}
            </Typography>
          </Box>
        )}
        
        {seller.response_rate > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Response Rate
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {seller.response_rate}%
            </Typography>
          </Box>
        )}
        
        {seller.response_time && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Response Time
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {seller.response_time}
            </Typography>
          </Box>
        )}
      </Stack>
      
      <Divider sx={{ my: 2 }} />
      
      <Button 
        variant="contained" 
        fullWidth 
        startIcon={<ChatIcon />}
        onClick={handleContactSeller}
        sx={{ mb: 2 }}
      >
        Contact Seller
      </Button>
      
      <Button 
        variant="outlined" 
        fullWidth
        onClick={() => navigate(`/user/${seller.id}`)}
      >
        View Profile
      </Button>
    </Paper>
  );
};

export default SellerInfoSidebarCard;