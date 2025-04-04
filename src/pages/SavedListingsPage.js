import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Card,
  Divider,
  useTheme,
  alpha,
  Chip,
  Fade,
  Tab,
  Tabs,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from "../services/supabase";
import ListingCard from '../components/ListingCard';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SortIcon from '@mui/icons-material/Sort';

const SavedListingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedListings, setSavedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/saved-listings' } });
      return;
    }

    const fetchSavedListings = async () => {
      try {
        // First get the saved listing IDs
        const { data: savedData, error: savedError } = await supabase
          .from('saved_listings')
          .select('listing_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (savedError) throw savedError;

        if (!savedData || savedData.length === 0) {
          setSavedListings([]);
          setLoading(false);
          return;
        }

        // Then get the listing details for those IDs
        const listingIds = savedData.map(item => item.listing_id);
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select(`
            *,
            users (
              id,
              name,
              university
            )
          `)
          .in('id', listingIds);

        if (listingsError) throw listingsError;

        // Transform the data to include user info
        const validListings = listingsData
          .filter(item => item && item.users)
          .map(item => ({
            ...item,
            user: item.users,
            saved_at: savedData.find(sd => sd.listing_id === item.id)?.created_at
          }));

        // Apply sorting
        const sortedListings = sortListings(validListings, sortBy);
        setSavedListings(sortedListings);
      } catch (err) {
        setError('Error loading saved listings');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedListings();
  }, [user, navigate, sortBy]);

  const sortListings = (listings, sortOption) => {
    switch (sortOption) {
      case 'newest':
        return [...listings].sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
      case 'oldest':
        return [...listings].sort((a, b) => new Date(a.saved_at) - new Date(b.saved_at));
      case 'price_high':
        return [...listings].sort((a, b) => Number(b.price) - Number(a.price));
      case 'price_low':
        return [...listings].sort((a, b) => Number(a.price) - Number(b.price));
      default:
        return listings;
    }
  };

  const handleRemoveFromSaved = async (listingId) => {
    try {
      const { error } = await supabase
        .from('saved_listings')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId);

      if (error) throw error;

      setSavedListings(prev => prev.filter(listing => listing.id !== listingId));
    } catch (err) {
      setError('Error removing listing from saved');
      console.error('Error:', err);
    }
  };

  const handleSortChange = (event, newValue) => {
    setSortBy(newValue);
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
            <BookmarkIcon 
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
              Saved Listings
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

        {savedListings.length === 0 ? (
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
              <Box 
                component="img"
                src="/empty-bookmarks.svg"
                alt="No saved listings"
                sx={{
                  width: '180px',
                  height: '180px',
                  mb: 3,
                  opacity: 0.8
                }}
              />
              <Typography variant="h5" gutterBottom fontWeight={600} color="text.primary">
                No saved listings yet
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '500px', mx: 'auto', mb: 4 }}>
                Browse listings and click the heart icon to save items you're interested in.
                Your saved listings will appear here.
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
          <>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div" color="text.secondary">
                {savedListings.length} {savedListings.length === 1 ? 'item' : 'items'}
              </Typography>
              
              <Paper
                elevation={0}
                sx={{
                  p: 0.5,
                  borderRadius: 2,
                  background: isDarkMode ? alpha(theme.palette.background.paper, 0.5) : theme.palette.background.paper,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Tabs
                  value={sortBy}
                  onChange={handleSortChange}
                  textColor="primary"
                  indicatorColor="primary"
                  aria-label="sorting options"
                  sx={{ minHeight: '36px' }}
                >
                  <Tab 
                    icon={<SortIcon fontSize="small" />} 
                    iconPosition="start" 
                    label="Newest" 
                    value="newest" 
                    sx={{ minHeight: '36px', py: 0.5 }} 
                  />
                  <Tab 
                    label="Oldest" 
                    value="oldest" 
                    sx={{ minHeight: '36px', py: 0.5 }} 
                  />
                  <Tab 
                    label="Price ↑" 
                    value="price_low" 
                    sx={{ minHeight: '36px', py: 0.5 }} 
                  />
                  <Tab 
                    label="Price ↓" 
                    value="price_high" 
                    sx={{ minHeight: '36px', py: 0.5 }} 
                  />
                </Tabs>
              </Paper>
            </Box>
            
            <Fade in={true} timeout={500}>
              <Grid container spacing={3}>
                {savedListings.map((listing) => (
                  <Grid item key={listing.id} xs={12} sm={6} md={4} lg={3}>
                    <ListingCard
                      listing={listing}
                      onRemoveFromSaved={() => handleRemoveFromSaved(listing.id)}
                      showSaveButton
                    />
                  </Grid>
                ))}
              </Grid>
            </Fade>
          </>
        )}
      </Box>
    </Container>
  );
};

export default SavedListingsPage; 