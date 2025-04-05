import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Chip,
  useTheme,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  PeopleAlt as UserIcon,
  ShoppingBag as ListingIcon,
  LocalOffer as OfferIcon,
  Report as ReportIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Category as CategoryIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  Assessment as ReportPageIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Star as FeaturedIcon
} from '@mui/icons-material';
import { supabase, getUserGrowthData } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme.palette.mode === 'dark';
  const channelsRef = useRef([]);
  const debounceTimerRef = useRef(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [userGrowthPeriod, setUserGrowthPeriod] = useState('monthly');
  
  const [stats, setStats] = useState({
    totalUsers: { value: 0, trend: 'up', percentage: 15 },
    totalListings: { value: 0, trend: 'up', percentage: 8 },
    activeListings: { value: 0, trend: 'neutral', percentage: 0 },
    totalOffers: { value: 0, trend: 'down', percentage: 5 },
    pendingOffers: { value: 0, trend: 'neutral', percentage: 0 },
    recentReviews: [],
    topCategories: [],
    totalReports: { value: 0, trend: 'up', percentage: 12 },
    loading: true,
    activityData: [],
    listingsByDay: [],
    userGrowthData: []
  });

  // Debounced fetch function to prevent multiple simultaneous refreshes
  const debouncedFetchData = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      fetchDashboardData();
      debounceTimerRef.current = null;
    }, 1000); // Wait 1 second before refreshing
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time listeners for dashboard data updates
    const setupRealtimeListeners = () => {
      // Clean up any existing channels
      if (channelsRef.current.length > 0) {
        channelsRef.current.forEach(channel => {
          if (channel && channel.unsubscribe) channel.unsubscribe();
        });
        channelsRef.current = [];
      }
      
      // Listen for changes in users table
      const usersChannel = supabase
        .channel('admin-dashboard-users')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'users' }, 
          () => {
            console.log('Users table updated, queuing dashboard refresh');
            debouncedFetchData();
          }
        )
        .subscribe();
      
      // Listen for changes in listings table
      const listingsChannel = supabase
        .channel('admin-dashboard-listings')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'listings' }, 
          () => {
            console.log('Listings table updated, queuing dashboard refresh');
            debouncedFetchData();
          }
        )
        .subscribe();
      
      // Listen for changes in offers table
      const offersChannel = supabase
        .channel('admin-dashboard-offers')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'offers' }, 
          () => {
            console.log('Offers table updated, queuing dashboard refresh');
            debouncedFetchData();
          }
        )
        .subscribe();
      
      // Listen for changes in reports table
      const reportsChannel = supabase
        .channel('admin-dashboard-reports')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'reports' }, 
          () => {
            console.log('Reports table updated, queuing dashboard refresh');
            debouncedFetchData();
          }
        )
        .subscribe();
      
      // Listen for changes in reviews table
      const reviewsChannel = supabase
        .channel('admin-dashboard-reviews')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'reviews' }, 
          () => {
            console.log('Reviews table updated, queuing dashboard refresh');
            debouncedFetchData();
          }
        )
        .subscribe();
      
      // Store channels for cleanup
      channelsRef.current = [
        usersChannel,
        listingsChannel,
        offersChannel,
        reportsChannel,
        reviewsChannel
      ];
    };
    
    setupRealtimeListeners();
    
    // Clean up subscriptions when component unmounts
    return () => {
      if (channelsRef.current.length > 0) {
        channelsRef.current.forEach(channel => {
          if (channel && channel.unsubscribe) channel.unsubscribe();
        });
      }
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get current date for calculating trends
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const lastWeekIso = lastWeek.toISOString();
      const twoWeeksAgoIso = twoWeeksAgo.toISOString();

      // Get total users and new users for trend with proper error handling
      let totalUsers = [];
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, created_at');
        
        if (usersError) {
          console.warn('Error fetching users:', usersError.message);
        } else {
          totalUsers = usersData || [];
        }
      } catch (error) {
        console.warn('Exception when fetching users:', error.message);
      }
      
      const newUsersLastWeek = totalUsers.filter(user => 
        new Date(user.created_at) >= new Date(lastWeekIso)
      ).length;
      
      const newUsersPrevWeek = totalUsers.filter(user => 
        new Date(user.created_at) >= new Date(twoWeeksAgoIso) && 
        new Date(user.created_at) < new Date(lastWeekIso)
      ).length;
      
      const userTrend = newUsersLastWeek > newUsersPrevWeek ? 'up' : 
                        newUsersLastWeek < newUsersPrevWeek ? 'down' : 'neutral';
      
      const userPercentage = newUsersPrevWeek === 0 ? 0 :
                            Math.round(((newUsersLastWeek - newUsersPrevWeek) / newUsersPrevWeek) * 100);

      // Get all listings for counts and trends
      const { data: allListings, error: listingsError } = await supabase
        .from('listings')
        .select('id, status, created_at, category_id');
      
      if (listingsError) throw listingsError;
      
      const activeListings = allListings.filter(listing => 
        listing.status === 'available'
      );
      
      const newListingsLastWeek = allListings.filter(listing => 
        new Date(listing.created_at) >= new Date(lastWeekIso)
      ).length;
      
      const newListingsPrevWeek = allListings.filter(listing => 
        new Date(listing.created_at) >= new Date(twoWeeksAgoIso) && 
        new Date(listing.created_at) < new Date(lastWeekIso)
      ).length;
      
      const listingTrend = newListingsLastWeek > newListingsPrevWeek ? 'up' : 
                          newListingsLastWeek < newListingsPrevWeek ? 'down' : 'neutral';
      
      const listingPercentage = newListingsPrevWeek === 0 ? 100 :
                              Math.round(((newListingsLastWeek - newListingsPrevWeek) / newListingsPrevWeek) * 100);

      // Count listings per category and find top categories
      const categoryCounts = {};
      allListings.forEach(listing => {
        const categoryId = listing.category_id;
        if (categoryId) {
          categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
        }
      });
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
      
      if (categoriesError) throw categoriesError;

      // Map category IDs to names and sort by count
      const topCategories = Object.entries(categoryCounts)
        .map(([id, count]) => ({
          id,
          name: categories.find(cat => cat.id === id)?.name || 'Unknown',
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get offers data for counts and trends
      let allOffers = [];
      let pendingOffers = [];
      
      try {
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select('id, status, created_at');
        
        if (offersError) {
          console.warn('Error fetching offers:', offersError.message);
        } else {
          allOffers = offersData || [];
          pendingOffers = allOffers.filter(offer => 
            offer.status === 'pending'
          );
        }
      } catch (error) {
        console.warn('Exception when fetching offers:', error.message);
      }
      
      const newOffersLastWeek = allOffers.filter(offer => 
        new Date(offer.created_at) >= new Date(lastWeekIso)
      ).length;
      
      const newOffersPrevWeek = allOffers.filter(offer => 
        new Date(offer.created_at) >= new Date(twoWeeksAgoIso) && 
        new Date(offer.created_at) < new Date(lastWeekIso)
      ).length;
      
      const offerTrend = newOffersLastWeek > newOffersPrevWeek ? 'up' : 
                        newOffersLastWeek < newOffersPrevWeek ? 'down' : 'neutral';
      
      const offerPercentage = newOffersPrevWeek === 0 ? 0 :
                            Math.round(((newOffersLastWeek - newOffersPrevWeek) / newOffersPrevWeek) * 100);

      // Get reports data
      let allReports = [];
      let pendingReports = [];
      
      try {
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('id, status, created_at, reason');
        
        if (reportsError) {
          console.warn('Error fetching reports:', reportsError.message);
          // Continue with empty reports array
        } else {
          allReports = reportsData || [];
          pendingReports = allReports.filter(report => 
            report.status === 'pending' || report.status === 'reviewing'
          );
        }
      } catch (error) {
        console.warn('Exception when fetching reports:', error.message);
      }
      
      const newReportsLastWeek = allReports.filter(report => 
        new Date(report.created_at) >= new Date(lastWeekIso)
      ).length;
      
      const newReportsPrevWeek = allReports.filter(report => 
        new Date(report.created_at) >= new Date(twoWeeksAgoIso) && 
        new Date(report.created_at) < new Date(lastWeekIso)
      ).length;
      
      const reportTrend = newReportsLastWeek > newReportsPrevWeek ? 'up' : 
                          newReportsLastWeek < newReportsPrevWeek ? 'down' : 'neutral';
      
      const reportPercentage = newReportsPrevWeek === 0 ? 0 :
                              Math.round(((newReportsLastWeek - newReportsPrevWeek) / newReportsPrevWeek) * 100);

      // Handle reviews data with fallback since the table doesn't exist yet
      let reviews = [];
      try {
        // First try to get reviews with user relationship
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id, 
            rating, 
            comment, 
            created_at,
            users:reviewer_id (name, profile_picture)
          `)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (reviewsError) {
          console.warn('Error fetching reviews with user relationship:', reviewsError);
          
          // If that fails, try to get just the reviews without the user relationship
          const { data: basicReviewsData, error: basicReviewsError } = await supabase
            .from('reviews')
            .select('id, rating, comment, created_at, reviewer_id')
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (basicReviewsError) {
            console.warn('Error fetching basic reviews:', basicReviewsError);
          } else {
            // Format reviews to maintain consistent structure
            reviews = basicReviewsData.map(review => ({
              ...review,
              users: { name: 'Unknown User', profile_picture: null }
            }));
          }
        } else {
          reviews = reviewsData || [];
        }
      } catch (error) {
        console.warn('Exception when fetching reviews:', error);
      }

      // Create listings by day chart data (for the past 14 days)
      const listingsByDay = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = allListings.filter(listing => 
          new Date(listing.created_at) >= date && 
          new Date(listing.created_at) < nextDate
        ).length;
        
        listingsByDay.push({
          date: format(date, 'MMM dd'),
          count
        });
      }

      // Create activity data combining various events
      const activityItems = [
        // New users
        ...totalUsers
          .filter(user => new Date(user.created_at) >= new Date(lastWeekIso))
          .map(user => ({
            type: 'user',
            label: 'New user registered',
            time: user.created_at,
            id: user.id
          })),
        
        // New listings
        ...allListings
          .filter(listing => new Date(listing.created_at) >= new Date(lastWeekIso))
          .map(listing => ({
            type: 'listing',
            label: 'New listing created',
            time: listing.created_at,
            id: listing.id
          })),
        
        // New offers
        ...allOffers
          .filter(offer => new Date(offer.created_at) >= new Date(lastWeekIso))
          .map(offer => ({
            type: 'offer',
            label: 'New offer submitted',
            time: offer.created_at,
            id: offer.id
          })),
          
        // New reports
        ...allReports
          .filter(report => new Date(report.created_at) >= new Date(lastWeekIso))
          .map(report => ({
            type: 'report',
            label: `New report: ${report.reason || 'Issue reported'}`,
            time: report.created_at,
            id: report.id
          })),
          
        // New reviews (if available)
        ...(reviews && reviews.length > 0 ? reviews
          .filter(review => new Date(review.created_at) >= new Date(lastWeekIso))
          .map(review => ({
            type: 'review',
            label: 'New review submitted',
            time: review.created_at,
            id: review.id
          })) : [])
      ];
      
      // Sort by time, most recent first
      activityItems.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      // Take only the 10 most recent items
      const recentActivity = activityItems.slice(0, 10);

      // Fetch user growth data
      const { data: userGrowthData, error: userGrowthError } = await getUserGrowthData(userGrowthPeriod);
      
      if (userGrowthError) {
        console.warn('Error fetching user growth data:', userGrowthError);
      }

      // Update stats state with all the data
      setStats({
        totalUsers: {
          value: totalUsers ? totalUsers.length : 0,
          trend: totalUsers && totalUsers.length > 0 ? userTrend : 'neutral',
          percentage: userPercentage
        },
        totalListings: {
          value: allListings ? allListings.length : 0,
          trend: listingTrend,
          percentage: listingPercentage
        },
        activeListings: {
          value: activeListings ? activeListings.length : 0,
          trend: 'neutral',
          percentage: 0
        },
        totalOffers: {
          value: allOffers ? allOffers.length : 0,
          trend: offerTrend,
          percentage: offerPercentage
        },
        pendingOffers: {
          value: pendingOffers ? pendingOffers.length : 0,
          trend: 'neutral',
          percentage: 0
        },
        recentReviews: reviews || [],
        topCategories: topCategories || [],
        totalReports: {
          value: allReports ? allReports.length : 0,
          trend: reportTrend,
          percentage: reportPercentage
        },
        loading: false,
        activityData: recentActivity,
        listingsByDay: listingsByDay || [],
        userGrowthData: userGrowthData || []
      });
      
      // Update the last refreshed timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats(prevStats => ({ ...prevStats, loading: false }));
    }
  };

  // Handle period change for user growth chart
  const handleUserGrowthPeriodChange = (event, newPeriod) => {
    if (newPeriod) {
      setUserGrowthPeriod(newPeriod);
      
      // Refetch growth data with new period
      const fetchUserGrowthData = async () => {
        setStats(prev => ({ ...prev, loading: true }));
        const { data, error } = await getUserGrowthData(newPeriod);
        if (error) {
          console.error('Error fetching user growth data:', error);
        } else {
          setStats(prev => ({ 
            ...prev, 
            userGrowthData: data || [], 
            loading: false 
          }));
        }
      };
      
      fetchUserGrowthData();
    }
  };

  const getTrendIcon = (trend, percentage) => {
    switch (trend) {
      case 'up':
        return (
          <Chip
            icon={<TrendingUpIcon />}
            label={`+${percentage}%`}
            size="small"
            color="success"
            variant="outlined"
            sx={{ ml: 1, fontWeight: 'bold' }}
          />
        );
      case 'down':
        return (
          <Chip
            icon={<TrendingDownIcon />}
            label={`${percentage}%`}
            size="small"
            color="error"
            variant="outlined"
            sx={{ ml: 1, fontWeight: 'bold' }}
          />
        );
      default:
        return (
          <Chip
            icon={<TrendingFlatIcon />}
            label="0%"
            size="small"
            color="default"
            variant="outlined"
            sx={{ ml: 1, fontWeight: 'bold' }}
          />
        );
    }
  };

  const StatCard = ({ title, value, icon, color, trend, percentage, onClick }) => {
    const cardBg = isDarkMode 
      ? theme.palette.background.paper 
      : theme.palette.background.default;
      
    const iconBg = isDarkMode 
      ? theme.palette.action.hover
      : `${color}.light`;
      
    return (
      <Card 
        sx={{ 
          height: '100%',
          boxShadow: theme.shadows[3],
          transition: 'transform 0.3s, box-shadow 0.3s',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[6],
          } : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ 
          p: 3,
          '&:last-child': { pb: 3 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" color="text.secondary" fontWeight="medium">
              {title}
            </Typography>
            <Avatar
              sx={{
                bgcolor: `${color}.light`,
                color: `${color}.main`,
                width: 36,
                height: 36,
              }}
            >
              {icon}
            </Avatar>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h4" component="div" fontWeight="bold">
              {stats.loading ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  <CircularProgress size={20} thickness={5} sx={{ mr: 1 }} />
                  Loading...
                </Box>
              ) : (
                typeof value === 'number' ? value.toLocaleString() : '0'
              )}
            </Typography>
            {!stats.loading && trend && (
              getTrendIcon(trend, percentage || 0)
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }} component="div">
            Compared to previous period
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Admin Dashboard
        </Typography>
        
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'right' }}>
            Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            sx={{ mr: 2 }}
          >
            Refresh Data
          </Button>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/admin/settings')}
            color="primary"
          >
            System Settings
          </Button>
        </Box>
      </Box>

      {/* Key Stats */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.value}
            icon={<UserIcon />}
            color="primary"
            trend={stats.totalUsers.trend}
            percentage={stats.totalUsers.percentage}
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Listings"
            value={stats.activeListings.value}
            icon={<ListingIcon />}
            color="success"
            trend={stats.totalListings.trend}
            percentage={stats.totalListings.percentage}
            onClick={() => navigate('/admin/listings')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Offers"
            value={stats.pendingOffers.value}
            icon={<OfferIcon />}
            color="warning"
            trend={stats.totalOffers.trend}
            percentage={stats.totalOffers.percentage}
            onClick={() => navigate('/admin/offers')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Reports"
            value={stats.totalReports.value}
            icon={<ReportIcon />}
            color="error"
            trend={stats.totalReports.trend}
            percentage={stats.totalReports.percentage}
            onClick={() => navigate('/admin/reports')}
          />
        </Grid>
      </Grid>

      {/* Charts and Lists */}
      <Grid container spacing={3}>
        {/* Listings Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Listings Activity (Last 14 Days)
            </Typography>
            <Box sx={{ height: 400, mt: 2 }}>
              {stats.loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.listingsByDay}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#eee'} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: theme.palette.text.secondary }}
                      tickLine={{ stroke: theme.palette.divider }}
                      axisLine={{ stroke: theme.palette.divider }}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fill: theme.palette.text.secondary }}
                      tickLine={{ stroke: theme.palette.divider }}
                      axisLine={{ stroke: theme.palette.divider }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
                        boxShadow: theme.shadows[3]
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke={theme.palette.primary.main} 
                      strokeWidth={2}
                      dot={{ 
                        stroke: theme.palette.primary.main, 
                        fill: theme.palette.primary.main,
                        r: 4 
                      }}
                      activeDot={{ 
                        stroke: theme.palette.background.paper,
                        strokeWidth: 2,
                        fill: theme.palette.primary.main,
                        r: 6 
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

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
            
            <Box sx={{ height: 400, mt: 2 }}>
              {stats.loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : stats.userGrowthData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    No user growth data available
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.userGrowthData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#eee'} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: theme.palette.text.secondary }}
                      tickLine={{ stroke: theme.palette.divider }}
                      axisLine={{ stroke: theme.palette.divider }}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fill: theme.palette.text.secondary }}
                      tickLine={{ stroke: theme.palette.divider }}
                      axisLine={{ stroke: theme.palette.divider }}
                      yAxisId="left"
                    />
                    <YAxis 
                      allowDecimals={false}
                      orientation="right"
                      tick={{ fill: theme.palette.text.secondary }}
                      tickLine={{ stroke: theme.palette.divider }}
                      axisLine={{ stroke: theme.palette.divider }}
                      yAxisId="right"
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
                        boxShadow: theme.shadows[3]
                      }}
                      formatter={(value) => [`${value}`, '']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="newUsers" 
                      stroke={theme.palette.primary.main} 
                      strokeWidth={2}
                      name="New Users"
                      dot={{ 
                        stroke: theme.palette.primary.main, 
                        fill: theme.palette.primary.main,
                        r: 4 
                      }}
                      activeDot={{ 
                        stroke: theme.palette.background.paper,
                        strokeWidth: 2,
                        fill: theme.palette.primary.main,
                        r: 6 
                      }}
                      yAxisId="left"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalUsers" 
                      stroke={theme.palette.success.main} 
                      strokeWidth={2}
                      name="Total Users"
                      dot={{ 
                        stroke: theme.palette.success.main, 
                        fill: theme.palette.success.main,
                        r: 4 
                      }}
                      activeDot={{ 
                        stroke: theme.palette.background.paper,
                        strokeWidth: 2,
                        fill: theme.palette.success.main,
                        r: 6 
                      }}
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={12}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Recent Activity
            </Typography>
            
            {stats.loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <CircularProgress />
              </Box>
            ) : stats.activityData.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <Typography variant="body2" color="text.secondary">
                  No recent activity
                </Typography>
              </Box>
            ) : (
              <List sx={{ px: 0 }}>
                {stats.activityData.map((activity, index) => {
                  let icon;
                  let color;
                  
                  switch (activity.type) {
                    case 'user':
                      icon = <UserIcon />;
                      color = 'primary';
                      break;
                    case 'listing':
                      icon = <ListingIcon />;
                      color = 'success';
                      break;
                    case 'offer':
                      icon = <OfferIcon />;
                      color = 'warning';
                      break;
                    case 'review':
                      icon = <MessageIcon />;
                      color = 'info';
                      break;
                    case 'report':
                      icon = <ReportIcon />;
                      color = 'error';
                      break;
                    default:
                      icon = <MessageIcon />;
                      color = 'info';
                  }
                  
                  return (
                    <React.Fragment key={`${activity.type}-${activity.id}`}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>
                            {icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.label}
                          secondary={format(new Date(activity.time), 'MMM d, yyyy h:mm a')}
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                        />
                      </ListItem>
                      {index < stats.activityData.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Three-column layout for additional info */}
        <Grid container item spacing={3} xs={12}>
          {/* Top Categories */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Top Categories
              </Typography>
              
              {stats.loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <CircularProgress />
                </Box>
              ) : stats.topCategories.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <Typography variant="body2" color="text.secondary">
                    No category data available
                  </Typography>
                </Box>
              ) : (
                <List sx={{ px: 0 }}>
                  {stats.topCategories.map((category, index) => (
                    <React.Fragment key={category.id}>
                      <ListItem alignItems="center" sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${theme.palette.primary.light}20` }}>
                            <CategoryIcon color="primary" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={category.name}
                          secondary={`${category.count} listings`}
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                        />
                        <Chip 
                          label={`${Math.round((category.count / stats.totalListings.value) * 100)}%`} 
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </ListItem>
                      {index < stats.topCategories.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Recent Reviews */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Recent Reviews
              </Typography>
              
              {stats.loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <CircularProgress />
                </Box>
              ) : stats.recentReviews.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <Typography variant="body2" color="text.secondary">
                    No reviews available
                  </Typography>
                </Box>
              ) : (
                <List sx={{ px: 0 }}>
                  {stats.recentReviews.map((review, index) => (
                    <React.Fragment key={review.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar 
                            src={review.users?.profile_picture} 
                            alt={review.users?.name}
                          >
                            {review.users?.name?.charAt(0) || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {review.users?.name || 'Anonymous'}
                              </Typography>
                              <Chip 
                                label={`${review.rating}/5`} 
                                size="small" 
                                color={review.rating >= 4 ? 'success' : (review.rating >= 3 ? 'warning' : 'error')} 
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" component="span" color="text.primary">
                                {review.comment?.length > 60 
                                  ? `${review.comment.substring(0, 60)}...` 
                                  : review.comment}
                              </Typography>
                              <Typography variant="caption" component="div" color="text.secondary">
                                {format(new Date(review.created_at), 'MMM d, yyyy')}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < stats.recentReviews.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', boxShadow: theme.shadows[3], borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Quick Actions
              </Typography>
              
              <List>
                <ListItem 
                  button 
                  onClick={() => navigate('/admin/users')}
                  sx={{ borderRadius: 1, mb: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                      <UserIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Manage Users" 
                    secondary="View and edit user accounts"
                  />
                  <ArrowForwardIcon color="action" />
                </ListItem>
                
                <ListItem 
                  button 
                  onClick={() => navigate('/admin/listings')}
                  sx={{ borderRadius: 1, mb: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.success.light }}>
                      <ListingIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Manage Listings" 
                    secondary="View and moderate marketplace listings"
                  />
                  <ArrowForwardIcon color="action" />
                </ListItem>
                
                <ListItem 
                  button 
                  onClick={() => navigate('/admin/messages')}
                  sx={{ borderRadius: 1, mb: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.info.light }}>
                      <EmailIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Contact Messages" 
                    secondary="View and respond to user contact form submissions"
                  />
                  <ArrowForwardIcon color="action" />
                </ListItem>
                
                <ListItem 
                  button 
                  onClick={() => navigate('/admin/reports')}
                  sx={{ borderRadius: 1, mb: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.error.light }}>
                      <ReportIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Handle Reports" 
                    secondary="Review and resolve user reports"
                  />
                  <ArrowForwardIcon color="action" />
                </ListItem>
                
                <ListItem 
                  button 
                  onClick={() => navigate('/admin/promotion-approvals')}
                  sx={{ borderRadius: 1, mb: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.secondary.light }}>
                      <FeaturedIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Promotion Approvals" 
                    secondary="Manage listing promotion requests"
                  />
                  <ArrowForwardIcon color="action" />
                </ListItem>
                
                <ListItem 
                  button 
                  onClick={() => navigate('/admin/storage-diagnostics')}
                  sx={{ borderRadius: 1, mb: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.warning.light }}>
                      <SettingsIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Storage Diagnostics" 
                    secondary="Check storage buckets and diagnose attachment issues"
                  />
                  <ArrowForwardIcon color="action" />
                </ListItem>
                
                <ListItem 
                  button 
                  onClick={() => navigate('/admin/analytics')}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.info.light }}>
                      <ReportPageIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Analytics" 
                    secondary="View detailed marketplace statistics"
                  />
                  <ArrowForwardIcon color="action" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard; 