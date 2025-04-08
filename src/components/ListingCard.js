import React, { useMemo, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  CardActionArea,
  CardActions,
  Tooltip,
  Badge,
  Avatar,
  useTheme,
  Skeleton,
  Grid,
  Button,
  Stack,
  Rating
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  PushPin as PushPinIcon,
  Verified as VerifiedIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  ArrowForward as ArrowForwardIcon,
  Bookmark as BookmarkIcon,
  ChatBubbleOutline as ChatIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SavedListingsButton from './SavedListingsButton';
import SellerRatingBadge from './SellerRatingBadge';
import { formatDistanceToNow } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { parseImageUrls } from '../supabaseClient';
import { getProductRating } from '../services/productReviews';
import ContactSellerButton from './ContactSellerButton';

const ListingCard = ({ 
  listing, 
  onEdit = () => console.log('Edit handler not provided'), 
  onDelete = () => console.log('Delete handler not provided'), 
  showSaveButton = true 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isOwner = user?.id === listing.user_id;
  const isDarkMode = theme.palette.mode === 'dark';
  const [productRating, setProductRating] = useState({ rating: 0, count: 0 });

  useEffect(() => {
    const fetchProductRating = async () => {
      try {
        const rating = await getProductRating(listing.id);
        setProductRating(rating);
      } catch (error) {
        console.error('Error fetching product rating:', error);
      }
    };

    fetchProductRating();
  }, [listing.id]);

  const handleClick = () => {
    navigate(`/listings/${listing.id}`);
  };

  // Format price with correct currency symbol
  const formattedPrice = typeof listing.price === 'number' 
    ? listing.price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).replace('GHS', 'GHC')
    : listing.price || 'Price not available';

  // Parse image URLs
  const imageUrls = useMemo(() => parseImageUrls(listing.images), [listing.images]);

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: isDarkMode 
          ? '0 8px 24px rgba(0,0,0,0.2)'
          : '0 8px 24px rgba(0,0,0,0.08)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: isDarkMode 
            ? '0 16px 32px rgba(0,0,0,0.3)'
            : '0 16px 32px rgba(0,0,0,0.12)',
        }
      }}
    >
      {/* Main image */}
      <Box 
        component={RouterLink} 
        to={`/listings/${listing.id}`}
        sx={{ 
          position: 'relative',
          height: 200,
          overflow: 'hidden',
          bgcolor: isDarkMode ? 'grey.900' : 'grey.100',
        }}
      >
        {imageUrls.length > 0 ? (
            <img
              src={imageUrls[0]}
              alt={listing.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder.png';
              }}
            />
        ) : (
          <Box sx={{ 
            height: '100%',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <img
              src="/placeholder.png"
              alt="No image available"
              style={{
                width: '50px',
                height: '50px',
                opacity: 0.5
              }}
            />
          </Box>
        )}
      </Box>
      
      {/* Content */}
      <CardContent sx={{ p: 2, flexGrow: 1 }}>
        {/* Title */}
        <Typography 
          variant="h6" 
          component="h3" 
          sx={{ 
            fontSize: '1rem',
            fontWeight: 600,
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {listing.title}
        </Typography>
        
        {/* Product Rating */}
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <Rating 
            value={productRating.rating} 
            precision={0.5} 
            readOnly 
            size="small"
          />
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ ml: 1 }}
          >
            ({productRating.count})
          </Typography>
        </Box>

        {/* Price */}
        <Typography 
          variant="h6" 
          color="primary"
          sx={{ 
            fontWeight: 700,
            fontSize: '1.1rem',
            mb: 2
          }}
        >
          {formattedPrice}
        </Typography>

        {/* Buttons Container */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Contact Seller Button - Conditionally render */}
          {!isOwner && (
            <ContactSellerButton
              seller={listing.seller}
              listing={listing}
              buttonText="Contact Seller"
              fullWidth
              variant="contained"
              sx={{
                flexGrow: 1,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                background: theme.palette.primary.main,
                '&:hover': {
                  background: theme.palette.primary.dark,
                }
              }}
            />
          )}

          {/* Save Listing Button */}
          {showSaveButton && !isOwner && (
            <SavedListingsButton 
              listingId={listing.id}
              variant="outlined"
              size="medium"
              sx={{ 
                minWidth: 'auto',
                borderRadius: '8px',
              }} 
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ListingCard; 