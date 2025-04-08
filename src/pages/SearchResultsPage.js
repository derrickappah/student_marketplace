import React, { useState, useEffect, useMemo } from 'react';
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

const ITEMS_PER_SLIDER = 10;
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

  const [categories, setCategories] = useState([]);
  const [categorizedListings, setCategorizedListings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: queryParams.get('q') || '',
    category: queryParams.get('category') || '',
    minPrice: queryParams.get('minPrice') || '',
    maxPrice: queryParams.get('maxPrice') || '',
    condition: queryParams.get('condition') || '',
    sortBy: queryParams.get('sortBy') || 'newest',
    showPromotedOnly: queryParams.get('promotedOnly') === 'true',
  });
  
  const [priceRange, setPriceRange] = useState([
    filters.minPrice ? parseFloat(filters.minPrice) : 0,
    filters.maxPrice ? parseFloat(filters.maxPrice) : 1000
  ]);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        const cats = await getCategories();
        setCategories(cats || []);
        const initialCategorizedState = {};
        (cats || []).forEach(cat => {
          initialCategorizedState[cat.id || cat.name] = { 
            name: cat.name, 
            listings: [], 
            loading: true,
            error: null 
          };
        });
        setCategorizedListings(initialCategorizedState);
        
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Could not load categories.');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (Object.keys(categorizedListings).length === 0) {
        if (loading && categories.length === 0) return; 
        if (!loading && categories.length === 0 && error) return;
        if (!loading && categories.length > 0 && Object.keys(categorizedListings).length === 0) return;
    }
    
    const fetchListingsForCategories = async () => {
        let anyCategoryStillLoading = false;
        
        for (const category of categories) {
          const categoryId = category.id || category.name;
          
          if (!categorizedListings[categoryId]?.loading) continue; 

          anyCategoryStillLoading = true;
          try {
            const { data, error: fetchError } = await getListings({
          search: filters.search,
              category: categoryId,
          condition: filters.condition,
          minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          sortBy: filters.sortBy,
              showPromotedOnly: filters.showPromotedOnly,
              itemsPerPage: ITEMS_PER_SLIDER,
          page: 1
        });
        
            if (fetchError) throw fetchError;

            // Process data to map 'users' to 'seller'
            const processedData = (data || []).map(listing => ({
              ...listing,
              seller: listing.users || { name: 'Unknown Seller', university: 'N/A' } // Provide a default if users is null
            }));

            setCategorizedListings(prev => ({
              ...prev,
              [categoryId]: { 
                ...prev[categoryId], 
                listings: processedData, // Use processed data
                loading: false, 
                error: null 
              }
            }));

      } catch (err) {
            console.error(`Error fetching listings for category ${categoryId}:`, err);
            setCategorizedListings(prev => ({
              ...prev,
              [categoryId]: { 
                ...prev[categoryId], 
                listings: [], 
                loading: false, 
                error: 'Could not load listings' 
              }
            }));
          }
        }
        if (!anyCategoryStillLoading) {
        setLoading(false);
      }
    };

    fetchListingsForCategories();
    
  }, [categories, filters.search, filters.sortBy, filters.condition, filters.minPrice, filters.maxPrice, filters.showPromotedOnly]);

  useEffect(() => {
    setCategorizedListings(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(catId => {
            newState[catId] = { ...newState[catId], loading: true, error: null };
        });
        return newState;
    });
    setLoading(true);
  }, [filters.search]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setCategorizedListings(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(catId => {
            newState[catId] = { ...newState[catId], loading: true, error: null };
        });
        return newState;
    });
    setLoading(true); 

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    const newParams = new URLSearchParams(location.search);
    if (value) {
      newParams.set(name, value);
    } else {
      newParams.delete(name);
    }
    navigate(`${location.pathname}?${newParams.toString()}`);
  };
  
  const handlePromotedOnlyChange = (event) => {
    const checked = event.target.checked;
    setCategorizedListings(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(catId => {
            newState[catId] = { ...newState[catId], loading: true, error: null };
        });
        return newState;
    });
    setLoading(true); 

    setFilters((prev) => ({
      ...prev,
      showPromotedOnly: checked,
    }));
    
    const newParams = new URLSearchParams(location.search);
    if (checked) {
      newParams.set('promotedOnly', 'true');
    } else {
      newParams.delete('promotedOnly');
    }
    navigate(`${location.pathname}?${newParams.toString()}`);
  };
  
  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };
  
  const handlePriceRangeCommitted = () => {
    setCategorizedListings(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(catId => {
            newState[catId] = { ...newState[catId], loading: true, error: null };
        });
        return newState;
    });
    setLoading(true); 

    setFilters((prev) => ({
      ...prev,
      minPrice: priceRange[0].toString(),
      maxPrice: priceRange[1].toString(),
    }));
    
    const newParams = new URLSearchParams(location.search);
    newParams.set('minPrice', priceRange[0].toString());
    newParams.set('maxPrice', priceRange[1].toString());
    navigate(`${location.pathname}?${newParams.toString()}`);
  };
  
  const clearFilters = () => {
    setCategorizedListings(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(catId => {
            newState[catId] = { ...newState[catId], loading: true, error: null };
        });
        return newState;
    });
    setLoading(true);

    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      sortBy: 'newest',
      showPromotedOnly: false,
    });
    setPriceRange([0, 1000]);
    
    const newParams = new URLSearchParams();
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  const renderSliders = () => {
    if (loading && categories.length === 0 && Object.keys(categorizedListings).length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error && categories.length === 0) {
        return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
    }

    const categoriesWithListings = categories.filter(category => {
        const categoryId = category.id || category.name;
        const data = categorizedListings[categoryId];
        return data && !data.loading && !data.error && data.listings.length > 0;
    });
      
    const allCategoriesLoaded = Object.values(categorizedListings).every(data => !data.loading);
    if (allCategoriesLoaded && categoriesWithListings.length === 0) {
  return (
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
                mt: 4
              }}
            >
              <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 1 }}>
                No listings found
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Try adjusting your search filters or clearing them to browse all categories.
              </Typography>
            </Box>
        );
    }

    return categoriesWithListings.map(category => {
      const categoryId = category.id || category.name;
      const categoryData = categorizedListings[categoryId];

      return (
        <Box key={categoryId} sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              {categoryData.name}
            </Typography>
            <Button 
                variant="outlined"
                size="small" 
                onClick={() => {
                    const params = new URLSearchParams();
                    params.set('category', categoryId);
                    if (filters.search) params.set('q', filters.search);
                    navigate(`/search?${params.toString()}`);
                }}
                endIcon={<FilterListIcon />}
                sx={{ borderRadius: '20px' }}
            >
                See All
            </Button>
          </Box>
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: { xs: 1.5, sm: 2.5 },
              py: 1.5,
              px: 0.5,
              '&::-webkit-scrollbar': { height: '8px' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.2), borderRadius: '4px' },
              '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
            }}
          >
            {categoryData.listings.map(listing => (
              <Box key={listing.id} sx={{ 
                  flex: '0 0 auto', 
                  width: { xs: '220px', sm: '260px', md: '280px' },
                }}
              >
                    <ListingCard listing={listing} />
              </Box>
            ))}
            <Box sx={{ flex: '0 0 1px' }} />
          </Box>
        </Box>
      );
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
            fontWeight: 'bold', 
            mb: 3,
            color: isDarkMode ? theme.palette.grey[100] : theme.palette.grey[900]
        }}
      >
        {filters.search 
          ? `Search Results for "${filters.search}"` 
          : filters.category 
          ? `Listings in ${categories.find(c => (c.id || c.name) === filters.category)?.name || filters.category}`
          : 'Find Your Perfect Items' 
        }
      </Typography>

      <Paper 
        elevation={3}
        sx={{ 
            p: { xs: 2, md: 3 }, 
            mb: 4, 
            borderRadius: 4,
            background: isDarkMode 
              ? `linear-gradient(145deg, ${alpha(theme.palette.grey[900], 0.9)}, ${alpha(theme.palette.primary.dark, 0.2)})`
              : `linear-gradient(145deg, ${theme.palette.grey[100]}, ${theme.palette.grey[50]})`,
            boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={9}>
            <TextField
              fullWidth
              name="search"
              placeholder="What are you looking for?"
              variant="outlined"
              value={filters.search}
              onChange={handleFilterChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                      <SearchIcon sx={{ color: isDarkMode? 'grey.500' : 'grey.600' }}/>
                  </InputAdornment>
                ),
                sx: { 
                    borderRadius: 3,
                    backgroundColor: isDarkMode ? alpha(theme.palette.grey[800], 0.5) : alpha(theme.palette.common.white, 0.8),
                    '& fieldset': { borderColor: alpha(theme.palette.grey[500], 0.3) },
                    '&:hover fieldset': { borderColor: alpha(theme.palette.grey[500], 0.5) },
                }
              }}
              onKeyPress={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault(); 
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <Button
                fullWidth 
                variant="contained"
                color="primary"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                startIcon={<TuneIcon />}
                endIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ 
                    height: '56px',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '1rem',
                    textTransform: 'none'
                 }}
            >
              Filters
            </Button>
          </Grid>
        </Grid>
        
        <Collapse in={showAdvancedFilters} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 3, borderColor: alpha(theme.palette.divider, 0.2) }} />
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  label="Category"
                >
                <MenuItem value=""><em>All Categories</em></MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat.id || cat.name} value={cat.id || cat.name}>{cat.name}</MenuItem>
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
                <MenuItem value=""><em>Any Condition</em></MenuItem>
                {CONDITION_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" >
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    label="Sort By"
                  >
                    {SORT_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Price Range (Ghc)</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Min"
                  type="number"
                  size="small"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value) < 0 ? 0 : Number(e.target.value), priceRange[1]])}
                  onBlur={handlePriceRangeCommitted}
                  sx={{ width: '100px' }}
                  inputProps={{ min: 0 }}
                />
                  <Slider
                    value={priceRange}
                    onChange={handlePriceRangeChange}
                    onChangeCommitted={handlePriceRangeCommitted}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                    step={10}
                  sx={{ mx: 1 }}
                  disableSwap
                />
                 <TextField
                  label="Max"
                  type="number"
              size="small"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) < 0 ? 0 : Number(e.target.value)])}
                  onBlur={handlePriceRangeCommitted}
                  sx={{ width: '100px' }}
                  inputProps={{ min: 0 }}
            />
          </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.showPromotedOnly}
                      onChange={handlePromotedOnlyChange}
                      name="showPromotedOnly"
                    />
                  }
                  label="Show Promoted Listings Only"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Button 
                    fullWidth 
                    variant="outlined"
                    onClick={clearFilters}
                    sx={{ height: '40px' }}
                >
                    Clear All Filters
                </Button>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      <Box sx={{ mt: 4 }}>
         {renderSliders()}
            </Box>
    </Container>
  );
};

export default SearchResultsPage; 