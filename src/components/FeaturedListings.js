import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Skeleton,
  Card,
  CardContent,
  Alert,
  useTheme,
  useMediaQuery,
  Button,
  Chip,
  alpha,
  Fade,
  Container,
  Divider,
  IconButton,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ListingCard from './ListingCard';
import { getFeaturedListings } from '../services/supabase';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import StarIcon from '@mui/icons-material/Star';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TuneIcon from '@mui/icons-material/Tune';

const tabTypes = ["popular", "newest", "topRated"];

const FeaturedListings = ({ 
  title = "Featured Listings", 
  maxItems = 8,
  defaultTab = 0 
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  const isMounted = useRef(true);
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { 
      label: "Popular", 
      icon: <WhatshotIcon fontSize="small" />, 
      type: "popular" 
    },
    { 
      label: "Newest", 
      icon: <FiberNewIcon fontSize="small" />, 
      type: "newest" 
    },
    { 
      label: "Top Rated", 
      icon: <StarIcon fontSize="small" />, 
      type: "topRated" 
    },
  ];

  const fetchListings = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    try {
      const featuredType = tabTypes[activeTab];
      console.log(`[${title}] Fetching ${featuredType} listings, limit: ${maxItems}`);
      
      const { data, error } = await getFeaturedListings({
        limit: maxItems,
        featuredType: featuredType
      });

      if (error) {
        console.error(`[${title}] Error from getFeaturedListings:`, error);
        throw new Error(error);
      }
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        console.log(`[${title}] Received listings data:`, data?.length || 0);
        setListings(data || []);
        setError(null);
      }
    } catch (err) {
      console.error(`[${title}] Error fetching listings:`, err);
      // Only update state if component is still mounted
      if (isMounted.current) {
        setError('Failed to load featured listings. Please try again later.');
        setListings([]);
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [activeTab, maxItems, title]);

  useEffect(() => {
    isMounted.current = true;
    
    fetchListings();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted.current = false;
    };
  }, [fetchListings]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const skeletonCards = Array(maxItems)
    .fill(0)
    .map((_, index) => (
      <Grid item key={`skeleton-${index}`} xs={12} sm={6} md={3}>
        <Card sx={{ 
          height: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          background: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.background.paper, 0.8),
          boxShadow: theme.shadows[2],
        }}>
          <Skeleton 
            variant="rectangular" 
            height={200} 
            sx={{ 
              transform: 'scale(1)',
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.primary.main, 0.05)
                : alpha(theme.palette.primary.main, 0.1)
            }} 
          />
          <CardContent>
            <Skeleton 
              width="80%" 
              height={24} 
              sx={{ 
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.1)
              }} 
            />
            <Skeleton 
              width="50%" 
              height={20} 
              sx={{ 
                mt: 1,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.1)
              }} 
            />
            <Skeleton 
              width="60%" 
              height={20} 
              sx={{ 
                mt: 1,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.1)
              }} 
            />
          </CardContent>
        </Card>
      </Grid>
    ));

  return (
    <Box 
      sx={{ 
        mb: 6, 
        position: 'relative',
        pb: 4,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '20%',
          right: isMobile ? '-10%' : '-5%',
          width: isMobile ? '200px' : '300px',
          height: isMobile ? '200px' : '300px',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0)} 70%)`,
          borderRadius: '50%',
          zIndex: -1,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          bottom: '10%',
          left: isMobile ? '-10%' : '-5%',
          width: isMobile ? '200px' : '300px',
          height: isMobile ? '200px' : '300px',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0)} 70%)`,
          borderRadius: '50%',
          zIndex: -1,
        }
      }}
    >
      {/* Section Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        position: 'relative',
        zIndex: 1
      }}>
        <Stack spacing={1}>
          <Chip 
            label={title === "Featured Listings" ? "Featured" : "New Arrivals"} 
            size="small"
            color={title === "Featured Listings" ? "primary" : "secondary"}
            sx={{
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 26,
              maxWidth: 'fit-content',
              px: 1,
              borderRadius: '8px',
              background: title === "Featured Listings" 
                ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` 
                : `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
              color: '#fff',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          />
          <Typography 
            variant="h4" 
            component="h2" 
            sx={{ 
              fontWeight: 700,
              position: 'relative',
              background: title === "Featured Listings"
                ? `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                : `linear-gradient(45deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: theme.palette.mode === 'dark' ? undefined : 'transparent',
            }}
          >
            {title}
          </Typography>
        </Stack>
        
        <Button 
          variant="outlined" 
          color={title === "Featured Listings" ? "primary" : "secondary"}
          onClick={() => navigate('/search')}
          endIcon={<ArrowForwardIcon />}
          sx={{
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            px: 2.5,
            py: 1,
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'none',
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          View All
        </Button>
      </Box>
      
      {/* Tabs Bar */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: isMobile ? 'flex-start' : 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        mb: 4,
      }}>
        <Box 
          sx={{ 
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '16px',
            p: 0.8,
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.paper, 0.9),
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === 'dark' 
              ? alpha(theme.palette.primary.main, 0.2) 
              : alpha(theme.palette.grey[300], 0.8)}`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            allowScrollButtonsMobile
            TabIndicatorProps={{
              style: {
                display: 'none',
              }
            }}
            sx={{ 
              minHeight: '42px',
              '& .MuiTabs-flexContainer': {
                gap: 0.5,
              },
              '& .MuiTab-root': {
                borderRadius: '12px',
                minHeight: '38px',
                transition: 'all 0.3s ease',
                px: 2,
                py: 1,
                minWidth: 'auto',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: theme.palette.text.secondary,
                opacity: 0.8,
                '&.Mui-selected': {
                  color: title === "Featured Listings" 
                    ? theme.palette.primary.contrastText 
                    : theme.palette.secondary.contrastText,
                  background: title === "Featured Listings"
                    ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                    : `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  opacity: 1,
                  transform: 'scale(1.05)',
                },
                '&:hover:not(.Mui-selected)': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.action.hover, 0.1)
                    : alpha(theme.palette.action.hover, 0.05),
                  opacity: 0.9,
                }
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab 
                key={index} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                    {tab.icon}
                    <span>{tab.label}</span>
                  </Box>
                } 
              />
            ))}
          </Tabs>
        </Box>
        
        <IconButton 
          color={title === "Featured Listings" ? "primary" : "secondary"}
          sx={{ 
            borderRadius: '12px', 
            border: `1.5px solid ${alpha(title === "Featured Listings" ? theme.palette.primary.main : theme.palette.secondary.main, 0.3)}`,
            display: { xs: 'none', sm: 'flex' },
            p: 1.2,
            '&:hover': {
              background: alpha(title === "Featured Listings" ? theme.palette.primary.main : theme.palette.secondary.main, 0.1),
            }
          }}
        >
          <TuneIcon fontSize="small" />
        </IconButton>
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: theme.shadows[2],
          }}
        >
          {error}
        </Alert>
      )}
      
      {/* Listing Grid */}
      <Box 
        sx={{ 
          position: 'relative',
          overflowX: isMobile ? 'auto' : 'visible',
          pb: isMobile ? 2 : 0,
        }}
      >
        <Fade in={!loading} timeout={500}>
          <Grid 
            container 
            spacing={3} 
            sx={{
              width: isMobile ? 'max-content' : '100%',
              minWidth: isMobile ? '100%' : 'auto',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
            }}
          >
            {!loading && listings.length > 0 && listings.map((listing) => (
              <Grid 
                item 
                key={listing.id} 
                xs={12} 
                sm={6} 
                md={maxItems <= 4 ? 3 : maxItems <= 6 ? 4 : 3}
                sx={{
                  minWidth: isMobile ? 280 : 'auto',
                  maxWidth: isMobile ? 320 : 'auto',
                }}
              >
                <ListingCard listing={listing} />
              </Grid>
            ))}
          </Grid>
        </Fade>
        
        {loading && (
          <Grid 
            container 
            spacing={3}
            sx={{
              width: isMobile ? 'max-content' : '100%',
              minWidth: isMobile ? '100%' : 'auto',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
            }}
          >
            {skeletonCards}
          </Grid>
        )}
        
        {!loading && listings.length === 0 && !error && (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              px: 3,
              borderRadius: 4,
              bgcolor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.5)
                : alpha(theme.palette.background.paper, 0.8),
              border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No listings found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try another category or check back later for new listings.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FeaturedListings; 