import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  Card,
  CardMedia,
  Grid,
  Collapse,
  Stack,
  useTheme,
  Menu,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Checkbox
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  FilterList as FilterListIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
  SwapVert as SortIcon,
  Image as ImageIcon,
  Star as StarIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Save as SaveIcon,
  List as ListIcon
} from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { logAdminAction } from '../../services/adminService';
import { adminDeleteListing, adminBulkDeleteListings } from '../../services/supabase';

const ListingManagement = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  const [selectedListing, setSelectedListing] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [viewListingOpen, setViewListingOpen] = useState(false);
  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [selectedListings, setSelectedListings] = useState([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  const [dateRange, setDateRange] = useState([null, null]);
  const [savedFilters, setSavedFilters] = useState([
    { 
      id: 1, 
      name: 'Recent Expensive Items', 
      filters: { 
        statusFilter: 'available', 
        categoryFilter: 'all', 
        minPrice: '100', 
        maxPrice: '', 
        sortField: 'created_at', 
        sortDirection: 'desc' 
      } 
    },
    { 
      id: 2, 
      name: 'Sold Electronics', 
      filters: { 
        statusFilter: 'sold', 
        categoryFilter: '2', // Assuming 2 is the electronics category ID
        minPrice: '', 
        maxPrice: '', 
        sortField: 'price', 
        sortDirection: 'desc' 
      } 
    }
  ]);
  const [saveFilterDialogOpen, setSaveFilterDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [savedFiltersMenuAnchor, setSavedFiltersMenuAnchor] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    fetchListings();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [
    listings,
    searchQuery,
    statusFilter,
    categoryFilter,
    sortField,
    sortDirection,
    minPrice,
    maxPrice,
    dateRange
  ]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          users:user_id (name, email),
          categories:category_id (name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...listings];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        listing => 
          listing.title?.toLowerCase().includes(query) || 
          listing.description?.toLowerCase().includes(query) ||
          listing.users?.name?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(listing => listing.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(listing => listing.category_id === categoryFilter);
    }
    
    // Apply price filters
    if (minPrice) {
      filtered = filtered.filter(listing => listing.price >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
      filtered = filtered.filter(listing => listing.price <= parseFloat(maxPrice));
    }
    
    // Apply date range filter
    if (dateRange[0] && dateRange[1]) {
      const startDate = new Date(dateRange[0]);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange[1]);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(listing => {
        const listingDate = new Date(listing.created_at);
        return listingDate >= startDate && listingDate <= endDate;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'title' || sortField === 'description') {
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      } else if (sortField === 'price') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredListings(filtered);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeSorting = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const handleSelectListing = (event, listingId) => {
    event.stopPropagation();
    const selectedIndex = selectedListings.indexOf(listingId);
    let newSelected = [];
    
    if (selectedIndex === -1) {
      newSelected = [...selectedListings, listingId];
    } else {
      newSelected = selectedListings.filter(id => id !== listingId);
    }
    
    setSelectedListings(newSelected);
  };
  
  const handleSelectAllListings = (event) => {
    if (event.target.checked) {
      const newSelecteds = filteredListings.map(n => n.id);
      setSelectedListings(newSelecteds);
      return;
    }
    setSelectedListings([]);
  };
  
  const isListingSelected = (id) => selectedListings.indexOf(id) !== -1;
  
  const handleOpenBulkDeleteDialog = () => {
    if (selectedListings.length > 0) {
      setConfirmBulkDeleteOpen(true);
    } else {
      setSnackbarMessage('Please select at least one listing to delete');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };
  
  const handleCloseBulkDeleteDialog = () => {
    setConfirmBulkDeleteOpen(false);
  };
  
  const handleBulkDeleteListings = async () => {
    try {
      const { success, count, listings: deletedListings, error } = await adminBulkDeleteListings(selectedListings);
      
      if (!success) throw error;
      
      // Log the bulk delete action
      logAdminAction(
        'delete',
        `Bulk deleted ${count} listings`,
        selectedListings.join(','),
        'listing'
      );
      
      // Update local state
      setListings(listings.filter(listing => !selectedListings.includes(listing.id)));
      setSelectedListings([]);
      handleCloseBulkDeleteDialog();
      
      // Show success message
      setSnackbarMessage(`Successfully deleted ${count} listings`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting listings:', error);
      // Show error message
      setSnackbarMessage('Error deleting listings');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleOpenDeleteDialog = (listing) => {
    setSelectedListing(listing);
    setConfirmDeleteOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setConfirmDeleteOpen(false);
    setSelectedListing(null);
  };

  const handleDeleteListing = async () => {
    if (!selectedListing) return;
    
    try {
      const { success, listing, error } = await adminDeleteListing(selectedListing.id);
      
      if (!success) throw error;
      
      // Log the delete action
      logAdminAction(
        'delete',
        `Deleted listing: ${selectedListing.title}`,
        selectedListing.id,
        'listing'
      );
      
      // Update local state
      setListings(listings.filter(listing => listing.id !== selectedListing.id));
      handleCloseDeleteDialog();
      
      // Show success message
      setSnackbarMessage('Listing deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting listing:', error);
      // Show error message
      setSnackbarMessage('Error deleting listing');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleOpenViewDialog = (listing) => {
    setSelectedListing(listing);
    setViewListingOpen(true);
    
    // Log the view action
    logAdminAction(
      'view',
      `Viewed listing details: ${listing.title}`,
      listing.id,
      'listing'
    );
  };

  const handleCloseViewDialog = () => {
    setViewListingOpen(false);
    setSelectedListing(null);
  };

  const handleOpenEditStatusDialog = (listing) => {
    setSelectedListing(listing);
    setNewStatus(listing.status);
    setEditStatusOpen(true);
  };

  const handleCloseEditStatusDialog = () => {
    setEditStatusOpen(false);
    setSelectedListing(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedListing) return;
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedListing.id);
        
      if (error) throw error;
      
      // Update local state
      setListings(listings.map(listing => 
        listing.id === selectedListing.id 
          ? { ...listing, status: newStatus, updated_at: new Date().toISOString() } 
          : listing
      ));
      
      handleCloseEditStatusDialog();
    } catch (error) {
      console.error('Error updating listing status:', error);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setSortField('created_at');
    setSortDirection('desc');
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'available':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Available"
            size="small"
            color="success"
            sx={{ fontWeight: 'medium' }}
          />
        );
      case 'pending':
        return (
          <Chip
            icon={<StarIcon />}
            label="Pending"
            size="small"
            color="warning"
            sx={{ fontWeight: 'medium' }}
          />
        );
      case 'sold':
        return (
          <Chip
            icon={<CancelIcon />}
            label="Sold"
            size="small"
            color="primary"
            sx={{ fontWeight: 'medium' }}
          />
        );
      default:
        return (
          <Chip
            label={status || 'Unknown'}
            size="small"
            color="default"
            sx={{ fontWeight: 'medium' }}
          />
        );
    }
  };

  const handleSaveFilter = () => {
    setSaveFilterDialogOpen(true);
  };

  const handleCloseSaveFilterDialog = () => {
    setSaveFilterDialogOpen(false);
    setNewFilterName('');
  };

  const handleSaveNewFilter = () => {
    if (!newFilterName.trim()) return;
    
    const newFilter = {
      id: Date.now(), // Use timestamp as a simple ID
      name: newFilterName,
      filters: {
        statusFilter,
        categoryFilter,
        minPrice,
        maxPrice,
        sortField,
        sortDirection,
        dateRange
      }
    };
    
    setSavedFilters([...savedFilters, newFilter]);
    setSnackbarMessage('Filter saved successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    handleCloseSaveFilterDialog();
  };

  const handleOpenSavedFiltersMenu = (event) => {
    setSavedFiltersMenuAnchor(event.currentTarget);
  };

  const handleCloseSavedFiltersMenu = () => {
    setSavedFiltersMenuAnchor(null);
  };

  const handleApplySavedFilter = (filter) => {
    const { filters } = filter;
    setStatusFilter(filters.statusFilter);
    setCategoryFilter(filters.categoryFilter);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    setSortField(filters.sortField);
    setSortDirection(filters.sortDirection);
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      setDateRange(filters.dateRange);
    } else {
      setDateRange([null, null]);
    }
    
    setSnackbarMessage(`Applied filter: ${filter.name}`);
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    handleCloseSavedFiltersMenu();
  };

  const handleDeleteSavedFilter = (id) => {
    setSavedFilters(savedFilters.filter(filter => filter.id !== id));
    setSnackbarMessage('Filter deleted');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Listings Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View and manage marketplace listings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            disabled={selectedListings.length === 0}
            startIcon={<DeleteIcon />}
            onClick={handleOpenBulkDeleteDialog}
          >
            Delete Selected ({selectedListings.length})
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchListings}
          >
            Refresh
          </Button>
          <Tooltip title="View documentation on listing management">
            <Button
              variant="outlined"
              color="info"
              onClick={() => navigate('/admin/listings/guide')}
            >
              Guide
            </Button>
          </Tooltip>
          <Tooltip title="Learn how to fix deletion errors">
            <Button
              variant="outlined"
              color="warning"
              onClick={() => navigate('/admin/deletion-guide')}
            >
              Deletion Help
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Basic Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2 
        }}>
          <TextField
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
            <FormControl sx={{ minWidth: 140, width: { xs: '50%', md: 'auto' } }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              onClick={() => setExpandedFilters(!expandedFilters)}
              variant="outlined"
              color="primary"
              startIcon={<FilterListIcon />}
              endIcon={expandedFilters ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
              sx={{ width: { xs: '50%', md: 'auto' } }}
            >
              Advanced
            </Button>
          </Box>
        </Box>
        
        {/* Advanced Filters */}
        <Collapse in={expandedFilters}>
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="category-filter-label">Category</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    id="category-filter"
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Min Price"
                  type="number"
                  fullWidth
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Max Price"
                  type="number"
                  fullWidth
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DateRangePicker
                  startText="Created From"
                  endText="Created To"
                  value={dateRange}
                  onChange={setDateRange}
                  renderInput={(startProps, endProps) => (
                    <>
                      <TextField {...startProps} fullWidth />
                      <Box sx={{ mx: 2 }}> to </Box>
                      <TextField {...endProps} fullWidth />
                    </>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleSaveFilter}
                    startIcon={<SaveIcon />}
                  >
                    Save Filter
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleOpenSavedFiltersMenu}
                    startIcon={<ListIcon />}
                  >
                    Saved Filters
                  </Button>
                  <Menu
                    anchorEl={savedFiltersMenuAnchor}
                    open={Boolean(savedFiltersMenuAnchor)}
                    onClose={handleCloseSavedFiltersMenu}
                    PaperProps={{
                      sx: { width: 250, maxHeight: 300, boxShadow: 3 }
                    }}
                  >
                    {savedFilters.length === 0 ? (
                      <MenuItem disabled>
                        <ListItemText primary="No saved filters" />
                      </MenuItem>
                    ) : (
                      savedFilters.map((filter) => (
                        <MenuItem key={filter.id}>
                          <ListItemIcon>
                            <BookmarkIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={filter.name} 
                            onClick={() => handleApplySavedFilter(filter)}
                            sx={{ cursor: 'pointer' }}
                          />
                          <IconButton 
                            size="small" 
                            edge="end" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSavedFilter(filter.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </MenuItem>
                      ))
                    )}
                  </Menu>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  sx={{ height: '100%' }}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Results Info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, px: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Loading listings...' : `${filteredListings.length} listings found`}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {sortDirection === 'asc' ? 'Ascending' : 'Descending'} by {sortField.replace('_', ' ')}
        </Typography>
      </Box>

      {/* Listings Table */}
      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="listings table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedListings.length > 0 && selectedListings.length < filteredListings.length}
                    checked={filteredListings.length > 0 && selectedListings.length === filteredListings.length}
                    onChange={handleSelectAllListings}
                    inputProps={{ 'aria-label': 'select all listings' }}
                  />
                </TableCell>
                <TableCell>Listing</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    Loading listings...
                  </TableCell>
                </TableRow>
              ) : filteredListings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    No listings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredListings
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((listing) => {
                    const isSelected = isListingSelected(listing.id);
                    return (
                    <TableRow 
                      key={listing.id} 
                      hover
                      role="checkbox"
                      aria-checked={isSelected}
                      selected={isSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={(event) => handleSelectListing(event, listing.id)}
                          inputProps={{ 'aria-labelledby': `listing-${listing.id}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {listing.images && listing.images[0] ? (
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                mr: 2,
                                borderRadius: 1,
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 48,
                                height: 48,
                                mr: 2,
                                borderRadius: 1,
                                bgcolor: 'action.disabledBackground',
                                flexShrink: 0,
                              }}
                            >
                              <ImageIcon color="action" />
                            </Box>
                          )}
                          <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 200 }}>
                            {listing.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          ${parseFloat(listing.price).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {listing.users?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {listing.users?.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {listing.categories?.name || 'Uncategorized'}
                      </TableCell>
                      <TableCell>{getStatusChip(listing.status)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(listing.created_at), 'MMM d, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(listing.created_at), 'h:mm a')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenViewDialog(listing)}
                              aria-label="view"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Status">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditStatusDialog(listing)}
                              aria-label="edit status"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Listing">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(listing)}
                              aria-label="delete"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredListings.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* View Listing Dialog */}
      <Dialog
        open={viewListingOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedListing && (
          <>
            <DialogTitle>
              Listing Details
            </DialogTitle>
            <DialogContent>
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
                    <Box
                      sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'action.disabledBackground',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No image available
                      </Typography>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" gutterBottom>
                    {selectedListing.title}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      ${parseFloat(selectedListing.price).toFixed(2)}
                    </Typography>
                    {getStatusChip(selectedListing.status)}
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Seller:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedListing.users?.name || 'Unknown'} ({selectedListing.users?.email})
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Category:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedListing.categories?.name || 'Uncategorized'}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Condition:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedListing.condition || 'Not specified'}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Created:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {format(new Date(selectedListing.created_at), 'PPP p')}
                  </Typography>
                  
                  {selectedListing.updated_at && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Last Updated:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {format(new Date(selectedListing.updated_at), 'PPP p')}
                      </Typography>
                    </>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description:
                  </Typography>
                  <Typography variant="body2">
                    {selectedListing.description}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => handleOpenEditStatusDialog(selectedListing)} color="primary">
                Edit Status
              </Button>
              <Button 
                onClick={() => {
                  handleCloseViewDialog();
                  handleOpenDeleteDialog(selectedListing);
                }} 
                color="error"
              >
                Delete Listing
              </Button>
              <Button onClick={handleCloseViewDialog} variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={editStatusOpen} onClose={handleCloseEditStatusDialog}>
        <DialogTitle>Change Listing Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="edit-status-label">Status</InputLabel>
              <Select
                labelId="edit-status-label"
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseEditStatusDialog} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} variant="contained" color="primary">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Listing Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Listing</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the listing "{selectedListing?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDeleteDialog} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteListing} variant="contained" color="error">
            Delete Listing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Filter Dialog */}
      <Dialog open={saveFilterDialogOpen} onClose={handleCloseSaveFilterDialog}>
        <DialogTitle>Save Filter Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Filter Name"
            fullWidth
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            placeholder="E.g., Recent Expensive Items"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSaveFilterDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveNewFilter} 
            color="primary" 
            disabled={!newFilterName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={confirmBulkDeleteOpen}
        onClose={handleCloseBulkDeleteDialog}
        aria-labelledby="bulk-delete-dialog-title"
        aria-describedby="bulk-delete-dialog-description"
      >
        <DialogTitle id="bulk-delete-dialog-title">Delete Multiple Listings</DialogTitle>
        <DialogContent>
          <DialogContentText id="bulk-delete-dialog-description">
            Are you sure you want to delete {selectedListings.length} selected listing{selectedListings.length !== 1 ? 's' : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseBulkDeleteDialog} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleBulkDeleteListings} variant="contained" color="error">
            Delete {selectedListings.length} Listing{selectedListings.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ListingManagement; 