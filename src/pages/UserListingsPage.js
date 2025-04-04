import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  Fade,
  Tooltip,
  Card,
  Stack
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ShoppingBag as ShoppingBagIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  LocalOffer as LocalOfferIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserListings, supabase } from "../services/supabase";
import { deleteListingWithTriggersDisabled, deleteListingByPrimaryKey } from '../services/direct-sql';
import ListingCard from '../components/ListingCard';
import { motion } from 'framer-motion';

const UserListingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorElSort, setAnchorElSort] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    sold: 0,
    pending: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/listings' } });
      return;
    }

    fetchUserListings();
  }, [user, navigate, sortBy, filterStatus]);

  const fetchUserListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await getUserListings();
      
      if (error) throw error;
      
      // Process listings
      let filteredListings = [...data];
      
      // Apply status filter
      if (filterStatus !== 'all') {
        filteredListings = filteredListings.filter(listing => listing.status === filterStatus);
      }
      
      // Apply sorting
      filteredListings = sortListings(filteredListings, sortBy);
      
      // Update stats
      updateStats(data);
      
      setListings(filteredListings);
    } catch (err) {
      console.error('Error loading listings:', err);
      setError('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data) => {
    const stats = {
      total: data.length,
      active: data.filter(item => item.status === 'available').length,
      sold: data.filter(item => item.status === 'sold').length,
      pending: data.filter(item => ['pending', 'reserved'].includes(item.status)).length
    };
    setStats(stats);
  };

  const sortListings = (listings, sortOption) => {
    const sortedListings = [...listings];
    
    switch (sortOption) {
      case 'newest':
        return sortedListings.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      case 'oldest':
        return sortedListings.sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
      case 'price-high':
        return sortedListings.sort((a, b) => b.price - a.price);
      case 'price-low':
        return sortedListings.sort((a, b) => a.price - b.price);
      default:
        return sortedListings;
    }
  };

  const handleSortClick = (event) => {
    setAnchorElSort(event.currentTarget);
  };

  const handleSortClose = () => {
    setAnchorElSort(null);
  };

  const handleSortSelect = (option) => {
    setSortBy(option);
    handleSortClose();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Set corresponding filter status
    switch (newValue) {
      case 0:
        setFilterStatus('all');
        break;
      case 1:
        setFilterStatus('available');
        break;
      case 2:
        setFilterStatus('sold');
        break;
      case 3:
        setFilterStatus('pending');
        break;
      default:
        setFilterStatus('all');
    }
  };

  const handleDeleteClick = (listing) => {
    setListingToDelete(listing.id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteDialogOpen(false);
      
      console.log('Attempting to delete listing with triggers disabled:', listingToDelete);
      
      // First attempt: Try deletion with triggers disabled
      const { success, error: triggerError } = await deleteListingWithTriggersDisabled(listingToDelete, user.id);
      
      if (success) {
        console.log('Deletion with triggers disabled successful');
        
        // Remove from state
        setListings(listings.filter(listing => listing.id !== listingToDelete));
        
        // Update stats
        const deletedListing = listings.find(l => l.id === listingToDelete);
        setStats({
          ...stats,
          total: stats.total - 1,
          active: deletedListing?.status === 'available' ? stats.active - 1 : stats.active,
          sold: deletedListing?.status === 'sold' ? stats.sold - 1 : stats.sold,
          pending: ['pending', 'reserved'].includes(deletedListing?.status) ? stats.pending - 1 : stats.pending
        });
        
        return;
      }
      
      console.error('Deletion with triggers disabled failed:', triggerError);
      
      // Second attempt: Try primary key deletion method
      console.log('Trying primary key deletion method:', listingToDelete);
      const { success: pkSuccess, error: pkError } = await deleteListingByPrimaryKey(listingToDelete, user.id);
      
      if (pkSuccess) {
        console.log('Primary key deletion successful');
        
        // Remove from state
        setListings(listings.filter(listing => listing.id !== listingToDelete));
        
        // Update stats
        const deletedListing = listings.find(l => l.id === listingToDelete);
        setStats({
          ...stats,
          total: stats.total - 1,
          active: deletedListing?.status === 'available' ? stats.active - 1 : stats.active,
          sold: deletedListing?.status === 'sold' ? stats.sold - 1 : stats.sold,
          pending: ['pending', 'reserved'].includes(deletedListing?.status) ? stats.pending - 1 : stats.pending
        });
        
        return;
      }
      
      console.error('Primary key deletion failed:', pkError);
      setError('Failed to delete listing. Please try again later or delete from the edit page.');
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('Failed to delete listing');
    } finally {
      setListingToDelete(null);
    }
  };

  const handleEditListing = (listingId) => {
    navigate(`/edit-listing/${listingId}`);
  };

  // Skeleton loading cards
  const skeletonCards = Array(8).fill(0).map((_, index) => (
    <Grid item key={`skeleton-${index}`} xs={12} sm={6} md={4} lg={3}>
      <Paper 
        sx={{ 
          height: 350, 
          borderRadius: '16px',
          overflow: 'hidden',
          background: isDarkMode 
            ? 'linear-gradient(145deg, #1a202c, #2d3748)'
            : 'linear-gradient(145deg, #f8fafc, #f1f5f9)',
          animation: 'pulse 1.5s infinite ease-in-out',
          '@keyframes pulse': {
            '0%': { opacity: 0.6 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.6 }
          },
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
        }} 
      />
    </Grid>
  ));

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'success';
      case 'sold': return 'secondary';
      case 'pending': 
      case 'reserved': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 3 }}>
      <Box 
        sx={{ 
          position: 'relative',
          backgroundImage: isDarkMode
            ? 'linear-gradient(to right, rgba(21, 35, 84, 0.8), rgba(25, 118, 210, 0.5))'
            : 'linear-gradient(to right, rgba(33, 150, 243, 0.05), rgba(33, 150, 243, 0.15))',
          borderRadius: '24px',
          py: { xs: 4, md: 5 },
          px: { xs: 3, md: 6 },
          mb: 4,
          overflow: 'hidden',
          boxShadow: isDarkMode 
            ? '0 10px 40px rgba(0,0,0,0.3)'
            : '0 10px 40px rgba(0,0,0,0.07)'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '300px',
            background: 'radial-gradient(circle at 80% 50%, rgba(33, 150, 243, 0.15), transparent 70%)',
            display: { xs: 'none', md: 'block' }
          }}
        />
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShoppingBagIcon 
                sx={{ 
                  fontSize: { xs: 36, md: 42 }, 
                  mr: 2, 
                  color: isDarkMode ? '#90caf9' : theme.palette.primary.main 
                }} 
              />
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 800,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  background: isDarkMode ? 'linear-gradient(45deg, #fff, #90caf9)' : 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Your Listings
              </Typography>
            </Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                mb: 3, 
                maxWidth: '650px',
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                fontSize: '1.1rem'
              }}
            >
              Manage all your marketplace listings from one place. Track their status, edit details, or create new listings.
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              size="large"
              onClick={() => navigate('/create-listing')}
              sx={{
                fontWeight: 600,
                borderRadius: '12px',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
                textTransform: 'none',
                py: 1.2,
                px: 3.5,
                background: isDarkMode 
                  ? 'linear-gradient(45deg, #1565c0, #1976d2)'
                  : 'linear-gradient(45deg, #1976d2, #42a5f5)',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Create New Listing
            </Button>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Grid container spacing={2}>
              {[
                { title: 'Total', value: stats.total, color: 'primary' },
                { title: 'Active', value: stats.active, color: 'success' },
                { title: 'Sold', value: stats.sold, color: 'secondary' },
                { title: 'Pending', value: stats.pending, color: 'warning' }
              ].map((stat, index) => (
                <Grid item xs={6} sm={3} md={6} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '16px',
                      backgroundColor: isDarkMode 
                        ? alpha(theme.palette[stat.color].dark, 0.2)
                        : alpha(theme.palette[stat.color].light, 0.2),
                      border: `1px solid ${isDarkMode 
                        ? alpha(theme.palette[stat.color].main, 0.3)
                        : alpha(theme.palette[stat.color].main, 0.2)}`,
                    }}
                  >
                    <Typography 
                      variant="h4" 
                      color={`${stat.color}.main`} 
                      sx={{ 
                        fontWeight: 700,
                        mb: 0.5
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '0.75rem'
                      }}
                    >
                      {stat.title}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>

      <Card 
        elevation={isDarkMode ? 3 : 1}
        sx={{ 
          mb: 4, 
          borderRadius: '20px', 
          overflow: 'visible',
          backgroundColor: isDarkMode ? 'rgba(35, 48, 68, 0.9)' : 'white'
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    textTransform: 'none',
                    minWidth: 100,
                    fontSize: '0.95rem',
                    py: 2,
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  }
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography component="span">All</Typography>
                      <Chip 
                        label={stats.total} 
                        size="small" 
                        sx={{ ml: 1, height: 20, borderRadius: 1 }} 
                      />
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography component="span">Active</Typography>
                      <Chip 
                        label={stats.active} 
                        size="small" 
                        color="success" 
                        sx={{ ml: 1, height: 20, borderRadius: 1 }} 
                      />
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography component="span">Sold</Typography>
                      <Chip 
                        label={stats.sold} 
                        size="small" 
                        color="secondary" 
                        sx={{ ml: 1, height: 20, borderRadius: 1 }} 
                      />
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography component="span">Pending</Typography>
                      <Chip 
                        label={stats.pending} 
                        size="small" 
                        color="warning" 
                        sx={{ ml: 1, height: 20, borderRadius: 1 }} 
                      />
                    </Box>
                  } 
                />
              </Tabs>
            </Grid>
            
            <Grid item xs={12} md="auto">
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  aria-controls="sort-menu"
                  aria-haspopup="true"
                  onClick={handleSortClick}
                  startIcon={<SortIcon />}
                  endIcon={sortBy.includes('price') ? 
                    (sortBy === 'price-high' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />) : 
                    null
                  }
                  color="primary"
                  variant="outlined"
                  size="medium"
                  sx={{ 
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderWidth: '1.5px',
                    px: 2
                  }}
                >
                  {sortBy === 'newest' && 'Newest First'}
                  {sortBy === 'oldest' && 'Oldest First'}
                  {sortBy === 'price-high' && 'Price: High to Low'}
                  {sortBy === 'price-low' && 'Price: Low to High'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Divider />
        
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                } 
              }}
            >
              {error}
            </Alert>
          )}
        
          {loading ? (
            <Grid container spacing={3}>
              {skeletonCards}
            </Grid>
          ) : listings.length === 0 ? (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              sx={{ 
                textAlign: 'center',
                py: 8,
                px: 2 
              }}
            >
              <Box 
                sx={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: isDarkMode 
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.primary.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 3
                }}
              >
                <ShoppingBagIcon 
                  sx={{ 
                    fontSize: 45, 
                    color: isDarkMode ? alpha(theme.palette.primary.main, 0.8) : theme.palette.primary.main
                  }} 
                />
              </Box>
              <Typography variant="h5" gutterBottom fontWeight={700}>
                No listings found
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  mb: 4,
                  maxWidth: '500px',
                  mx: 'auto'
                }}
              >
                {filterStatus === 'all' 
                  ? "You haven't created any listings yet. Get started by creating your first listing." 
                  : `You don't have any ${filterStatus} listings at the moment.`}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/create-listing')}
                sx={{ 
                  borderRadius: 3,
                  textTransform: 'none', 
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.25)'
                }}
              >
                Create Your First Listing
              </Button>
            </Box>
          ) : (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Grid container spacing={3}>
                {listings.map((listing) => (
                  <Grid item key={listing.id} xs={12} sm={6} md={4} lg={3}>
                    <ListingCard 
                      listing={listing} 
                      onEdit={handleEditListing}
                      onDelete={handleDeleteClick}
                      showSaveButton={false}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Card>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            maxWidth: '450px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Typography variant="h5" fontWeight={700}>Delete Listing</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <DialogContentText sx={{ color: 'text.primary', opacity: 0.7 }}>
            Are you sure you want to delete this listing? This action cannot be undone, and any associated offers or messages will also be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="primary"
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
            }}
          >
            Delete Listing
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserListingsPage; 