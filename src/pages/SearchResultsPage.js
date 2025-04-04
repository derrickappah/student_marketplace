import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Pagination,
  Alert,
  Paper,
  Divider,
  Chip,
  Slider,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Collapse,
  useTheme,
  Card,
  alpha,
  Fade,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GridViewIcon from '@mui/icons-material/GridView';
import TuneIcon from '@mui/icons-material/Tune';
import ViewListIcon from '@mui/icons-material/ViewList';
import ListingCard from '../components/ListingCard';
import { getListings, getCategories } from '../services/supabase';

const ITEMS_PER_PAGE = 12;
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const queryParams = new URLSearchParams(location.search);

  const [listings, setListings] = useState([]);
  const [priorityListings, setPriorityListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [gridView, setGridView] = useState(true);
  const [filters, setFilters] = useState({
    search: queryParams.get('q') || '',
    category: queryParams.get('category') || '',
    minPrice: queryParams.get('minPrice') || '',
    maxPrice: queryParams.get('maxPrice') || '',
    condition: queryParams.get('condition') || '',
    sortBy: queryParams.get('sortBy') || 'newest',
    showPromotedOnly: queryParams.get('promotedOnly') === 'true',
    page: parseInt(queryParams.get('page')) || 1,
  });
  
  const [priceRange, setPriceRange] = useState([
    filters.minPrice ? parseFloat(filters.minPrice) : 0,
    filters.maxPrice ? parseFloat(filters.maxPrice) : 1000
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        // Get priority listings first (those that are promoted and approved)
        const priorityResult = await getListings({
          search: filters.search,
          category: filters.category,
          condition: filters.condition,
          minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          isPriority: true,
          sortBy: filters.sortBy,
          itemsPerPage: 100, // Get all priority listings
          page: 1
        });
        
        if (priorityResult.error) throw priorityResult.error;
        
        setPriorityListings(priorityResult.data || []);
        
        // Then get regular listings, excluding priority ones
        const { data, count, error } = await getListings({
          search: filters.search,
          category: filters.category,
          condition: filters.condition,
          minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          excludeIds: priorityResult.data?.map(item => item.id) || [],
          showPromotedOnly: filters.showPromotedOnly,
          sortBy: filters.sortBy,
          page: filters.page,
          itemsPerPage: ITEMS_PER_PAGE
        });

        if (error) throw error;

        setListings(data || []);
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      } catch (err) {
        setError('Error loading listings');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to first page when filters change
    }));

    // Update URL
    const newParams = new URLSearchParams(location.search);
    if (value) {
      newParams.set(name, value);
    } else {
      newParams.delete(name);
    }
    newParams.set('page', '1');
    navigate(`${location.pathname}?${newParams.toString()}`);
  };
  
  const handlePromotedOnlyChange = (event) => {
    const checked = event.target.checked;
    setFilters((prev) => ({
      ...prev,
      showPromotedOnly: checked,
      page: 1,
    }));
    
    const newParams = new URLSearchParams(location.search);
    if (checked) {
      newParams.set('promotedOnly', 'true');
    } else {
      newParams.delete('promotedOnly');
    }
    newParams.set('page', '1');
    navigate(`${location.pathname}?${newParams.toString()}`);
  };
  
  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };
  
  const handlePriceRangeCommitted = () => {
    setFilters((prev) => ({
      ...prev,
      minPrice: priceRange[0].toString(),
      maxPrice: priceRange[1].toString(),
      page: 1,
    }));
    
    const newParams = new URLSearchParams(location.search);
    newParams.set('minPrice', priceRange[0].toString());
    newParams.set('maxPrice', priceRange[1].toString());
    newParams.set('page', '1');
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  const handlePageChange = (event, newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));

    const newParams = new URLSearchParams(location.search);
    newParams.set('page', newPage.toString());
    navigate(`${location.pathname}?${newParams.toString()}`);
  };
  
  const applyFilters = (event) => {
    event.preventDefault();
    // Already handled by individual filter changes
  };
  
  const clearFilters = () => {
    // Reset filters but keep search term
    const searchTerm = filters.search;
    setFilters({
      search: searchTerm,
      category: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      sortBy: 'newest',
      showPromotedOnly: false,
      page: 1,
    });
    setPriceRange([0, 1000]);
    
    // Update URL
    const newParams = new URLSearchParams();
    if (searchTerm) newParams.set('q', searchTerm);
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  // Combine priority listings with regular listings for display
  const displayListings = [...priorityListings, ...listings];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          width: '100%',
          borderRadius: 3,
          mb: 4,
          p: { xs: 2, md: 4 },
          background: isDarkMode
            ? `linear-gradient(120deg, ${alpha(theme.palette.primary.dark, 0.2)}, ${alpha(theme.palette.background.default, 0.1)})`
            : `linear-gradient(120deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.background.default, 0.05)})`,
          backdropFilter: 'blur(8px)',
          boxShadow: theme.shadows[2],
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)}, transparent 70%)`,
            transform: 'translate(30%, -30%)',
            zIndex: 0,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              mb: 2,
              fontWeight: 700,
              background: isDarkMode
                ? 'linear-gradient(90deg, #fff, #e0e0e0)'
                : 'linear-gradient(90deg, #1a237e, #283593)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em',
            }}
          >
            {filters.search ? `Results for "${filters.search}"` : 'Find Your Perfect Items'}
          </Typography>

          <Box
            component="form"
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              width: '100%',
              maxWidth: '800px',
            }}
            onSubmit={(e) => {
              e.preventDefault();
              const newParams = new URLSearchParams();
              if (filters.search) newParams.set('q', filters.search);
              navigate(`${location.pathname}?${newParams.toString()}`);
            }}
          >
            <TextField
              fullWidth
              name="search"
              label="What are you looking for?"
              value={filters.search}
              onChange={handleFilterChange}
              variant="outlined"
              sx={{
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: isDarkMode 
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.9),
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    backgroundColor: isDarkMode 
                      ? alpha(theme.palette.background.paper, 0.9)
                      : '#fff',
                  },
                  '&.Mui-focused': {
                    backgroundColor: isDarkMode 
                      ? alpha(theme.palette.background.paper, 1)
                      : '#fff',
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit" edge="end">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              startIcon={<TuneIcon />}
              sx={{
                minWidth: 120,
                borderRadius: 2,
                boxShadow: theme.shadows[3],
                whiteSpace: 'nowrap',
              }}
            >
              Filters
            </Button>
          </Box>

          <Collapse in={showAdvancedFilters}>
            <Card sx={{ mt: 3, p: 2, borderRadius: 2, boxShadow: theme.shadows[3] }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Condition</InputLabel>
                    <Select
                      name="condition"
                      value={filters.condition}
                      onChange={handleFilterChange}
                      label="Condition"
                    >
                      <MenuItem value="">Any Condition</MenuItem>
                      {CONDITION_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                      label="Sort By"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.showPromotedOnly}
                        onChange={handlePromotedOnlyChange}
                        name="showPromotedOnly"
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">Featured Only</Typography>
                        <StarIcon sx={{ ml: 0.5, color: 'warning.main', fontSize: 18 }} />
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography gutterBottom>
                    Price Range: GHC {priceRange[0]} - GHC {priceRange[1]}
                  </Typography>
                  <Slider
                    value={priceRange}
                    onChange={handlePriceRangeChange}
                    onChangeCommitted={handlePriceRangeCommitted}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                    step={10}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={clearFilters} variant="outlined">
                      Clear All
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Collapse>
        </Box>
      </Box>

      {/* Results Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Finding items...' : `${listings.length} results found${filters.search ? ` for "${filters.search}"` : ''}`}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant={gridView ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setGridView(true)}
              sx={{ minWidth: 'auto', p: 1 }}
            >
              <GridViewIcon fontSize="small" />
            </Button>
            <Button
              size="small"
              variant={!gridView ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setGridView(false)}
              sx={{ minWidth: 'auto', p: 1 }}
            >
              <ViewListIcon fontSize="small" />
            </Button>
            
            <Chip 
              label={`Page ${filters.page} of ${totalPages}`} 
              size="small" 
              variant="outlined" 
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Priority Listings */}
      {priorityListings.length > 0 && (
        <Fade in={!loading} timeout={600}>
          <Box sx={{ mb: 4 }}>
            <Box 
              sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center',
                p: 1,
                pl: 2,
                borderRadius: 2,
                background: isDarkMode
                  ? alpha(theme.palette.warning.dark, 0.15)
                  : alpha(theme.palette.warning.light, 0.15),
              }}
            >
              <StarIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Featured Listings
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {priorityListings.map((listing) => (
                <Grid item key={listing.id} xs={12} sm={gridView ? 6 : 12} md={gridView ? 4 : 12} lg={gridView ? 3 : 12}>
                  <ListingCard listing={listing} />
                </Grid>
              ))}
            </Grid>
            
            <Divider sx={{ my: 4 }} />
          </Box>
        </Fade>
      )}

      {/* Regular Listings */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {displayListings.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
                borderRadius: 3,
                border: `1px dashed ${theme.palette.divider}`,
                bgcolor: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.4)
                  : alpha(theme.palette.background.paper, 0.6),
              }}
            >
              <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 1 }}>
                No listings found
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Try adjusting your search filters or browse all listings
              </Typography>
            </Box>
          ) : (
            <Fade in={!loading} timeout={600}>
              <Grid container spacing={3}>
                {listings.map((listing) => (
                  <Grid item key={listing.id} xs={12} sm={gridView ? 6 : 12} md={gridView ? 4 : 12} lg={gridView ? 3 : 12}>
                    <ListingCard listing={listing} />
                  </Grid>
                ))}
              </Grid>
            </Fade>
          )}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 2 }}>
              <Pagination
                count={totalPages}
                page={filters.page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default SearchResultsPage; 