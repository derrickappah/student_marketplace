import React from 'react';
import {
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import { 
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useState } from 'react';

const AddToCartButton = ({ listing, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Handle quantity change
  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };
  
  // Increment quantity
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  // Decrement quantity
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(prev => !prev);
  };
  
  // Add to cart handler
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(listing, quantity);
    }
  };
  
  if (!listing) return null;
  
  return (
    <Box sx={{ mb: 4 }}>
      {/* Quantity selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="body1" sx={{ mr: 2 }}>
          Quantity:
        </Typography>
        
        <TextField
          value={quantity}
          onChange={handleQuantityChange}
          type="number"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton 
                  onClick={decrementQuantity} 
                  size="small"
                  disabled={quantity <= 1}
                >
                  <RemoveIcon />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={incrementQuantity} 
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              </InputAdornment>
            ),
            inputProps: { min: 1 }
          }}
          sx={{ width: '120px' }}
          size="small"
        />
      </Box>
      
      {/* Add to cart and favorite buttons */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<ShoppingCartIcon />}
          onClick={handleAddToCart}
          fullWidth
          sx={{ 
            py: 1.5,
            bgcolor: '#f57c00', 
            '&:hover': { bgcolor: '#e65100' } 
          }}
        >
          Add to cart
        </Button>
        
        <IconButton 
          onClick={toggleFavorite}
          sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            color: isFavorite ? 'error.main' : 'action.active'
          }}
        >
          {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default AddToCartButton;