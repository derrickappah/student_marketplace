import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  IconButton,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Stack,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Badge,
  Zoom,
  alpha,
  Skeleton,
  SwipeableDrawer,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  LocalOffer as OfferIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  Person as PersonIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Info as InfoIcon,
  Room as LocationIcon,
  AccessTime as TimeIcon,
  Image as ImageIcon,
  PlayCircleFilled as PlayIcon,
  MoreVert as MoreVertIcon,
  Report as ReportIcon,
  Delete as DeleteIcon,
  Message as MessageIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Verified as VerifiedIcon,
  School as SchoolIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { supabase, trackListingView } from '../services/supabase';
import SavedListingsButton from '../components/SavedListingsButton';
import UserReviews from '../components/UserReviews';
import OfferDialog from '../components/OfferDialog';
import RecentlyViewedListings from '../components/RecentlyViewedListings';
import UserContactCard from '../components/UserContactCard';
import ProductReviewList from '../components/ProductReviewList';
import ProductReviewForm from '../components/ProductReviewForm';
import { useSnackbar } from 'notistack';

// Modern Image Carousel component with enhanced UI
const ImageCarousel = ({ images, onChangeIndex }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Minimum swipe distance for gesture
  const minSwipeDistance = 50;

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1;
    setActiveIndex(newIndex);
    if (onChangeIndex) onChangeIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newIndex = activeIndex === images.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(newIndex);
    if (onChangeIndex) onChangeIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 300);
  };
  
  // Handle touch events for swipe gesture
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Box sx={{ 
        height: { xs: 350, sm: 450 },
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {images.map((image, index) => (
          <Fade 
            key={index} 
            in={index === activeIndex} 
            timeout={500}
            style={{
              position: index === activeIndex ? 'relative' : 'absolute',
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  transition: 'transform 0.5s ease',
                }}
              />
            </Box>
          </Fade>
        ))}
        
        {/* Progressive enhancement - gradient overlays */}
        <Box sx={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.15), transparent)',
          pointerEvents: 'none',
        }} />
      </Box>
      
      {images.length > 1 && (
        <>
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              left: 16,
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { 
                bgcolor: 'rgba(255,255,255,1)',
                transform: 'translateY(-50%) scale(1.05)',
              },
              zIndex: 2,
              boxShadow: theme.shadows[5],
              transition: 'all 0.2s ease',
            }}
            onClick={handlePrev}
          >
            <PrevIcon />
          </IconButton>
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              right: 16,
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { 
                bgcolor: 'rgba(255,255,255,1)',
                transform: 'translateY(-50%) scale(1.05)',
              },
              zIndex: 2,
              boxShadow: theme.shadows[5],
              transition: 'all 0.2s ease',
            }}
            onClick={handleNext}
          >
            <NextIcon />
          </IconButton>
          
          <Box sx={{ 
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
            zIndex: 2,
          }}>
            {images.map((_, index) => (
              <Box
                key={index}
                onClick={() => {
                  setActiveIndex(index);
                  if (onChangeIndex) onChangeIndex(index);
                }}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: index === activeIndex 
                    ? 'primary.main' 
                    : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  transform: index === activeIndex ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: index === activeIndex 
                    ? '0 0 10px rgba(25, 118, 210, 0.7)' 
                    : 'none',
                  '&:hover': {
                    bgcolor: index === activeIndex 
                      ? 'primary.main' 
                      : 'rgba(255,255,255,0.8)',
                  }
                }}
              />
            ))}
          </Box>
        </>
      )}
      
      <Box sx={{ 
        position: 'absolute',
        top: 16,
        right: 16,
        bgcolor: 'rgba(0,0,0,0.6)',
        color: 'white',
        borderRadius: 10,
        px: 1.5,
        py: 0.5,
        fontSize: '0.875rem',
        fontWeight: 'bold',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        backdropFilter: 'blur(4px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <ImageIcon fontSize="small" />
        {activeIndex + 1}/{images.length}
      </Box>
    </Box>
  );
};

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = theme.palette.mode === 'dark';
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [seller, setSeller] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [sellerRating, setSellerRating] = useState(0);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const imageContainerRef = useRef(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            users (
              id,
              name,
              university,
              avatar_url,
              created_at
            ),
            category:category_id (id, name)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setListing(data);
        setSeller(data.users);
        setIsOwner(data.user_id === user?.id);

        if (user) {
          const { data: favoriteData } = await supabase
            .from('saved_listings')
            .select('id')
            .eq('user_id', user.id)
            .eq('listing_id', id)
            .single();

          setIsFavorite(!!favoriteData);
        }

        await trackListingView(id);
      } catch (err) {
        setError('Error loading listing details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, user]);
  
  const handleMakeOffer = () => {
    if (!user) {
      navigate('/login', { state: { from: `/listings/${id}` } });
      return;
    }
    setShowOfferDialog(true);
  };

  const handleEdit = () => {
    navigate(`/edit-listing/${id}`);
  };

  const handleImageClick = (index) => {
    setSelectedImage(index);
    setActiveStep(index);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStepChange = (step) => {
    setActiveStep(step);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: 'Check out this listing on Student Marketplace',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Here you'd ideally show a snackbar notifying the user the link was copied
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      enqueueSnackbar('Please sign in to favorite listings', { variant: 'info' });
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('saved_listings')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id);

        if (error) throw error;
        setIsFavorite(false);
        enqueueSnackbar('Removed from saved listings', { variant: 'success' });
      } else {
        const { error } = await supabase
          .from('saved_listings')
          .insert({
            user_id: user.id,
            listing_id: id,
          });

        if (error) throw error;
        setIsFavorite(true);
        enqueueSnackbar('Added to saved listings', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      enqueueSnackbar('Failed to update saved listings', { variant: 'error' });
    }
  };

  const handleOfferSubmit = async () => {
    if (!user) {
      enqueueSnackbar('Please sign in to make an offer', { variant: 'info' });
      return;
    }

    if (!offerAmount || isNaN(offerAmount) || offerAmount <= 0) {
      enqueueSnackbar('Please enter a valid offer amount', { variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('offers').insert({
        listing_id: id,
        buyer_id: user.id,
        amount: parseFloat(offerAmount),
        message: offerMessage.trim(),
      });

      if (error) throw error;

      setShowOfferDialog(false);
      setOfferAmount('');
      setOfferMessage('');
      enqueueSnackbar('Offer submitted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error submitting offer:', error);
      enqueueSnackbar('Failed to submit offer', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageNavigation = (direction) => {
    const newIndex = direction === 'next'
      ? (currentImageIndex + 1) % listing.images.length
      : (currentImageIndex - 1 + listing.images.length) % listing.images.length;
    setCurrentImageIndex(newIndex);
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      imageContainerRef.current?.requestFullscreen();
      setShowFullscreen(true);
    } else {
      document.exitFullscreen();
      setShowFullscreen(false);
    }
  };

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      enqueueSnackbar('Listing deleted successfully', { variant: 'success' });
      navigate('/listings');
    } catch (error) {
      console.error('Error deleting listing:', error);
      enqueueSnackbar('Failed to delete listing', { variant: 'error' });
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      enqueueSnackbar('Please provide a reason for reporting', { variant: 'error' });
      return;
    }

    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_id: listing.user_id,
        listing_id: id,
        reason: reportReason,
      });

      if (error) throw error;

      setShowReportDialog(false);
      setReportReason('');
      enqueueSnackbar('Listing reported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error reporting listing:', error);
      enqueueSnackbar('Failed to report listing', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '70vh',
          gap: 3
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ 
          color: 'primary.main',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }} />
        <Typography variant="h6" color="text.secondary" sx={{
          animation: 'pulse 1.5s infinite ease-in-out',
          '@keyframes pulse': {
            '0%, 100%': {
              opacity: 0.6,
            },
            '50%': {
              opacity: 1,
            },
          },
        }}>Loading listing details...</Typography>
      </Box>
    );
  }

  if (!listing) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 3,
            backdropFilter: 'blur(8px)',
            background: isDarkMode 
              ? 'linear-gradient(145deg, #1E1E1E, #2D2D2D)'
              : 'linear-gradient(145deg, #ffffff, #f5f7fa)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.05)',
            maxWidth: 600,
            mx: 'auto',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              padding: '1px',
              background: isDarkMode
                ? 'linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0))'
                : 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            },
          }}
        >
          <Box sx={{ mb: 3 }}>
            <InfoIcon sx={{ 
              fontSize: 70, 
              color: 'error.light',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
            }} />
          </Box>
          <Typography variant="h4" gutterBottom sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #d32f2f, #f44336)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Listing Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The listing you're looking for doesn't exist or may have been removed.
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/"
            sx={{ 
              mt: 2,
              fontWeight: 'bold',
              px: 4,
              py: 1.2,
              borderRadius: 2,
              background: 'linear-gradient(45deg, #1976d2, #2196f3)',
              boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-2px)'
              },
            }}
          >
            Browse Listings
          </Button>
        </Paper>
      </Container>
    );
  }

  const hasMultipleImages = listing.images && listing.images.length > 1;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Breadcrumb Navigation */}
      <Box 
        sx={{ 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Breadcrumbs 
          aria-label="breadcrumb" 
          sx={{ 
            display: { xs: 'none', sm: 'flex' },
            '& .MuiBreadcrumbs-ol': {
              flexWrap: 'nowrap',
            },
            '& .MuiBreadcrumbs-li': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        >
          <Link component={RouterLink} to="/" underline="hover" color="inherit">
            Home
          </Link>
          {listing.category && (
            <Link 
              component={RouterLink} 
              to={`/search?category=${listing.category.id}`} 
              underline="hover" 
              color="inherit"
              sx={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {listing.category.name}
            </Link>
          )}
          <Typography 
            color="text.primary" 
            sx={{ 
              maxWidth: { xs: '150px', sm: '200px', md: '300px' }, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}
          >
            {listing.title}
          </Typography>
        </Breadcrumbs>

        {/* Mobile Back Button */}
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate(-1)} 
            variant="outlined" 
            size="small"
            sx={{ borderRadius: 8 }}
          >
            Back
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Images */}
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              mb: 3,
              position: 'relative',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
              },
              transition: 'box-shadow 0.3s ease',
            }}
          >
            {/* Main Image Carousel */}
            {listing.images && listing.images.length > 0 ? (
              <ImageCarousel 
                images={listing.images} 
                onChangeIndex={handleStepChange} 
              />
            ) : (
              <Box
                sx={{
                  height: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDarkMode ? alpha('#1E1E1E', 0.7) : 'rgba(0,0,0,0.03)',
                  borderRadius: 3,
                }}
              >
                <ImageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.7 }} />
                <Typography variant="body1" color="text.secondary">
                  No images available
                </Typography>
              </Box>
            )}
          </Box>

          {/* Thumbnail Gallery - Only show if more than one image */}
          {hasMultipleImages && (
            <Box sx={{ 
              display: 'flex', 
              gap: 1.5, 
              flexWrap: 'nowrap',
              overflowX: 'auto',
              pb: 1.5,
              mt: 1,
              pt: 0.5,
              mx: 0.5,
              '&::-webkit-scrollbar': {
                height: 6,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: 3,
              },
            }}>
              {listing.images.map((image, index) => (
                <Box
                  key={index}
                  onClick={() => handleImageClick(index)}
                  sx={{
                    width: 80,
                    height: 80,
                    flexShrink: 0,
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: index === activeStep 
                      ? `2px solid ${theme.palette.primary.main}` 
                      : '2px solid transparent',
                    opacity: index === activeStep ? 1 : 0.7,
                    transition: 'all 0.3s ease',
                    transform: index === activeStep ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: index === activeStep ? theme.shadows[4] : theme.shadows[1],
                    '&:hover': {
                      opacity: 0.95,
                      transform: 'scale(1.05)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <img
                    src={image}
                    alt={`${listing.title} - ${index + 1}`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
          
          {/* Product Actions for Mobile */}
          {isMobile && (
            <Card 
              elevation={0} 
              sx={{ 
                p: 2.5, 
                mb: 3, 
                boxShadow: theme.shadows[2],
                borderRadius: 3,
                background: isDarkMode
                  ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`
                  : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Mobile title and price */}
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="h5" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 700,
                    mb: 1,
                    lineHeight: 1.3,
                  }}
                >
                  {listing.title}
                </Typography>
                
                <Typography 
                  variant="h4" 
                  component="p" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'primary.main',
                    mb: 2,
                  }}
                >
                  GHC {listing.price.toFixed(2)}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={listing.condition}
                    color={listing.condition === 'new' ? 'success' : 'default'}
                    icon={<CheckCircleIcon />}
                    sx={{ fontWeight: 500 }}
                    size="small"
                  />
                  <Chip
                    label={listing.category?.name || 'Uncategorized'}
                    variant="outlined"
                    color="primary"
                    sx={{ fontWeight: 500 }}
                    size="small"
                  />
                  {listing.is_featured && (
                    <Chip
                      icon={<StarIcon />}
                      label="Featured"
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                {!isOwner && <SavedListingsButton listingId={listing.id} />}
                
                <IconButton 
                  aria-label="share" 
                  onClick={handleShare} 
                  color="primary"
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <ShareIcon />
                </IconButton>
                
                <Box sx={{ ml: 'auto' }}>
                  <IconButton
                    aria-label="more"
                    onClick={handleMenuOpen}
                    edge="end"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>
              
              {isOwner ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    fullWidth
                    onClick={handleEdit}
                    sx={{ borderRadius: 8, py: 1.2 }}
                  >
                    Edit Listing
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<OfferIcon />}
                    fullWidth
                    onClick={() => navigate('/offers')}
                    sx={{ borderRadius: 8, py: 1.2 }}
                  >
                    View Offers
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleMakeOffer}
                  sx={{ 
                    py: 1.5, 
                    fontWeight: 'bold',
                    borderRadius: 8,
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
                  }}
                >
                  Make Offer
                </Button>
              )}
            </Card>
          )}
        </Grid>

        {/* Right Column - Details */}
        <Grid item xs={12} md={6}>
          {/* Desktop Product Details */}
          {!isMobile && (
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                overflow: 'visible',
                position: 'relative',
                background: isDarkMode
                  ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`
                  : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.07)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  padding: '1px',
                  background: isDarkMode
                    ? 'linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0))'
                    : 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0.2))',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                  zIndex: 1,
                },
              }}
            >
              <Box sx={{ p: 3.5 }}>
                {/* Title and action buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 2.5,
                  position: 'relative',
                }}>
                  <Box sx={{ maxWidth: '80%' }}>
                    <Typography 
                      variant="h4" 
                      component="h1" 
                      sx={{ 
                        fontWeight: 700,
                        lineHeight: 1.3,
                        position: 'relative',
                        display: 'inline-block',
                        mb: 0.5,
                        color: isDarkMode ? 'white' : 'text.primary',
                      }}
                    >
                      {listing.title}
                    </Typography>
                    
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          {listing.users?.university || 'University not specified'}
                        </Typography>
                      </Box>
                      
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 4, 
                          height: 4, 
                          borderRadius: '50%', 
                          bgcolor: 'text.disabled',
                        }} 
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          Posted {listing.created_at ? formatDistanceToNow(new Date(listing.created_at), { addSuffix: true }) : 'recently'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!isOwner && (
                      <SavedListingsButton 
                        listingId={listing.id} 
                        size="medium" 
                        sx={{
                          bgcolor: isDarkMode 
                            ? alpha(theme.palette.background.default, 0.2)
                            : alpha(theme.palette.background.default, 0.1),
                        }}
                      />
                    )}
                    
                    <IconButton 
                      aria-label="share" 
                      onClick={handleShare} 
                      color="primary"
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                        }
                      }}
                    >
                      <ShareIcon />
                    </IconButton>
                    
                    <IconButton
                      aria-label="more"
                      onClick={handleMenuOpen}
                      edge="end"
                      sx={{ 
                        bgcolor: isDarkMode 
                          ? alpha(theme.palette.background.default, 0.2)
                          : alpha(theme.palette.background.default, 0.1),
                        '&:hover': {
                          bgcolor: isDarkMode 
                            ? alpha(theme.palette.background.default, 0.3)
                            : alpha(theme.palette.background.default, 0.2),
                        }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                {/* Price and badges */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography 
                      variant="h3" 
                      component="p" 
                      sx={{ 
                        fontWeight: 800,
                        color: isDarkMode ? 'primary.light' : 'primary.main',
                        position: 'relative',
                        display: 'inline-block',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      GHC {listing.price.toFixed(2)}
                    </Typography>
                    
                    {listing.original_price && listing.original_price > listing.price && (
                      <Typography 
                        variant="h6" 
                        component="span" 
                        sx={{ 
                          textDecoration: 'line-through',
                          color: 'text.disabled',
                          fontWeight: 500,
                        }}
                      >
                        GHC {listing.original_price.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                  
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={listing.condition}
                      color={listing.condition === 'new' ? 'success' : 'default'}
                      icon={<CheckCircleIcon />}
                      sx={{ 
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 0.5,
                      }}
                    />
                    <Chip
                      label={listing.category?.name || 'Uncategorized'}
                      variant="outlined"
                      color="primary"
                      sx={{ 
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 0.5,
                      }}
                    />
                    {listing.is_featured && (
                      <Chip
                        icon={<StarIcon />}
                        label="Featured"
                        color="warning"
                        variant="outlined"
                        sx={{ 
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 0.5,
                        }}
                      />
                    )}
                  </Stack>
                </Box>
                
                {/* Description section */}
                <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="subtitle1" 
                    component="h3" 
                    sx={{
                      fontWeight: 700,
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <DescriptionIcon color="primary" fontSize="small" />
                    Description
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-line', 
                      color: 'text.secondary',
                      lineHeight: 1.7,
                      mb: 2,
                      maxHeight: 200,
                      overflow: 'auto',
                      pr: 1,
                      '&::-webkit-scrollbar': {
                        width: 6,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: 3,
                      },
                    }}
                  >
                    {listing.description || "No description provided."}
                  </Typography>
                </Box>
                
                {/* Seller information */}
                {!isOwner && (
                  <Box sx={{ mb: 3 }}>
                    <Typography 
                      variant="subtitle1" 
                      component="h3" 
                      sx={{
                        fontWeight: 700,
                        mb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <PersonIcon color="primary" fontSize="small" />
                      Seller Information
                    </Typography>
                    
                    <UserContactCard 
                      user={listing.users}
                      listing={listing}
                      joinedDate={listing.users.created_at}
                      showContactButton={!isOwner}
                    />
                  </Box>
                )}
                                
                {/* Action buttons */}
                <Box sx={{ mt: 'auto', pt: 3 }}>
                  {isOwner ? (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<EditIcon />}
                          fullWidth
                          onClick={handleEdit}
                          sx={{ 
                            py: 1.5,
                            fontWeight: 700,
                            borderRadius: 8,
                            boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)',
                            background: isDarkMode
                              ? 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)'
                              : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                            '&:hover': {
                              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                            }
                          }}
                        >
                          Edit Listing
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<OfferIcon />}
                          fullWidth
                          onClick={() => navigate('/offers')}
                          sx={{ 
                            py: 1.5,
                            fontWeight: 700,
                            borderRadius: 8,
                            borderWidth: 2,
                            '&:hover': {
                              borderWidth: 2,
                            }
                          }}
                        >
                          View Offers
                        </Button>
                      </Grid>
                    </Grid>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      onClick={handleMakeOffer}
                      sx={{ 
                        py: 2, 
                        fontWeight: 700,
                        borderRadius: 8,
                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                        fontSize: '1.1rem',
                        boxShadow: '0 8px 24px rgba(25, 118, 210, 0.4)',
                        transition: 'all 0.3s',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: '0 12px 28px rgba(25, 118, 210, 0.5)',
                          transform: 'translateY(-3px)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: -100,
                          width: 50,
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          animation: 'shine 3s infinite linear',
                          '@keyframes shine': {
                            '0%': {
                              left: '-100%',
                            },
                            '100%': {
                              left: '200%',
                            },
                          },
                        },
                      }}
                    >
                      Make an Offer
                    </Button>
                  )}
                </Box>
              </Box>
            </Card>
          )}
        </Grid>
        
        {/* Reviews Section - Side by side on desktop, stacked on mobile */}
        <Grid item xs={12}>
          <Box sx={{ mt: { xs: 2, md: 4 } }}>
            <Grid container spacing={3}>
              {/* Seller Reviews Section */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ 
                  height: '100%',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                  borderRadius: 3,
                  p: 3,
                  background: isDarkMode
                    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`
                    : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    padding: '1px',
                    background: isDarkMode
                      ? 'linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0))'
                      : 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0.2))',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    pointerEvents: 'none',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    fontWeight="bold" 
                    gutterBottom 
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      pb: 1,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '60px',
                        height: 3,
                        backgroundColor: 'primary.main',
                        borderRadius: 1.5,
                      }
                    }}
                  >
                    <StarIcon color="warning" />
                    Seller Reviews
                  </Typography>
                  {listing.users && (
                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                      <UserReviews userId={listing.users.id} userName={listing.users.name} />
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Product Reviews Section */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ 
                  height: '100%',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                  borderRadius: 3,
                  p: 3,
                  background: isDarkMode
                    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`
                    : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    padding: '1px',
                    background: isDarkMode
                      ? 'linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0))'
                      : 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0.2))',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    pointerEvents: 'none',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    fontWeight="bold" 
                    gutterBottom 
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      pb: 1,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '60px',
                        height: 3,
                        backgroundColor: 'primary.main',
                        borderRadius: 1.5,
                      }
                    }}
                  >
                    <StarIcon color="primary" />
                    Product Reviews
                  </Typography>
                  
                  {/* Product Review List */}
                  <Box sx={{ mb: 4, flexGrow: 1, overflow: 'auto' }}>
                    <ProductReviewList 
                      listingId={id} 
                      refreshTrigger={refreshKey} 
                    />
                  </Box>
                  
                  {/* Product Review Form */}
                  {user && !isOwner && (
                    <Box id="product-review-form">
                      <Divider sx={{ my: 3 }} />
                      <Typography variant="h6" gutterBottom>
                        Write a Product Review
                      </Typography>
                      <ProductReviewForm 
                        sellerId={listing?.user_id}
                        listingId={id}
                        listingTitle={listing?.title}
                        onSuccess={() => setRefreshKey(prev => prev + 1)}
                      />
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        
        {/* Recently Viewed Section */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ 
            mt: 4, 
            p: 3,
            boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
            borderRadius: 3,
            background: isDarkMode
              ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`
              : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              padding: '1px',
              background: isDarkMode
                ? 'linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0))'
                : 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0.2))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            },
          }}>
            <Typography 
              variant="h5" 
              component="h2" 
              fontWeight="bold" 
              gutterBottom 
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pb: 1,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '60px',
                  height: 3,
                  backgroundColor: 'primary.main',
                  borderRadius: 1.5,
                }
              }}
            >
              <TimeIcon color="primary" />
              Recently Viewed
            </Typography>
            <RecentlyViewedListings />
          </Card>
        </Grid>
      </Grid>
      
      {/* Offer Dialog */}
      <OfferDialog
        open={showOfferDialog}
        onClose={() => setShowOfferDialog(false)}
        listing={listing}
      />

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Delete Listing</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography>
            Are you sure you want to delete this listing? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setShowDeleteDialog(false)}
            sx={{ borderRadius: 8 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            sx={{ borderRadius: 8 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Report Listing</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Reporting"
            multiline
            rows={4}
            fullWidth
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setShowReportDialog(false)}
            sx={{ borderRadius: 8 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReport}
            sx={{ borderRadius: 8 }}
          >
            Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: 2,
            mt: 1,
            boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.2,
              borderRadius: 1,
              mx: 0.5,
              my: 0.3,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            },
          }
        }}
      >
        {isOwner ? (
          <>
            <MenuItem onClick={() => navigate(`/edit-listing/${id}`)}>
              <EditIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Edit Listing
            </MenuItem>
            <MenuItem onClick={() => setShowDeleteDialog(true)}>
              <DeleteIcon sx={{ mr: 1.5, fontSize: 20, color: 'error.main' }} />
              Delete Listing
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={handleMakeOffer}>
              <OfferIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Make Offer
            </MenuItem>
            <MenuItem onClick={() => navigate('/report', { 
              state: { 
                reportType: 'listing', 
                itemId: listing.id, 
                itemData: { title: listing.title } 
              } 
            })}>
              <ReportIcon sx={{ mr: 1.5, fontSize: 20, color: 'error.main' }} />
              Report Listing
            </MenuItem>
          </>
        )}
        <MenuItem onClick={handleShare}>
          <ShareIcon sx={{ mr: 1.5, fontSize: 20 }} />
          Share Listing
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default ListingDetailPage;