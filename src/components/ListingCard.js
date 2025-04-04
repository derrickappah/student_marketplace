import React from 'react';
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
  Stack
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

  const handleClick = () => {
    navigate(`/listings/${listing.id}`);
  };

  // Create a formatted date for time ago display
  const timeAgo = listing.created_at 
    ? formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })
    : '';

  // Format price with correct currency symbol
  const formattedPrice = typeof listing.price === 'number' 
    ? listing.price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).replace('GHS', 'GHC')
    : listing.price || 'Price not available';

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        background: isDarkMode 
          ? `linear-gradient(145deg, ${alpha('#1a202c', 0.95)}, ${alpha('#0d1117', 0.97)})`
          : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
        boxShadow: isDarkMode 
          ? '0 10px 30px rgba(0,0,0,0.25)'
          : '0 10px 30px rgba(0,0,0,0.08)',
        '&:hover': {
          transform: 'translateY(-12px) scale(1.02)',
          boxShadow: isDarkMode 
            ? '0 20px 40px rgba(0,0,0,0.4)'
            : '0 20px 40px rgba(0,0,0,0.12)',
          '& .media-overlay': {
            opacity: 1,
          },
          '& .media-image': {
            transform: 'scale(1.08)',
          },
          '& .card-actions': {
            opacity: 1,
            transform: 'translateY(0)',
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: '1px',
          background: isDarkMode 
            ? 'linear-gradient(to bottom right, rgba(255,255,255,0.12), rgba(255,255,255,0.03))'
            : 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0.2))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          zIndex: 2,
        },
        border: isDarkMode ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
      }}
    >
      {/* Top badge row with multiple badges */}
      <Box sx={{ 
        position: 'absolute', 
        top: 12, 
        left: 12, 
        zIndex: 5, 
        display: 'flex', 
        gap: 1,
        flexWrap: 'wrap',
        maxWidth: '70%'
      }}>
        {listing.is_featured && listing.promotion_status === 'approved' && (
          <Chip 
            icon={<StarIcon fontSize="small" />}
            label="Featured"
            size="small"
            color="warning"
            sx={{ 
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '8px',
              background: 'linear-gradient(45deg, #ff9800, #ed6c02)',
              color: 'white',
              height: '24px',
              '& .MuiChip-icon': {
                color: 'white',
                marginLeft: '4px',
              },
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
        
        {listing.is_priority && listing.promotion_status === 'approved' && (
          <Chip 
            icon={<PushPinIcon fontSize="small" />}
            label="Priority"
            size="small"
            color="info"
            sx={{ 
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '8px',
              background: 'linear-gradient(45deg, #0288d1, #03a9f4)',
              color: 'white',
              height: '24px',
              '& .MuiChip-icon': {
                color: 'white',
                marginLeft: '4px',
              },
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
        
        {/* Add condition badge to the top row */}
        {listing.condition && (
          <Chip
            label={listing.condition}
            size="small"
            color={listing.condition === 'new' ? 'success' : 'default'}
            sx={{
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
              height: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              letterSpacing: '0.03em',
              textTransform: 'capitalize',
              ...(listing.condition === 'new' 
                ? { 
                    background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
                    color: 'white',
                  } 
                : { 
                    bgcolor: isDarkMode ? alpha('#424242', 0.85) : alpha('#f5f5f5', 0.85), 
                    color: isDarkMode ? '#fff' : '#333',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  }
              ),
            }}
          />
        )}
      </Box>

      {/* Seller avatar */}
      {listing.users?.avatar_url && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 5 }}>
          <Tooltip title={`Seller: ${listing.users.name || 'User'}`}>
            <Avatar 
              src={listing.users.avatar_url} 
              sx={{ 
                width: 38, 
                height: 38,
                border: '2px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }} 
            />
          </Tooltip>
        </Box>
      )}

      {/* Main card content */}
      <Box 
        component={RouterLink} 
        to={`/listings/${listing.id}`}
        sx={{ 
          position: 'relative',
          height: 220,
          overflow: 'hidden',
          bgcolor: isDarkMode ? alpha(theme.palette.primary.dark, 0.1) : alpha(theme.palette.primary.light, 0.1),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        {listing.images && listing.images[0] ? (
          <>
            <img
              className="media-image"
              src={listing.images[0]}
              alt={listing.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            />
            <Box
              className="media-overlay"
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 70%)',
                opacity: 0.7,
                transition: 'opacity 0.3s ease',
                zIndex: 1,
              }}
            />
          </>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            color: isDarkMode ? 'text.primary' : 'text.secondary',
            p: 3,
            textAlign: 'center' 
          }}>
            <img
              src="/placeholder.png"
              alt="No image available"
              style={{
                width: '70px',
                height: '70px',
                objectFit: 'cover',
                borderRadius: '50%',
                marginBottom: '16px',
                opacity: isDarkMode ? 0.7 : 1,
              }}
            />
            <Typography variant="body2">No image available</Typography>
          </Box>
        )}

        {/* Price tag overlay */}
        <Chip
          label={formattedPrice}
          size="medium"
          color="primary"
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            zIndex: 2,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(45deg, #1976d2, #42a5f5)'
              : 'linear-gradient(45deg, #1565c0, #1976d2)',
            color: 'white',
            backdropFilter: 'blur(4px)',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            padding: '6px 8px',
            height: 'auto',
          }}
        />
      </Box>
      
      {/* Card content */}
      <CardContent 
        sx={{ 
          p: 2.5, 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography 
          variant="h6" 
          component="h3" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            fontSize: '1rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {listing.title}
        </Typography>
        
        {/* Category badge */}
        {listing.categories?.name && (
          <Chip
            label={listing.categories.name}
            size="small"
            sx={{
              maxWidth: 'fit-content',
              height: '24px',
              mb: 1.5,
              fontWeight: 600,
              fontSize: '0.7rem',
              borderRadius: '6px',
              background: isDarkMode 
                ? alpha(theme.palette.primary.main, 0.15) 
                : alpha(theme.palette.primary.light, 0.25),
              color: isDarkMode ? theme.palette.primary.light : theme.palette.primary.dark,
              border: isDarkMode 
                ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` 
                : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              '&:hover': {
                background: isDarkMode 
                  ? alpha(theme.palette.primary.main, 0.25) 
                  : alpha(theme.palette.primary.light, 0.35),
              }
            }}
          />
        )}
        
        {/* Additional details at bottom of content area */}
        <Box sx={{ 
          mt: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          opacity: 0.8
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: '0.875rem', opacity: 0.7 }} />
            <Typography variant="caption" color="text.secondary">
              {timeAgo}
            </Typography>
          </Box>
          
          {listing.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationIcon sx={{ fontSize: '0.875rem', opacity: 0.7 }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {listing.location}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Seller info with name and university + avatar */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mt: 1.5, 
          mb: 1,
          width: '100%',
          flexWrap: 'wrap'
        }}>
          {/* Only show avatar if available in users object */}
          {listing.users?.avatar_url && (
            <Avatar 
              src={listing.users.avatar_url} 
              alt={listing.users?.name || 'Seller'} 
              sx={{ 
                width: 28, 
                height: 28, 
                mr: 1,
                border: '2px solid',
                borderColor: 'primary.main', 
              }} 
            />
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="body2" noWrap color="text.secondary">
              {listing.users?.name || 'Unknown Seller'}
              {listing.users?.is_verified && (
                <VerifiedIcon 
                  color="primary" 
                  fontSize="inherit" 
                  sx={{ ml: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} 
                />
              )}
            </Typography>
            {listing.users?.university && (
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.7rem' 
                }}
              >
                <LocationIcon sx={{ fontSize: '0.9rem', mr: 0.5, opacity: 0.7 }} />
                {listing.users.university}
              </Typography>
            )}
          </Box>
          
          {/* Add seller rating badge */}
          {listing.user_id && (
            <SellerRatingBadge 
              sellerId={listing.user_id} 
              variant="chip" 
              size="small" 
            />
          )}
        </Box>
      </CardContent>
      
      {/* Floating action buttons */}
      <CardActions 
        className="card-actions"
        sx={{ 
          p: 1.5, 
          pt: 0,
          display: 'flex',
          justifyContent: 'space-between',
          opacity: { xs: 1, md: 0 },
          transform: { xs: 'translateY(0)', md: 'translateY(10px)' },
          transition: 'all 0.3s ease',
          background: isDarkMode 
            ? 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)'
            : 'linear-gradient(to top, rgba(0,0,0,0.03), transparent)',
        }}
      >
        <Stack direction="row" spacing={1}>
          {isOwner && (
            <>
              <Tooltip title="Edit listing">
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(listing);
                  }}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Delete listing">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(listing);
                  }}
                  sx={{ 
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {showSaveButton && <SavedListingsButton listingId={listing.id} />}
        </Stack>
        
        <Button
          variant="contained"
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={handleClick}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: theme.shadows[2],
            background: isDarkMode 
              ? 'linear-gradient(45deg, #1976d2, #42a5f5)'
              : 'linear-gradient(45deg, #1976d2, #42a5f5)',
            '&:hover': {
              boxShadow: theme.shadows[4],
              background: isDarkMode 
                ? 'linear-gradient(45deg, #1565c0, #1976d2)'
                : 'linear-gradient(45deg, #1565c0, #1976d2)',
            }
          }}
        >
          View
        </Button>
      </CardActions>
    </Card>
  );
};

export default ListingCard; 