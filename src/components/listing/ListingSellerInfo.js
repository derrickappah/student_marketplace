import React from 'react';
import {
  Box,
  Avatar,
  Button,
  Divider,
  Chip,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Person as PersonIcon, Star as StarIcon, Verified as VerifiedIcon } from '@mui/icons-material';

const ListingSellerInfo = ({ seller }) => {
  const navigate = useNavigate();
  
  if (!seller) return null;
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar 
          src={seller.avatar_url} 
          alt={seller.username || 'Seller'}
          sx={{ width: 50, height: 50, mr: 2 }}
        >
          {(seller.username || 'S').charAt(0).toUpperCase()}
        </Avatar>
        
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {seller.username || 'Anonymous'}
            </Typography>
            {seller.verified && (
              <VerifiedIcon color="primary" fontSize="small" sx={{ ml: 0.5 }} />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Member since {new Date(seller.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
      
      {seller.rating && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Chip 
            icon={<StarIcon />} 
            label={`${seller.rating} / 5`} 
            color="primary" 
            variant="outlined" 
            size="small" 
          />
          {seller.total_reviews && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({seller.total_reviews} reviews)
            </Typography>
          )}
        </Box>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Button 
        variant="outlined" 
        fullWidth
        onClick={() => navigate(`/user/${seller.id}`)}
      >
        View Profile
      </Button>
    </Box>
  );
};

export default ListingSellerInfo;