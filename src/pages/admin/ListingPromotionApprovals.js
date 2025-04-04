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
  DialogContentText,
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
  BarChart as StatsIcon,
  FilterList as FilterIcon,
  ArrowBack as BackIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import { createSystemNotification } from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { logAdminAction } from '../../services/adminService';
import PromotionStatistics from './components/PromotionStatistics';
import ListingDetailDialog from './components/ListingDetailDialog';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`promotion-tabpanel-${index}`}
      aria-labelledby={`promotion-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ListingPromotionApprovals = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State management
  const [pendingListings, setPendingListings] = useState([]);
  const [historyListings, setHistoryListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [selectedListing, setSelectedListing] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [promotionStats, setPromotionStats] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch data when component mounts
  useEffect(() => {
    fetchPendingListings();
    fetchPromotionHistory();
    fetchPromotionStats();
  }, []);

  // Fetch pending promotion requests
  const fetchPendingListings = async () => {
    setLoading(true);
    try {
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

  // Fetch promotion history (approved and rejected)
  const fetchPromotionHistory = async () => {
    setHistoryLoading(true);
    try {
      // First try to use the new RPC function which bypasses RLS
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_promotion_history');
      
      if (!rpcError && rpcData) {
        // Process the data - we need to fetch related data since the RPC function 
        // doesn't do JOINs for security reasons
        const historyIds = rpcData.map(h => h.id);
        
        if (historyIds.length === 0) {
          // No history data found
          setHistoryListings([]);
          setHistoryLoading(false);
          return;
        }
        
        // Fetch related listings data
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, price, images, is_featured, is_priority, promotion_status')
          .in('id', rpcData.map(h => h.listing_id));
          
        if (listingsError) throw listingsError;
        
        // Fetch related users data
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', rpcData.map(h => h.user_id));
          
        if (usersError) throw usersError;
        
        // Combine the data
        const historyWithDetails = rpcData.map(history => {
          const listing = listings.find(l => l.id === history.listing_id) || null;
          const user = users.find(u => u.id === history.user_id) || null;
          
          return {
            ...history,
            listings: listing,
            users: user
          };
        });
        
        setHistoryListings(historyWithDetails);
      } else if (rpcError && rpcError.message && rpcError.message.includes('function does not exist')) {
        // Fall back to the old method if the function doesn't exist
        console.warn('get_promotion_history function not available, falling back to direct query');
        
        const { data, error } = await supabase
          .from('promotion_request_history')
          .select(`
            id,
            listing_id,
            user_id,
            promotion_type,
            status,
            requested_at,
            processed_at,
            expires_at,
            listings:listing_id (
              id, 
              title, 
              price, 
              images, 
              is_featured, 
              is_priority, 
              promotion_status
            ),
            users:user_id (id, name, email)
          `)
          .order('processed_at', { ascending: false });
          
        if (error) throw error;
        
        setHistoryListings(data || []);
      } else {
        // Some other error occurred with the RPC call
        console.error('Error with get_promotion_history RPC:', rpcError);
        throw rpcError;
      }
    } catch (error) {
      console.error('Error fetching promotion history:', error);
      showSnackbar('Failed to load promotion history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch promotion statistics
  const fetchPromotionStats = async () => {
    try {
      setPromotionStats(null); // Reset stats while loading
      console.log('Fetching promotion statistics...');
      
      let statsData = null;
      let useDirectFunction = false;
      
      // Try to use the cached function first to avoid timeouts
      const { data: cachedData, error: cachedError } = await supabase
        .rpc('get_promotion_stats_cached');
        
      console.log('Cached function response:', { data: cachedData, error: cachedError });
        
      if (!cachedError && cachedData) {
        console.log('Using cached stats data:', cachedData);
        statsData = cachedData;
      } else {
        // Log detailed information about the cached function error
        console.warn('Error with cached stats function:', cachedError);
        
        // Always fall back to the base function if there's any error with the cached function
        useDirectFunction = true;
      }
      
      // Use the base function if needed
      if (useDirectFunction) {
        console.log('Falling back to direct get_promotion_stats function');
        const { data: directData, error: directError } = await supabase
          .rpc('get_promotion_stats');
          
        console.log('Direct function response:', { data: directData, error: directError });
          
        if (directError) {
          console.error('Error with direct stats function:', directError);
          throw directError;
        }
        
        if (directData) {
          console.log('Using direct stats data:', directData);
          statsData = directData;
        } else {
          console.warn('Direct function returned no data');
        }
      }
      
      // Set the stats if we have data
      if (statsData) {
        console.log('Setting stats data:', statsData);
        // Check if stats data is in the expected format (an array with 1 element vs direct object)
        if (Array.isArray(statsData) && statsData.length > 0) {
          setPromotionStats(statsData[0]);
        } else {
          setPromotionStats(statsData);
        }
      } else {
        console.error('No data returned from either stats function');
        throw new Error('No data returned from either stats function');
      }
    } catch (error) {
      console.error('Error fetching promotion statistics:', error);
      
      // Set default stats so UI doesn't break completely
      const defaultStats = {
        total_pending: 0,
        total_approved: 0,
        total_rejected: 0,
        featured_pending: 0,
        featured_approved: 0,
        priority_pending: 0,
        priority_approved: 0,
        both_pending: 0,
        both_approved: 0
      };
      
      console.log('Setting default stats:', defaultStats);
      setPromotionStats(defaultStats);
      
      // Show error to user
      showSnackbar('Failed to load promotion statistics. Please try again later.', 'error');
    }
  };

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Pagination handlers for pending listings
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Pagination handlers for history
  const handleHistoryChangePage = (event, newPage) => {
    setHistoryPage(newPage);
  };

  const handleHistoryChangeRowsPerPage = (event) => {
    setHistoryRowsPerPage(parseInt(event.target.value, 10));
    setHistoryPage(0);
  };

  // Dialog handlers
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

  const handleOpenStatsDialog = () => {
    fetchPromotionStats();
    setStatsDialogOpen(true);
  };

  const handleCloseStatsDialog = () => {
    setStatsDialogOpen(false);
  };

  // Update the listing status directly without using complex queries
  const updateListingStatus = async (listingId, action, expirationDate = null) => {
    // Use the safe SQL functions instead of direct updates
    if (action === 'approve') {
      // Call the safe approve function
      const { data, error } = await supabase.rpc('admin_safe_approve_promotion', {
        in_listing_id: listingId,
        in_exp_date: expirationDate?.toISOString()
      });
      
      if (error) throw error;
      return data;
    } else {
      // Call the safe reject function
      const { data, error } = await supabase.rpc('admin_safe_reject_promotion', {
        in_listing_id: listingId
      });
      
      if (error) throw error;
      return data;
    }
  };
  
  // Update or create promotion history record - not needed with new SQL functions
  // This function is kept for backwards compatibility but won't be used
  const updatePromotionHistory = async (listing, action, expirationDate = null) => {
    // The history is now handled by the SQL functions
    // This is just a stub for backward compatibility
    return true;
  };

  // Approve a promotion request
  const handleApprovePromotion = async () => {
    try {
      if (!selectedListing) return;
      
      // Calculate expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // Use the new safe function to update both the listing and history in one call
      // This completely avoids the ambiguous column issue
      await updateListingStatus(selectedListing.id, 'approve', expirationDate);
      
      // Create user notification
      const promotionTypes = [];
      if (selectedListing.is_featured) promotionTypes.push('Featured');
      if (selectedListing.is_priority) promotionTypes.push('Priority');
      
      await createSystemNotification({
        userId: selectedListing.user_id,
        message: `Your ${promotionTypes.join(' & ')} promotion for "${selectedListing.title}" has been approved!`,
        type: 'promotion',
        listingId: selectedListing.id,
        relatedId: selectedListing.id
      });
      
      // Log admin action
      await logAdminAction(
        'approved_promotion',
        `Approved promotion for listing ${selectedListing.id} - ${selectedListing.title}`, 
        selectedListing.id,
        'listing'
      );
      
      // Update local state
      setPendingListings(pendingListings.filter(listing => listing.id !== selectedListing.id));
      fetchPromotionHistory();
      fetchPromotionStats();
      showSnackbar('Promotion approved successfully');
    } catch (error) {
      console.error('Error approving promotion:', error);
      showSnackbar('Failed to approve promotion', 'error');
    } finally {
      handleCloseConfirmDialog();
    }
  };

  // Reject a promotion request
  const handleRejectPromotion = async () => {
    try {
      if (!selectedListing) return;
      
      // Use the new safe function to update both the listing and history in one call
      // This completely avoids the ambiguous column issue
      await updateListingStatus(selectedListing.id, 'reject');
      
      // Create user notification
      const promotionTypes = [];
      if (selectedListing.is_featured) promotionTypes.push('Featured');
      if (selectedListing.is_priority) promotionTypes.push('Priority');
      
      await createSystemNotification({
        userId: selectedListing.user_id,
        message: `Your ${promotionTypes.join(' & ')} promotion for "${selectedListing.title}" has been rejected.`,
        type: 'promotion',
        listingId: selectedListing.id,
        relatedId: selectedListing.id
      });
      
      // Log admin action
      await logAdminAction(
        'rejected_promotion',
        `Rejected promotion for listing ${selectedListing.id} - ${selectedListing.title}`,
        selectedListing.id,
        'listing'
      );
      
      // Update local state
      setPendingListings(pendingListings.filter(listing => listing.id !== selectedListing.id));
      fetchPromotionHistory();
      fetchPromotionStats();
      showSnackbar('Promotion rejected successfully');
    } catch (error) {
      console.error('Error rejecting promotion:', error);
      showSnackbar('Failed to reject promotion', 'error');
    } finally {
      handleCloseConfirmDialog();
    }
  };

  // Helper to show snackbar messages
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

  // Render promotion type badges
  const renderPromotionType = (listing) => {
    return (
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
    );
  };

  // Render the status chip
  const renderStatusChip = (status) => {
    let color = 'default';
    let label = status;
    
    switch (status) {
      case 'pending':
        color = 'warning';
        break;
      case 'approved':
        color = 'success';
        break;
      case 'rejected':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={label.charAt(0).toUpperCase() + label.slice(1)} 
        size="small" 
        color={color} 
      />
    );
  };

  return (
    <Container maxWidth="xl">
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              size="small" 
              sx={{ mr: 1 }}
              onClick={() => navigate('/admin')}
            >
              <BackIcon />
            </IconButton>
            <Typography variant="h5" component="h1" fontWeight="bold">
              Listing Promotion Approvals
            </Typography>
          </Box>
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<StatsIcon />} 
              onClick={handleOpenStatsDialog}
              sx={{ mr: 1 }}
            >
              Statistics
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={() => {
                fetchPendingListings();
                fetchPromotionHistory();
                fetchPromotionStats();
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Tab navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            indicatorColor="primary"
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Badge 
                    badgeContent={pendingListings.length} 
                    color="error"
                    showZero={false}
                    sx={{ '& .MuiBadge-badge': { right: -15 } }}
                  >
                    Pending Requests
                  </Badge>
                </Box>
              } 
              id="promotion-tab-0"
              aria-controls="promotion-tabpanel-0"
            />
            <Tab 
              label="Request History" 
              id="promotion-tab-1"
              aria-controls="promotion-tabpanel-1"
            />
          </Tabs>
        </Box>

        {/* Pending Requests Tab */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : pendingListings.length === 0 ? (
            <Alert severity="info">
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
                      <TableCell>Promotion Type</TableCell>
                      <TableCell>Requested On</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingListings
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {listing.images && listing.images.length > 0 ? (
                                <Box
                                  component="img"
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  sx={{ 
                                    width: 50, 
                                    height: 50, 
                                    borderRadius: 1, 
                                    mr: 2,
                                    objectFit: 'cover' 
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{ 
                                    width: 50, 
                                    height: 50, 
                                    borderRadius: 1, 
                                    mr: 2,
                                    backgroundColor: 'grey.200',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography variant="caption" color="textSecondary">
                                    No Image
                                  </Typography>
                                </Box>
                              )}
                              <Box>
                                <Typography variant="subtitle2" noWrap sx={{ maxWidth: 250 }}>
                                  {listing.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  ${listing.price}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {listing.users.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {listing.users.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {renderPromotionType(listing)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(listing.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex' }}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleOpenViewDialog(listing)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Approve">
                                <IconButton 
                                  size="small"
                                  color="success"
                                  onClick={() => handleOpenConfirmDialog(listing, 'approve')}
                                >
                                  <ApproveIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton 
                                  size="small"
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
                count={pendingListings.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={tabValue} index={1}>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : historyListings.length === 0 ? (
            <Alert severity="info">
              No promotion history found
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Listing</TableCell>
                      <TableCell>Seller</TableCell>
                      <TableCell>Promotion Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Requested On</TableCell>
                      <TableCell>Processed On</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyListings
                      .slice(historyPage * historyRowsPerPage, historyPage * historyRowsPerPage + historyRowsPerPage)
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {item.listings.images && item.listings.images.length > 0 ? (
                                <Box
                                  component="img"
                                  src={item.listings.images[0]}
                                  alt={item.listings.title}
                                  sx={{ 
                                    width: 50, 
                                    height: 50, 
                                    borderRadius: 1, 
                                    mr: 2,
                                    objectFit: 'cover' 
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{ 
                                    width: 50, 
                                    height: 50, 
                                    borderRadius: 1, 
                                    mr: 2,
                                    backgroundColor: 'grey.200',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography variant="caption" color="textSecondary">
                                    No Image
                                  </Typography>
                                </Box>
                              )}
                              <Box>
                                <Typography variant="subtitle2" noWrap sx={{ maxWidth: 250 }}>
                                  {item.listings.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  ${item.listings.price}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.users.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {item.users.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.promotion_type.charAt(0).toUpperCase() + item.promotion_type.slice(1)} 
                              size="small" 
                              color={
                                item.promotion_type === 'featured' ? 'primary' :
                                item.promotion_type === 'priority' ? 'secondary' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {renderStatusChip(item.status)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.requested_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {item.processed_at 
                              ? format(new Date(item.processed_at), 'MMM dd, yyyy')
                              : 'Pending'}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Listing">
                              <IconButton 
                                size="small"
                                onClick={() => handleOpenViewDialog(item.listings)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={historyListings.length}
                rowsPerPage={historyRowsPerPage}
                page={historyPage}
                onPageChange={handleHistoryChangePage}
                onRowsPerPageChange={handleHistoryChangeRowsPerPage}
              />
            </>
          )}
        </TabPanel>
      </Paper>

      {/* View Listing Dialog */}
      <ListingDetailDialog 
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        listing={selectedListing}
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>
          {confirmAction === 'approve' ? 'Approve Promotion Request' : 'Reject Promotion Request'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'approve'
              ? `Are you sure you want to approve this ${selectedListing?.is_featured ? 'Featured' : ''} ${
                  selectedListing?.is_featured && selectedListing?.is_priority ? '& ' : ''
                }${selectedListing?.is_priority ? 'Priority' : ''} listing promotion request?`
              : `Are you sure you want to reject this ${selectedListing?.is_featured ? 'Featured' : ''} ${
                  selectedListing?.is_featured && selectedListing?.is_priority ? '& ' : ''
                }${selectedListing?.is_priority ? 'Priority' : ''} listing promotion request?`}
          </DialogContentText>
          {selectedListing && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                {selectedListing.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Seller: {selectedListing.users?.name}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button 
            color={confirmAction === 'approve' ? 'success' : 'error'}
            variant="contained"
            onClick={confirmAction === 'approve' ? handleApprovePromotion : handleRejectPromotion}
            autoFocus
          >
            {confirmAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog 
        open={statsDialogOpen} 
        onClose={handleCloseStatsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Promotion Statistics</DialogTitle>
        <DialogContent>
          {promotionStats ? (
            Object.values(promotionStats).some(val => val !== null && val !== undefined) ? (
              <PromotionStatistics stats={promotionStats} />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: '300px' }}>
                <Typography variant="body1" color="textSecondary">
                  No promotion data available. This may happen if there are no listings in the database yet.
                </Typography>
              </Box>
            )
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatsDialog}>Close</Button>
          <Button 
            color="primary"
            variant="contained"
            onClick={() => {
              fetchPromotionStats();
            }}
          >
            Refresh
          </Button>
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
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ListingPromotionApprovals; 