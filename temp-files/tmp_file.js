import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Card,
  CardMedia,
  Grid,
  Tooltip,
  Divider,
  CircularProgress,
  Stack,
  Badge,
  Alert,
  useTheme,
  Snackbar
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Star as FeaturedIcon,
  PushPin as PriorityIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { supabase, createSystemNotification } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { logAdminAction } from './AdminAuditLog';

const ListingPromotionApprovals = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [pendingListings, setPendingListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [selectedListing, setSelectedListing] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchPendingListings();
  }, []);

  const fetchPendingListings = async () => {
    setLoading(true);
    try {
      // Use a more specific query to avoid ambiguous column references
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          price,
          condition,
          status,
          created_at,
          updated_at,
          is_featured,
          is_priority,
          promotion_status,
          promotion_expires_at,
          images,
          user_id,
          category_id,
          users:user_id (id, name, email),
          categories:category_id (id, name)
        `)
        .eq('promotion_status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setPendingListings(data || []);
    } catch (error) {
      console.error('Error fetching pending promotion listings:', error);
      showSnackbar('Failed to load pending listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenViewDialog = (listing) => {
    setSelectedListing(listing);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
  };

  const handleOpenConfirmDialog = (listing, action) => {
    setSelectedListing(listing);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleApprovePromotion = async () => {
    try {
      if (!selectedListing) return;
      
      // Calculate promotion expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // Bypass Supabase's builder and use raw fetch to make a direct PATCH request
      // This avoids any ORM-related ambiguity with column names
      const supabaseUrl = supabase.supabaseUrl;
      const supabaseKey = supabase.supabaseKey;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/listings?id=eq.${selectedListing.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            promotion_status: 'approved',
            promotion_expires_at: expirationDate.toISOString(),
            is_featured: selectedListing.is_featured || false,
            is_priority: selectedListing.is_priority || false
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      // Create user notification
      const promotionTypes = [];
      if (selectedListing.is_featured) promotionTypes.push('Featured');
      if (selectedListing.is_priority) promotionTypes.push('Priority');
      
      await createSystemNotification({
        userId: selectedListing.user_id,
        message: `Your ${promotionTypes.join(' & ')} promotion for "${selectedListing.title}" has been approved!`,
        type: 'promotion',
        relatedId: selectedListing.id,
        listingId: selectedListing.id
      });
      
      // Log admin action
      await logAdminAction({
        action: 'approved_promotion',
        details: `Approved promotion for listing ${selectedListing.id} - ${selectedListing.title}`,
        resource_id: selectedListing.id,
        resource_type: 'listing'
      });
      
      // Update local state
      setPendingListings(pendingListings.filter(listing => listing.id !== selectedListing.id));
      showSnackbar('Promotion approved successfully');
    } catch (error) {
      console.error('Error approving promotion:', error);
      showSnackbar('Failed to approve promotion', 'error');
    } finally {
      handleCloseConfirmDialog();
    }
  };

  const handleRejectPromotion = async () => {
    try {
      if (!selectedListing) return;
      
      // Bypass Supabase's builder and use raw fetch to make a direct PATCH request
      // This avoids any ORM-related ambiguity with column names
      const supabaseUrl = supabase.supabaseUrl;
      const supabaseKey = supabase.supabaseKey;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/listings?id=eq.${selectedListing.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            promotion_status: 'rejected',
            is_featured: false,
            is_priority: false
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      // Create user notification
      const promotionTypes = [];
      if (selectedListing.is_featured) promotionTypes.push('Featured');
      if (selectedListing.is_priority) promotionTypes.push('Priority');
      
      await createSystemNotification({
        userId: selectedListing.user_id,
        message: `Your ${promotionTypes.join(' & ')} promotion request for "${selectedListing.title}" has been declined.`,
        type: 'promotion',
        relatedId: selectedListing.id,
        listingId: selectedListing.id
      });
      
      // Log admin action
      await logAdminAction({
        action: 'rejected_promotion',
        details: `Rejected promotion for listing ${selectedListing.id} - ${selectedListing.title}`,
        resource_id: selectedListing.id,
        resource_type: 'listing'
      });
      
      // Update local state
      setPendingListings(pendingListings.filter(listing => listing.id !== selectedListing.id));
      showSnackbar('Promotion rejected');
    } catch (error) {
      console.error('Error rejecting promotion:', error);
      showSnackbar('Failed to reject promotion', 'error');
    } finally {
      handleCloseConfirmDialog();
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const getFilteredListings = () => {
    // Filter based on the selected tab
    if (tabValue === 0) {
      // All pending promotions
      return pendingListings;
    } else if (tabValue === 1) {
      // Only featured requests
      return pendingListings.filter(listing => listing.is_featured);
    } else {
      // Only priority requests
      return pendingListings.filter(listing => listing.is_priority);
    }
  };

  const filteredListings = getFilteredListings();
  const displayedListings = filteredListings.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 3, mt: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              sx={{ mr: 1 }} 
              onClick={() => navigate('/admin')}
              color="primary"
            >
              <BackIcon />
            </IconButton>
            <Typography variant="h5" component="h1">
              Listing Promotion Approvals
            </Typography>
            <Badge 
              badgeContent={pendingListings.length} 
              color="primary"
              sx={{ ml: 2 }}
              tabIndex={-1}
              aria-label={`${pendingListings.length} pending approvals`}
            >
              <Chip 
                label="Pending" 
                color="warning" 
                size="small" 
              />
            </Badge>
          </Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={fetchPendingListings}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterIcon sx={{ mr: 1 }} />
                  All Pending
                  <Badge 
                    badgeContent={pendingListings.length} 
                    color="primary" 
                    sx={{ ml: 1 }} 
                    tabIndex={-1}
                    aria-label={`${pendingListings.length} pending items`}
                  />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FeaturedIcon sx={{ mr: 1 }} />
                  Featured Listings
                  <Badge 
                    badgeContent={pendingListings.filter(l => l.is_featured).length} 
                    color="primary" 
                    sx={{ ml: 1 }} 
                    tabIndex={-1}
                    aria-label={`${pendingListings.filter(l => l.is_featured).length} pending featured listings`}
                  />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PriorityIcon sx={{ mr: 1 }} />
                  Priority Listings
                  <Badge 
                    badgeContent={pendingListings.filter(l => l.is_priority).length} 
                    color="primary" 
                    sx={{ ml: 1 }} 
                    tabIndex={-1}
                    aria-label={`${pendingListings.filter(l => l.is_priority).length} pending priority listings`}
                  />
                </Box>
              } 
            />
          </Tabs>
          <Divider />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredListings.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No pending promotion requests found
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Listing</TableCell>
                    <TableCell>Seller</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Promotion Type</TableCell>
                    <TableCell>Date Submitted</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {listing.images && listing.images[0] ? (
                            <Box 
                              component="img" 
                              src={listing.images[0]} 
                              alt={listing.title}
                              sx={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 1, 
                                mr: 2,
                                objectFit: 'cover' 
                              }}
                            />
                          ) : (
                            <Box 
                              sx={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 1, 
                                mr: 2,
                                bgcolor: 'grey.200',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              No Image
                            </Box>
                          )}
                          <Typography variant="body1" noWrap sx={{ maxWidth: 200 }}>
                            {listing.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {listing.users?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {listing.categories?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        ${parseFloat(listing.price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {listing.is_featured && (
                            <Chip 
                              icon={<FeaturedIcon />} 
                              label="Featured" 
                              size="small" 
                              color="primary"
                            />
                          )}
                          {listing.is_priority && (
                            <Chip 
                              icon={<PriorityIcon />} 
                              label="Priority" 
                              size="small" 
                              color="secondary"
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {format(new Date(listing.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              color="info" 
                              onClick={() => handleOpenViewDialog(listing)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton 
                              color="success"
                              onClick={() => handleOpenConfirmDialog(listing, 'approve')}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton 
                              color="error"
                              onClick={() => handleOpenConfirmDialog(listing, 'reject')}
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredListings.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* View Listing Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Listing Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedListing && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {selectedListing.images && selectedListing.images.length > 0 ? (
                  <Card>
                    <CardMedia
                      component="img"
                      image={selectedListing.images[0]}
                      alt={selectedListing.title}
                      sx={{ height: 300, objectFit: 'contain' }}
                    />
                  </Card>
                ) : (
                  <Paper 
                    sx={{ 
                      height: 300, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      bgcolor: 'grey.100' 
                    }}
                  >
                    <Typography variant="body1" color="textSecondary">
                      No Images Available
                    </Typography>
                  </Paper>
                )}
                
                {selectedListing.images && selectedListing.images.length > 1 && (
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    {selectedListing.images.slice(1, 5).map((img, index) => (
                      <Grid item xs={3} key={index}>
                        <Box
                          component="img"
                          src={img}
                          alt={`Additional image ${index + 1}`}
                          sx={{ 
                            width: '100%', 
                            height: 70, 
                            objectFit: 'cover',
                            borderRadius: 1
                          }}
                        />
                      </Grid>
                    ))}
                    {selectedListing.images.length > 5 && (
                      <Grid item xs={3}>
                        <Box
                          sx={{
                            width: '100%',
                            height: 70,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 1
                          }}
                        >
                          +{selectedListing.images.length - 5} more
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom>
                  {selectedListing.title}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="textSecondary">
                    Price
                  </Typography>
                  <Typography variant="h6">
                    ${parseFloat(selectedListing.price).toFixed(2)}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Category
                    </Typography>
                    <Typography variant="body1">
                      {selectedListing.categories?.name || 'Unknown'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Condition
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {selectedListing.condition || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Seller
                    </Typography>
                    <Typography variant="body1">
                      {selectedListing.users?.name || 'Unknown'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Listed Date
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(selectedListing.created_at), 'MMM d, yyyy')}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Promotion Requests
                </Typography>
                
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Chip 
                    icon={<FeaturedIcon />}
                    label="Featured Listing"
                    color={selectedListing.is_featured ? "primary" : "default"}
                    variant={selectedListing.is_featured ? "filled" : "outlined"}
                  />
                  <Chip 
                    icon={<PriorityIcon />}
                    label="Priority Listing"
                    color={selectedListing.is_priority ? "secondary" : "default"}
                    variant={selectedListing.is_priority ? "filled" : "outlined"}
                  />
                </Stack>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedListing.description}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          {selectedListing && (
            <>
              <Button 
                startIcon={<RejectIcon />}
                color="error"
                onClick={() => {
                  handleCloseViewDialog();
                  handleOpenConfirmDialog(selectedListing, 'reject');
                }}
              >
                Reject
              </Button>
              <Button 
                startIcon={<ApproveIcon />}
                color="success"
                variant="contained"
                onClick={() => {
                  handleCloseViewDialog();
                  handleOpenConfirmDialog(selectedListing, 'approve');
                }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>
          {confirmAction === 'approve' ? 'Approve Promotion' : 'Reject Promotion'}
        </DialogTitle>
        <DialogContent>
          {selectedListing && (
            <>
              <Typography variant="body1" gutterBottom>
                {confirmAction === 'approve' 
                  ? 'Are you sure you want to approve this promotion request?' 
                  : 'Are you sure you want to reject this promotion request?'
                }
              </Typography>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Listing
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedListing.title}
                </Typography>
                
                <Typography variant="subtitle2" color="textSecondary">
                  Promotion Type
                </Typography>
                <Stack direction="row" spacing={1}>
                  {selectedListing.is_featured && (
                    <Chip 
                      icon={<FeaturedIcon />} 
                      label="Featured" 
                      size="small" 
                      color="primary"
                    />
                  )}
                  {selectedListing.is_priority && (
                    <Chip 
                      icon={<PriorityIcon />} 
                      label="Priority" 
                      size="small" 
                      color="secondary"
                    />
                  )}
                </Stack>
              </Box>
              
              {confirmAction === 'approve' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Approving will activate the promotion for 30 days.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          {confirmAction === 'approve' ? (
            <Button 
              onClick={handleApprovePromotion}
              color="success"
              variant="contained"
            >
              Approve
            </Button>
          ) : (
            <Button 
              onClick={handleRejectPromotion}
              color="error"
              variant="contained"
            >
              Reject
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ListingPromotionApprovals; 
