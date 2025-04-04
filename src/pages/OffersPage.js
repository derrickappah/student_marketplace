import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  alpha,
  Fade,
  Divider,
  Avatar,
  Badge,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { getMyOffers, respondToOffer, subscribeToOfferUpdates } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SellIcon from '@mui/icons-material/Sell';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AllInboxIcon from '@mui/icons-material/AllInbox';

const OffersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [realTimeActivity, setRealTimeActivity] = useState(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/offers' } });
      return;
    }

    const fetchOffers = async () => {
      try {
        setLoading(true);
        const { data, error } = await getMyOffers();
        if (error) throw error;
        setOffers(data || []);
      } catch (err) {
        console.error('Error fetching offers:', err);
        setError('Failed to load offers');
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();

    let subscription;
    const setupSubscription = async () => {
      subscription = await subscribeToOfferUpdates(handleRealTimeUpdate);
    };

    setupSubscription();

    return () => {
      if (subscription && subscription.unsubscribe) {
        console.log('Unsubscribing from offers');
        subscription.unsubscribe();
      }
    };
  }, [user, navigate]);

  const handleRealTimeUpdate = async (update) => {
    console.log('Received real-time offer update:', update);
    setRealTimeActivity({
      type: update.type,
      role: update.role,
      id: update.data.id,
      timestamp: new Date().toISOString(),
    });

    try {
      const { data, error } = await getMyOffers();
      if (error) throw error;
      
      setOffers(data || []);
    } catch (err) {
      console.error('Error refreshing offers after update:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredOffers = () => {
    if (tabValue === 0) {
      // All offers
      return offers;
    } else if (tabValue === 1) {
      // Sent offers (as buyer)
      return offers.filter(offer => offer.buyer_id === user.id);
    } else {
      // Received offers (as seller)
      return offers.filter(offer => offer.seller_id === user.id);
    }
  };

  const handleViewListing = (listingId) => {
    navigate(`/listings/${listingId}`);
  };

  const handleOfferAction = (offer, action) => {
    setSelectedOffer(offer);
    setActionType(action);
    setActionDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedOffer) return;

    setActionLoading(true);
    try {
      const { error } = await respondToOffer(selectedOffer.id, actionType);
      if (error) throw error;

      setOffers(
        offers.map(offer => 
          offer.id === selectedOffer.id
            ? { ...offer, status: actionType === 'accept' ? 'accepted' : 'declined' }
            : offer
        )
      );
    } catch (err) {
      console.error(`Error ${actionType}ing offer:`, err);
      setError(`Failed to ${actionType} offer`);
    } finally {
      setActionLoading(false);
      setActionDialog(false);
    }
  };

  const getStatusChip = (status) => {
    let color, icon, label = status;
    
    switch (status) {
      case 'accepted':
        color = 'success';
        icon = <CheckCircleOutlineIcon fontSize="small" />;
        label = 'Accepted';
        break;
      case 'declined':
        color = 'error';
        icon = <CancelOutlinedIcon fontSize="small" />;
        label = 'Declined';
        break;
      case 'pending':
      default:
        color = 'warning';
        icon = <CalendarTodayIcon fontSize="small" />;
        label = 'Pending';
    }
    
    return (
      <Chip 
        icon={icon}
        label={label} 
        color={color} 
        size="small" 
        sx={{ 
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '& .MuiChip-icon': { fontSize: 16 }
        }} 
      />
    );
  };

  const getOfferCardStyle = (offerId) => {
    const isRecentActivity = realTimeActivity && 
                             realTimeActivity.id === offerId &&
                             (Date.now() - new Date(realTimeActivity.timestamp).getTime()) < 5000;
    
    return {
      height: '100%',
      transition: 'all 0.3s ease',
      transform: isRecentActivity ? 'scale(1.02)' : 'scale(1)',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 3,
      boxShadow: isRecentActivity 
        ? (theme.shadows[8]) 
        : theme.shadows[2],
      border: isRecentActivity 
        ? (realTimeActivity.type === 'new_offer' 
          ? `2px solid ${theme.palette.success.main}` 
          : `2px solid ${theme.palette.info.main}`) 
        : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      background: isDarkMode 
        ? `linear-gradient(145deg, ${alpha('#1a202c', 0.95)}, ${alpha('#0d1117', 0.97)})` 
        : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: theme.shadows[8],
      },
    };
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh' 
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper 
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: theme.palette.background.gradient,
            border: `1px solid ${alpha(theme.palette.primary.main, isDarkMode ? 0.2 : 0.1)}`,
            boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.2)' : '0 8px 32px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => navigate('/')} 
              sx={{ mr: 2 }}
              aria-label="back to listings"
            >
              <ArrowBackIcon />
            </IconButton>
            <LocalOfferIcon 
              sx={{ 
                fontSize: 36, 
                mr: 2, 
                color: theme.palette.primary.main 
              }} 
            />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                background: isDarkMode 
                  ? 'linear-gradient(45deg, #4B7BF5 30%, #2563EB 90%)' 
                  : 'linear-gradient(45deg, #2563EB 30%, #1D4ED8 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Offers
            </Typography>
          </Box>
        </Paper>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: theme.shadows[3]
            }}
          >
            {error}
          </Alert>
        )}

        {realTimeActivity && realTimeActivity.timestamp && 
          (Date.now() - new Date(realTimeActivity.timestamp).getTime()) < 5000 && (
          <Alert 
            severity={realTimeActivity.type === 'new_offer' ? 'success' : 'info'} 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: theme.shadows[3]
            }}
            onClose={() => setRealTimeActivity(null)}
          >
            {realTimeActivity.type === 'new_offer' ? 
              (realTimeActivity.role === 'seller' ? 'You received a new offer!' : 'Your offer was sent!') : 
              'An offer was updated'}
          </Alert>
        )}

        <Paper 
          elevation={0}
          sx={{ 
            mb: 4,
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.2)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            aria-label="offer tabs"
            sx={{ 
              bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab 
              icon={<AllInboxIcon />} 
              label="All Offers" 
              iconPosition="start"
              sx={{ py: 2 }}
            />
            <Tab 
              icon={<ShoppingBagIcon />} 
              label="Offers You've Made" 
              iconPosition="start"
              sx={{ py: 2 }}
            />
            <Tab 
              icon={<SellIcon />} 
              label="Offers You've Received" 
              iconPosition="start"
              sx={{ py: 2 }}
            />
          </Tabs>
        </Paper>

        {filteredOffers().length === 0 ? (
          <Fade in={true} timeout={800}>
            <Paper
              sx={{
                py: 6,
                px: 4,
                textAlign: 'center',
                borderRadius: 3,
                background: isDarkMode 
                  ? `linear-gradient(145deg, ${alpha('#1a202c', 0.7)}, ${alpha('#0d1117', 0.8)})` 
                  : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                border: `1px solid ${alpha(theme.palette.primary.main, isDarkMode ? 0.15 : 0.05)}`,
                boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.2)' : '0 10px 40px rgba(0,0,0,0.05)',
              }}
            >
              <LocalOfferIcon 
                sx={{ 
                  fontSize: 80, 
                  mb: 2, 
                  opacity: 0.6, 
                  color: theme.palette.text.secondary 
                }} 
              />
              <Typography variant="h5" gutterBottom fontWeight={600} color="text.primary">
                No offers found
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '500px', mx: 'auto', mb: 4 }}>
                {tabValue === 0 
                  ? "You don't have any offers yet. Browse listings and make an offer to get started." 
                  : tabValue === 1 
                  ? "You haven't made any offers yet. Find something you like and make an offer."
                  : "You haven't received any offers yet. Keep your listings active to attract offers."}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/')}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600
                }}
              >
                Browse Listings
              </Button>
            </Paper>
          </Fade>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }} 
              component="div"
            >
              {filteredOffers().length} {filteredOffers().length === 1 ? 'offer' : 'offers'} found
            </Typography>
            
            <Fade in={true} timeout={500}>
              <Grid container spacing={3}>
                {filteredOffers().map((offer) => (
                  <Grid item key={offer.id} xs={12} md={6} lg={4}>
                    <Card sx={getOfferCardStyle(offer.id)}>
                      <Box sx={{ position: 'relative' }}>
                        {offer.listing?.images?.[0] ? (
                          <CardMedia
                            component="img"
                            height="180"
                            image={offer.listing.images[0]}
                            alt={offer.listing?.title}
                            sx={{ 
                              objectFit: 'cover',
                              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                            }}
                          />
                        ) : (
                          <Box 
                            sx={{ 
                              height: 180, 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: isDarkMode ? alpha(theme.palette.primary.dark, 0.1) : alpha(theme.palette.primary.light, 0.1),
                              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              No image available
                            </Typography>
                          </Box>
                        )}
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: 12, 
                            right: 12,
                            zIndex: 2
                          }}
                        >
                          {getStatusChip(offer.status)}
                        </Box>
                      </Box>
                      
                      <CardContent sx={{ p: 3 }}>
                        <Typography 
                          variant="h6" 
                          component="div" 
                          gutterBottom
                          sx={{ 
                            fontWeight: 600,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 2
                          }}
                        >
                          {offer.listing?.title || 'Listing not available'}
                        </Typography>
                        
                        <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                          <Tooltip title="Listing Price">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <SellIcon 
                                sx={{ 
                                  mr: 1, 
                                  color: theme.palette.text.secondary,
                                  fontSize: 18
                                }} 
                              />
                              <Typography variant="body2" color="text.secondary">
                                GHC {offer.listing?.price?.toFixed(2)}
                              </Typography>
                            </Box>
                          </Tooltip>
                          
                          <Tooltip title="Your Offer">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <MonetizationOnIcon 
                                sx={{ 
                                  mr: 1, 
                                  color: theme.palette.primary.main,
                                  fontSize: 18
                                }} 
                              />
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                color="primary"
                              >
                                GHC {offer.amount.toFixed(2)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Stack>

                        {offer.message && (
                          <Box 
                            sx={{ 
                              mb: 2, 
                              p: 2, 
                              borderRadius: 2, 
                              bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.3) : alpha(theme.palette.background.light, 0.7),
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                            }}
                          >
                            <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={500}>
                              Message:
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{
                                fontStyle: 'italic',
                                color: 'text.primary'
                              }}
                            >
                              "{offer.message}"
                            </Typography>
                          </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon 
                              sx={{ 
                                mr: 1, 
                                color: theme.palette.text.secondary,
                                fontSize: 16 
                              }} 
                            />
                            <Typography variant="body2" color="text.secondary">
                              {user.id === offer.buyer_id ? 'You offered' : 'From ' + (offer.buyer?.name || 'Unknown')}
                            </Typography>
                          </Box>
                          
                          <Tooltip title="Offer Date">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarTodayIcon 
                                sx={{ 
                                  mr: 1, 
                                  color: theme.palette.text.secondary,
                                  fontSize: 14
                                }} 
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Stack>
                      </CardContent>

                      <CardActions sx={{ justifyContent: 'space-between', p: 3, pt: 0 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityOutlinedIcon />}
                          onClick={() => handleViewListing(offer.listing_id)}
                          sx={{ borderRadius: 2 }}
                        >
                          View Listing
                        </Button>

                        {user.id === offer.seller_id && offer.status === 'pending' && (
                          <Box>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircleOutlineIcon />}
                              sx={{ mr: 1, borderRadius: 2 }}
                              onClick={() => handleOfferAction(offer, 'accept')}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CancelOutlinedIcon />}
                              sx={{ borderRadius: 2 }}
                              onClick={() => handleOfferAction(offer, 'decline')}
                            >
                              Decline
                            </Button>
                          </Box>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Fade>
          </Box>
        )}
      </Box>

      <Dialog
        open={actionDialog}
        onClose={() => setActionDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[10],
            maxWidth: 500
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {actionType === 'accept' ? 
              <CheckCircleOutlineIcon color="success" sx={{ mr: 1.5, fontSize: 28 }} /> : 
              <CancelOutlinedIcon color="error" sx={{ mr: 1.5, fontSize: 28 }} />
            }
            <Typography variant="h5" component="div">
              {actionType === 'accept' ? 'Accept Offer' : 'Decline Offer'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {actionType === 'accept'
              ? `Are you sure you want to accept this offer of GHC ${selectedOffer?.amount}?`
              : `Are you sure you want to decline this offer of GHC ${selectedOffer?.amount}?`}
          </DialogContentText>
          
          {selectedOffer && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.light,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Offer Details:
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Item:</strong> {selectedOffer?.listing?.title}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>List Price:</strong> GHC {selectedOffer?.listing?.price?.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="bold">
                <strong>Offer Amount:</strong> GHC {selectedOffer?.amount?.toFixed(2)}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setActionDialog(false)} 
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmAction} 
            autoFocus
            color={actionType === 'accept' ? 'success' : 'error'}
            variant="contained"
            disabled={actionLoading}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {actionLoading ? (
              <CircularProgress size={24} />
            ) : (
              actionType === 'accept' ? 'Accept' : 'Decline'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OffersPage; 