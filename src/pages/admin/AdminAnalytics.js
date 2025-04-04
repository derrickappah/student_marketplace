import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  ListAlt as ListIcon,
  People as PeopleIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { supabase, getUserGrowthData } from '../../services/supabase';
import { getMarketplaceTrendAnalytics } from '../../services/advanced-analytics';
import { useNavigate } from 'react-router-dom';
import { format, subDays, subMonths } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const AdminAnalytics = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [userGrowthPeriod, setUserGrowthPeriod] = useState('monthly');
  
  // Analytics data states
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [listingsByCategory, setListingsByCategory] = useState([]);
  const [listingsByStatus, setListingsByStatus] = useState([]);
  const [activitiesOverTime, setActivitiesOverTime] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [listingViewsData, setListingViewsData] = useState([]);
  const [topSellerData, setTopSellerData] = useState([]);
  
  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    '#9c27b0',
    '#795548'
  ];
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);
  
  const handleUserGrowthPeriodChange = (event, newPeriod) => {
    if (newPeriod) {
      setUserGrowthPeriod(newPeriod);
      fetchUserGrowthData(newPeriod);
    }
  };
  
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  const fetchAnalyticsData = async () => {
    setLoading(true);
    
    try {
      // Fetch user growth data
      await fetchUserGrowthData(userGrowthPeriod);
      
      // Fetch listings by category
      await fetchListingsByCategory();
      
      // Fetch listings by status
      await fetchListingsByStatus();
      
      // Fetch category distribution
      await fetchCategoryDistribution();
      
      // Fetch activity over time
      await fetchActivityOverTime();
      
      // Fetch listing views
      await fetchListingViewsData();
      
      // Fetch top sellers
      await fetchTopSellers();
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserGrowthData = async (period) => {
    try {
      const { data, error } = await getUserGrowthData(period);
      
      if (error) throw error;
      
      setUserGrowthData(data || []);
    } catch (error) {
      console.error('Error fetching user growth data:', error);
    }
  };
  
  const fetchListingsByCategory = async () => {
    try {
      // Fetch all listings with their categories
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, category_id, created_at');
      
      if (listingsError) throw listingsError;
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
      
      if (categoriesError) throw categoriesError;
      
      // Calculate counts by category
      const categoryCounts = {};
      
      listings.forEach(listing => {
        if (listing.category_id) {
          categoryCounts[listing.category_id] = (categoryCounts[listing.category_id] || 0) + 1;
        }
      });
      
      // Format data for chart
      const formattedData = categories.map(category => ({
        name: category.name,
        value: categoryCounts[category.id] || 0,
        id: category.id
      })).sort((a, b) => b.value - a.value);
      
      setListingsByCategory(formattedData);
    } catch (error) {
      console.error('Error fetching listings by category:', error);
    }
  };
  
  const fetchListingsByStatus = async () => {
    try {
      // Fetch all listings with status
      const { data: listings, error } = await supabase
        .from('listings')
        .select('id, status');
      
      if (error) throw error;
      
      // Calculate counts by status
      const statusCounts = {};
      
      listings.forEach(listing => {
        if (listing.status) {
          statusCounts[listing.status] = (statusCounts[listing.status] || 0) + 1;
        }
      });
      
      // Format data for chart
      const formattedData = Object.keys(statusCounts).map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: statusCounts[status]
      }));
      
      setListingsByStatus(formattedData);
    } catch (error) {
      console.error('Error fetching listings by status:', error);
    }
  };
  
  const fetchCategoryDistribution = async () => {
    try {
      // This is similar to fetchListingsByCategory but formatted differently
      // for a different chart type
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, category_id, created_at');
      
      if (listingsError) throw listingsError;
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
      
      if (categoriesError) throw categoriesError;
      
      // Calculate counts by category
      const categoryCounts = {};
      
      listings.forEach(listing => {
        if (listing.category_id) {
          categoryCounts[listing.category_id] = (categoryCounts[listing.category_id] || 0) + 1;
        }
      });
      
      // Format data for chart
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.id] = cat.name;
      });
      
      const formattedData = Object.entries(categoryCounts)
        .map(([id, count]) => ({
          name: categoryMap[id] || 'Unknown',
          value: count
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 categories
      
      setCategoryDistribution(formattedData);
    } catch (error) {
      console.error('Error fetching category distribution:', error);
    }
  };
  
  const fetchActivityOverTime = async () => {
    try {
      // Get dates for the time range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      // Fetch listings, offers, and messages for the time period
      const startDate = subDays(new Date(), days).toISOString();
      
      const [listingsResult, offersResult, messagesResult] = await Promise.all([
        supabase
          .from('listings')
          .select('created_at')
          .gte('created_at', startDate),
        supabase
          .from('offers')
          .select('created_at')
          .gte('created_at', startDate),
        supabase
          .from('messages')
          .select('created_at')
          .gte('created_at', startDate)
      ]);
      
      if (listingsResult.error) throw listingsResult.error;
      if (offersResult.error) throw offersResult.error;
      if (messagesResult.error) throw messagesResult.error;
      
      // Group by date
      const activityByDate = {};
      
      // Initialize dates
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        activityByDate[dateStr] = {
          date: format(date, 'MMM dd'),
          listings: 0,
          offers: 0,
          messages: 0
        };
      }
      
      // Count listings by date
      (listingsResult.data || []).forEach(listing => {
        const dateStr = format(new Date(listing.created_at), 'yyyy-MM-dd');
        if (activityByDate[dateStr]) {
          activityByDate[dateStr].listings++;
        }
      });
      
      // Count offers by date
      (offersResult.data || []).forEach(offer => {
        const dateStr = format(new Date(offer.created_at), 'yyyy-MM-dd');
        if (activityByDate[dateStr]) {
          activityByDate[dateStr].offers++;
        }
      });
      
      // Count messages by date
      (messagesResult.data || []).forEach(message => {
        const dateStr = format(new Date(message.created_at), 'yyyy-MM-dd');
        if (activityByDate[dateStr]) {
          activityByDate[dateStr].messages++;
        }
      });
      
      // Convert to array and sort by date
      const result = Object.values(activityByDate).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      setActivitiesOverTime(result);
    } catch (error) {
      console.error('Error fetching activity over time:', error);
    }
  };
  
  const fetchListingViewsData = async () => {
    try {
      // Fetch listing view data from viewed_listings table
      const { data, error } = await supabase
        .from('viewed_listings')
        .select('listing_id, created_at')
        .order('created_at', { ascending: false })
        .limit(500); // Get enough data for analysis
      
      if (error) throw error;
      
      // Group by day
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const viewsByDay = {};
      
      // Initialize days
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        viewsByDay[dateStr] = {
          date: format(date, 'MMM dd'),
          views: 0
        };
      }
      
      // Count views by day
      (data || []).forEach(view => {
        const dateStr = format(new Date(view.created_at), 'yyyy-MM-dd');
        if (viewsByDay[dateStr]) {
          viewsByDay[dateStr].views++;
        }
      });
      
      // Convert to array and sort by date
      const result = Object.values(viewsByDay).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      setListingViewsData(result);
    } catch (error) {
      console.error('Error fetching listing views data:', error);
    }
  };
  
  const fetchTopSellers = async () => {
    try {
      // Get completed listings with seller info
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          user_id,
          title,
          price,
          created_at,
          users:user_id (name, email)
        `)
        .eq('status', 'sold')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate sales by seller
      const salesBySeller = {};
      
      (data || []).forEach(listing => {
        const sellerId = listing.user_id;
        if (!salesBySeller[sellerId]) {
          salesBySeller[sellerId] = {
            id: sellerId,
            name: listing.users?.name || 'Unknown',
            email: listing.users?.email || '',
            totalSales: 0,
            totalValue: 0,
            listings: []
          };
        }
        
        salesBySeller[sellerId].totalSales++;
        salesBySeller[sellerId].totalValue += parseFloat(listing.price || 0);
        salesBySeller[sellerId].listings.push({
          id: listing.id,
          title: listing.title,
          price: listing.price,
          created_at: listing.created_at
        });
      });
      
      // Convert to array and sort by sales count
      const result = Object.values(salesBySeller)
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5); // Top 5 sellers
      
      setTopSellerData(result);
    } catch (error) {
      console.error('Error fetching top sellers:', error);
    }
  };
  
  // Render helpers
  const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only show label if the slice is big enough
    if (percent < 0.05) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#fff" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/admin')} sx={{ mr: 2 }} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Marketplace Analytics
          </Typography>
        </Box>
        <Box>
          <FormControl sx={{ minWidth: 150, mr: 2 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range-select"
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalyticsData}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* User Growth Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="medium">
                  User Growth Trends
                </Typography>
                
                <ToggleButtonGroup
                  value={userGrowthPeriod}
                  exclusive
                  onChange={handleUserGrowthPeriodChange}
                  size="small"
                  aria-label="time period"
                >
                  <ToggleButton value="daily" aria-label="daily">
                    Daily
                  </ToggleButton>
                  <ToggleButton value="weekly" aria-label="weekly">
                    Weekly
                  </ToggleButton>
                  <ToggleButton value="monthly" aria-label="monthly">
                    Monthly
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ height: 400 }}>
                {userGrowthData.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No user growth data available
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#eee'} />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="newUsers"
                        name="New Users"
                        stroke={theme.palette.primary.main}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="totalUsers"
                        name="Total Users"
                        stroke={theme.palette.success.main}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Activity Over Time Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Activity Over Time
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ height: 400 }}>
                {activitiesOverTime.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No activity data available
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activitiesOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#eee'} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="listings"
                        name="New Listings"
                        stackId="1"
                        stroke={theme.palette.primary.main}
                        fill={theme.palette.primary.main}
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="offers"
                        name="Offers"
                        stackId="1"
                        stroke={theme.palette.success.main}
                        fill={theme.palette.success.main}
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="messages"
                        name="Messages"
                        stackId="1"
                        stroke={theme.palette.info.main}
                        fill={theme.palette.info.main}
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Category Distribution Pie Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Category Distribution
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ height: 400 }}>
                {categoryDistribution.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No category data available
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomPieLabel}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value, name) => [`${value} listings`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Listing Views */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Listing Views Trend
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ height: 400 }}>
                {listingViewsData.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No listing views data available
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={listingViewsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#eee'} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        dataKey="views"
                        name="Listing Views"
                        fill={theme.palette.info.main}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Listings by Status */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Listings by Status
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ height: 300 }}>
                {listingsByStatus.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No listings status data available
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={listingsByStatus}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#eee'} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Listings"
                        fill={theme.palette.primary.main}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Top Sellers */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Top Sellers
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              {topSellerData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                  <Typography variant="body1" color="text.secondary">
                    No seller data available
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {topSellerData.map((seller, index) => (
                    <Card
                      key={seller.id}
                      sx={{ 
                        mb: 2, 
                        borderLeft: `5px solid ${COLORS[index % COLORS.length]}`,
                        boxShadow: theme.shadows[1]
                      }}
                    >
                      <CardContent>
                        <Grid container alignItems="center" spacing={2}>
                          <Grid item xs={1}>
                            <Typography variant="h6" fontWeight="bold" color={COLORS[index % COLORS.length]}>
                              #{index + 1}
                            </Typography>
                          </Grid>
                          <Grid item xs={7}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {seller.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {seller.email}
                            </Typography>
                          </Grid>
                          <Grid item xs={2} textAlign="center">
                            <Typography variant="h6" fontWeight="bold">
                              {seller.totalSales}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Sales
                            </Typography>
                          </Grid>
                          <Grid item xs={2} textAlign="center">
                            <Typography variant="h6" fontWeight="bold">
                              ${seller.totalValue.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total Value
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AdminAnalytics; 