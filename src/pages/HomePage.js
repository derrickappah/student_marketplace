import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Divider,
  Paper,
  InputAdornment,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  alpha,
  Stack,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  TrendingUp as TrendingIcon,
  School as SchoolIcon,
  LocalOffer as OfferIcon,
  Security as SecurityIcon,
  SupportAgent as SupportIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Category as CategoryIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import ListingCard from '../components/ListingCard';
import FeaturedListings from '../components/FeaturedListings';
import { getCategories } from '../services/supabase';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryIcons';
import { useAuth } from '../contexts/AuthContext';

const renderCategoryIcon = (categoryName, options = {}) => {
  const { size = 30, useColor = false } = options;
  
  try {
    // For menu items with color
    if (useColor) {
      return React.cloneElement(getCategoryIcon(categoryName), { 
        fontSize: 'small',
        sx: { color: getCategoryColor(categoryName) } 
      });
    }
    
    // For category cards or default rendering
    return React.cloneElement(getCategoryIcon(categoryName), { 
      sx: { fontSize: size } 
    });
  } catch (error) {
    console.error(`Error rendering icon for category "${categoryName}":`, error);
    return <CategoryIcon sx={{ fontSize: size }} />;
  }
};

const HomePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    search: '',
    category: '',
  });

  // Create memoized props for FeaturedListings to prevent unnecessary re-renders
  const featuredListingsProps = useMemo(() => ({
    maxItems: 8
  }), []);

  const newListingsProps = useMemo(() => ({
    title: "Latest Additions",
    maxItems: 4,
    defaultTab: 1
  }), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchParams.search) queryParams.set('q', searchParams.search);
    if (searchParams.category) queryParams.set('category', searchParams.category);
    navigate(`/search?${queryParams.toString()}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section - New Design */}
      <Box
        sx={{
          position: 'relative',
          color: 'white',
          pt: { xs: 6, md: 8 },
          pb: { xs: 12, md: 16 },
          overflow: 'hidden',
          background: 'linear-gradient(120deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/pattern-dots.svg)',
            backgroundSize: '20px 20px',
            opacity: 0.2,
            zIndex: 1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            right: '-10%',
            bottom: '-10%',
            background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)',
            zIndex: 1,
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Chip 
                label="University Marketplace" 
                size="small" 
                color="secondary" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 'bold',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  py: 1
                }}
              />
              
              <Typography 
                variant="h1" 
                component="h1" 
                sx={{ 
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  mb: 2,
                  textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  lineHeight: 1.2,
                }}
              >
                Your Campus <br />
                <Box 
                  component="span" 
                  sx={{ 
                    background: 'linear-gradient(90deg, #FFFFFF 0%, #F0F9FF 100%)', 
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: 'none'
                  }}
                >
                  Marketplace
                </Box>
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4, 
                  fontWeight: 400,
                  opacity: 0.9,
                  maxWidth: '500px',
                  mx: { xs: 'auto', md: 0 },
                  lineHeight: 1.5,
                }}
              >
                Connect, buy, sell and trade with other students in your university community. Find exactly what you need, from textbooks to electronics.
              </Typography>

              {/* Search Form - Redesigned */}
              <Paper
                component="form"
                onSubmit={handleSearch}
                elevation={5}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  p: 2,
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  maxWidth: '600px',
                  mx: { xs: 'auto', md: 0 },
                }}
              >
                <TextField
                  name="search"
                  value={searchParams.search}
                  onChange={handleInputChange}
                  placeholder="What are you looking for?"
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color={theme.palette.mode === 'dark' ? 'primary' : 'inherit'} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    flexGrow: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.background.default, 0.6)
                        : alpha('#F8FAFC', 0.8),
                    },
                  }}
                />
                <FormControl 
                  sx={{ 
                    minWidth: { xs: '100%', sm: 200 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.background.default, 0.6)
                        : alpha('#F8FAFC', 0.8),
                    },
                  }}
                >
                  <InputLabel id="category-label">Category</InputLabel>
                  <Select
                    labelId="category-label"
                    id="category-select"
                    name="category"
                    value={searchParams.category}
                    onChange={handleInputChange}
                    label="Category"
                    sx={{
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }
                    }}
                    renderValue={(selected) => {
                      if (!selected) {
                        return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7 }}>
                          <CategoryIcon fontSize="small" />
                          <span>All Categories</span>
                        </Box>;
                      }
                      
                      try {
                        const selectedCategory = categories.find(cat => 
                          (cat.id || cat.name) === selected
                        );
                        
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {renderCategoryIcon(selectedCategory?.name || '', { size: 20, useColor: true })}
                            <span>{selectedCategory?.name || selected}</span>
                          </Box>
                        );
                      } catch (error) {
                        console.error('Error rendering selected category icon:', error);
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon fontSize="small" />
                            <span>{selected}</span>
                          </Box>
                        );
                      }
                    }}
                  >
                    <MenuItem value="">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryIcon fontSize="small" />
                        <span>All Categories</span>
                      </Box>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem 
                        key={category.id || category.name} 
                        value={category.id || category.name}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {renderCategoryIcon(category.name, { size: 20, useColor: true })}
                        <span>{category.name}</span>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  color="secondary"
                  sx={{ 
                    px: 4,
                    height: 56,
                    fontWeight: 'bold',
                    flexShrink: 0,
                    borderRadius: '12px',
                    background: 'linear-gradient(45deg, #EC4899 30%, #F472B6 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #DB2777 30%, #EC4899 90%)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Search
                </Button>
              </Paper>
              
              {/* Stats */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 2, sm: 4 }}
                sx={{ 
                  mt: 5, 
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  alignItems: 'center'
                }}
              >
                {[
                  { label: "Students", value: "5,000+" },
                  { label: "Universities", value: "200+" },
                  { label: "Listings", value: "10,000+" }
                ].map((stat, index) => (
                  <Box key={index} sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>{stat.value}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>{stat.label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>
            
            <Grid 
              item 
              xs={12} 
              md={6} 
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center' 
              }}
            >
              <Box 
                sx={{ 
                  position: 'relative',
                  width: '100%',
                  height: '400px',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '0%',
                    left: '0%',
                    width: '80%',
                    height: '80%',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '30px',
                    transform: 'rotate(-5deg)',
                    boxShadow: '0 30px 40px rgba(0,0,0,0.1)',
                    zIndex: 1,
                  }
                }}
              >
                <Box 
                  component="img"
                  src="/hero-illustration.svg" 
                  alt="Student Marketplace"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    maxWidth: '500px',
                    filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))',
                    zIndex: 2,
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
        
        {/* Wave Divider */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -2,
            left: 0,
            width: '100%',
            overflow: 'hidden',
            lineHeight: 0,
            zIndex: 3,
            transform: 'rotate(180deg)',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            style={{ 
              position: 'relative', 
              display: 'block', 
              width: 'calc(133% + 1.3px)', 
              height: 80,
            }}
            fill={theme.palette.background.default}
          >
            <path
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              opacity=".25"
            />
            <path
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
              opacity=".5"
            />
            <path
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            />
          </svg>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: -6, md: -8 }, position: 'relative', zIndex: 4 }}>
        {/* Features Section - Redesigned */}
        {!user && (
          <Grid container spacing={4} sx={{ mb: 8 }}>
            {[
              {
                icon: <SchoolIcon sx={{ fontSize: 40 }} />,
                title: 'Campus Community',
                description: 'Connect with students from your university community to buy, sell, and trade items.',
                color: '#2563EB',
                gradient: 'linear-gradient(135deg, #2563EB, #60A5FA)'
              },
              {
                icon: <OfferIcon sx={{ fontSize: 40 }} />,
                title: 'Make Offers',
                description: 'Negotiate prices and make offers directly to sellers for the best deals.',
                color: '#EC4899',
                gradient: 'linear-gradient(135deg, #DB2777, #F472B6)'
              },
              {
                icon: <SecurityIcon sx={{ fontSize: 40 }} />,
                title: 'Secure Transactions',
                description: 'Our platform ensures safe and secure interactions between buyers and sellers.',
                color: '#10B981',
                gradient: 'linear-gradient(135deg, #059669, #34D399)'
              },
              {
                icon: <SupportIcon sx={{ fontSize: 40 }} />,
                title: 'Community Support',
                description: 'Get help anytime with our dedicated support team and helpful resources.',
                color: '#F59E0B',
                gradient: 'linear-gradient(135deg, #D97706, #FBBF24)'
              }
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    height: '100%',
                    background: theme.palette.mode === 'dark' 
                      ? alpha(feature.color, 0.1)
                      : 'white',
                    border: theme.palette.mode === 'dark' 
                      ? `1px solid ${alpha(feature.color, 0.3)}`
                      : `1px solid ${alpha(feature.color, 0.1)}`,
                    transition: 'all 0.3s',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 15px 30px ${alpha(feature.color, 0.2)}`,
                      borderColor: alpha(feature.color, 0.5),
                    },
                    position: 'relative'
                  }}
                >
                  <CardContent sx={{ 
                    p: 4, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start', 
                    height: '100%'
                  }}>
                    <Box
                      sx={{
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 70,
                        height: 70,
                        borderRadius: '20px',
                        background: feature.gradient,
                        color: 'white',
                        boxShadow: `0 10px 20px ${alpha(feature.color, 0.3)}`,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'rotate(5deg) scale(1.05)',
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
                        }
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 700,
                        color: theme.palette.mode === 'dark' ? 'white' : feature.color
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 2, flexGrow: 1 }}
                    >
                      {feature.description}
                    </Typography>
                    <Button 
                      color="inherit"
                      size="small"
                      endIcon={<ArrowRightIcon />}
                      sx={{ 
                        mt: 'auto', 
                        fontWeight: 600, 
                        color: feature.color,
                        '&:hover': {
                          backgroundColor: alpha(feature.color, 0.08),
                        }
                      }}
                      onClick={() => navigate('/help-center')}
                    >
                      Learn more
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Categories Showcase - Enhanced as Slider */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                fontWeight: 700,
              }}
            >
              Explore Categories
            </Typography>
            
            <Button 
              variant="outlined"
              color="primary"
              endIcon={<ArrowRightIcon />}
              onClick={() => navigate('/search')}
              sx={{
                borderRadius: '10px',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              View All
            </Button>
          </Box>
          
          {/* Category Slider */}
          <Box sx={{ position: 'relative', overflow: 'hidden', px: 1 }}>
            <Box
              sx={{
                display: 'flex',
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none',  /* IE and Edge */
                scrollbarWidth: 'none',  /* Firefox */
                '&::-webkit-scrollbar': { display: 'none' }, /* Chrome, Safari, Opera */
                gap: 2,
                py: 1,
                px: 0.5,
                '-webkit-overflow-scrolling': 'touch',
              }}
              className="category-slider"
            >
              {categories.map((category, index) => (
                <Box
                  key={index}
                  sx={{
                    minWidth: { xs: '140px', sm: '160px' },
                    flexShrink: 0,
                  }}
                >
                  <Card
                    onClick={() => {
                      navigate(`/search?category=${category.id || category.name}`);
                    }}
                    sx={{
                      borderRadius: 3,
                      height: '100%',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        borderColor: getCategoryColor(category.name),
                      },
                      background: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.background.paper, 0.6)
                        : 'white',
                      border: theme.palette.mode === 'dark'
                        ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        : `1px solid ${alpha('#e0e0e0', 0.8)}`,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box 
                        sx={{ 
                          mb: 1.5,
                          height: 50,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Box 
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alpha(getCategoryColor(category.name), 0.15),
                            color: getCategoryColor(category.name),
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.1) rotate(5deg)',
                            }
                          }}
                        >
                          {renderCategoryIcon(category.name, { size: 24 })}
                        </Box>
                      </Box>
                      <Typography 
                        variant="body2" 
                        fontWeight="600"
                        sx={{ mb: 0.5 }}
                      >
                        {category.name}
                      </Typography>
                      {/* Display item count if available */}
                      {category.item_count && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          {category.item_count} listings
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
            
            {/* Navigation Arrows */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                transform: 'translateY(-50%)',
                zIndex: 2,
                display: { xs: 'none', md: 'block' }
              }}
            >
              <Button
                onClick={() => {
                  const slider = document.querySelector('.category-slider');
                  if (slider) {
                    slider.scrollBy({ left: -200, behavior: 'smooth' });
                  }
                }}
                sx={{
                  minWidth: '40px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <ArrowRightIcon sx={{ transform: 'rotate(180deg)' }} />
              </Button>
            </Box>
            
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                right: 0,
                transform: 'translateY(-50%)',
                zIndex: 2,
                display: { xs: 'none', md: 'block' }
              }}
            >
              <Button
                onClick={() => {
                  const slider = document.querySelector('.category-slider');
                  if (slider) {
                    slider.scrollBy({ left: 200, behavior: 'smooth' });
                  }
                }}
                sx={{
                  minWidth: '40px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <ArrowRightIcon />
              </Button>
            </Box>
          </Box>
        </Box>
        
        {/* Featured Listings Section */}
        <Box 
          component={Paper} 
          elevation={0}
          sx={{ 
            p: { xs: 3, md: 4 }, 
            borderRadius: 4,
            mb: 6,
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${alpha('#1E3A8A', 0.2)} 0%, ${alpha('#1E3A8A', 0.05)} 100%)` 
              : `linear-gradient(135deg, ${alpha('#EFF6FF', 0.9)} 0%, ${alpha('#DBEAFE', 0.7)} 100%)`,
            border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#60A5FA', 0.2) : alpha('#60A5FA', 0.3)}`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 40px -10px rgba(0,0,0,0.3)' 
              : '0 10px 40px -10px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 15px 60px -10px rgba(0,0,0,0.35)' 
                : '0 15px 60px -10px rgba(0,0,0,0.15)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '250px',
              height: '250px',
              backgroundImage: 'radial-gradient(circle, rgba(96, 165, 250, 0.25) 0%, rgba(96, 165, 250, 0) 70%)',
              zIndex: 0,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -50,
              left: -50,
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: alpha(theme.palette.primary.main, 0.07),
              zIndex: 0,
            },
            '& .MuiTypography-h4': {
              color: theme.palette.mode === 'dark' ? '#93C5FD' : '#1E40AF',
              fontWeight: 700,
            },
            backdropFilter: 'blur(10px)',
          }}
        >
          <FeaturedListings {...featuredListingsProps} />
        </Box>
        
        {/* Latest Additions Section - Redesigned */}
        <Box 
          component={Paper} 
          elevation={0}
          sx={{ 
            p: { xs: 3, md: 4 }, 
            borderRadius: 4,
            mb: 6,
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${alpha('#047857', 0.2)} 0%, ${alpha('#047857', 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha('#ECFDF5', 0.9)} 0%, ${alpha('#D1FAE5', 0.7)} 100%)`,
            border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#10B981', 0.2) : alpha('#10B981', 0.3)}`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 10px 40px -10px rgba(0,0,0,0.3)' 
              : '0 10px 40px -10px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 15px 60px -10px rgba(0,0,0,0.35)' 
                : '0 15px 60px -10px rgba(0,0,0,0.15)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '250px',
              height: '250px',
              backgroundImage: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
              zIndex: 0,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: alpha('#10B981', 0.07),
              zIndex: 0,
            },
            '& .MuiTypography-h4': {
              color: theme.palette.mode === 'dark' ? '#6EE7B7' : '#047857',
              fontWeight: 700,
            },
            backdropFilter: 'blur(10px)',
          }}
        >
          <FeaturedListings {...newListingsProps} />
        </Box>
        
        {/* Call to Action */}
        <Box 
          sx={{ 
            py: 6, 
            px: { xs: 3, md: 8 }, 
            mb: 8, 
            borderRadius: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 15px 30px rgba(219, 39, 119, 0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'url(/pattern-dots.svg)',
              backgroundSize: '20px 20px',
              opacity: 0.1,
              zIndex: 1,
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              color="white" 
              gutterBottom
              sx={{ 
                fontWeight: 800,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                mb: 2,
              }}
            >
              Ready to sell your items?
            </Typography>
            <Typography 
              variant="h6" 
              color="white" 
              sx={{ 
                mb: 4, 
                opacity: 0.9,
                maxWidth: '700px',
                mx: 'auto',
                fontWeight: 400,
              }}
            >
              Create your listing in minutes and reach thousands of students on your campus
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/create-listing')}
              sx={{
                backgroundColor: 'white',
                color: '#DB2777',
                fontSize: '1.1rem',
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'white',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                },
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              }}
            >
              Create a Listing
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;