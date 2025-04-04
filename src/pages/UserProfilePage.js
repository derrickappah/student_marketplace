import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  supabase, 
  getUserById, 
  getUserListings, 
  getUserRating,
  getUserActivity,
  getSellerStatistics
} from '../services/supabase';
import ListingCard from '../components/ListingCard';
import UserContactCard from '../components/UserContactCard';
import UserReviews from '../components/UserReviews';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StorefrontIcon from '@mui/icons-material/Storefront';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ReportIcon from '@mui/icons-material/Report';
import { formatDistanceToNow, format } from 'date-fns';

const UserProfilePage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        setProfileUser(userData);

        // Fetch user listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select(`
            *,
            users (
              id,
              name,
              university
            ),
            category:category_id (
              id,
              name
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (listingsError) throw listingsError;
        setUserListings(listingsData || []);

        // Fetch user rating
        const { rating, count, error: ratingError } = await getUserRating(userId);
        if (!ratingError) {
          setUserRating({ rating, count });
        }
        
        // Fetch seller statistics (NEW)
        const { data: sellerStats, error: statsError } = await getSellerStatistics(userId);
        
        if (!statsError && sellerStats) {
          // Update activity stats with realtime database information
          setActivityStats({
            totalListings: sellerStats.total_listings,
            activeListings: sellerStats.active_listings,
            soldItems: sellerStats.sold_listings,
            responseRate: sellerStats.response_rate,
            avgResponseTime: sellerStats.avg_response_time_hours > 0 
              ? `${sellerStats.avg_response_time_hours}h` 
              : '24h',
            offersReceived: sellerStats.total_offers_received,
            offersAccepted: sellerStats.offers_accepted,
            offersDeclined: sellerStats.offers_declined,
            joinDate: userData?.created_at,
            lastUpdated: sellerStats.last_updated
          });
        } else {
          // Fallback to calculating stats manually if error
          calculateManualStats(listingsData, userId);
        }
        
        // Generate activity timeline
        const timelineEvents = [];
        
        // Add user joined event
        if (userData?.created_at) {
          timelineEvents.push({
            date: userData.created_at,
            type: 'joined',
            title: 'Joined Campus Marketplace',
            icon: <CheckCircleIcon />,
            color: 'success.main'
          });
        }
        
        // Add first listing if available
        if (listingsData && listingsData.length > 0) {
          // Sort by created_at
          const sortedListings = [...listingsData].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          );
          
          // Add first listing
          timelineEvents.push({
            date: sortedListings[0].created_at,
            type: 'listing',
            title: 'Posted First Listing',
            description: sortedListings[0].title,
            icon: <StorefrontIcon />,
            color: 'primary.main'
          });
          
          // Add most recent listing if different from first
          if (sortedListings.length > 1) {
            const mostRecent = sortedListings[sortedListings.length - 1];
            timelineEvents.push({
              date: mostRecent.created_at,
              type: 'listing',
              title: 'Posted Latest Listing',
              description: mostRecent.title,
              icon: <StorefrontIcon />,
              color: 'primary.main'
            });
          }
        }
        
        // Sort timeline events by date (newest first)
        timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
        setActivityTimeline(timelineEvents);
        
      } catch (err) {
        setError('Error loading user profile');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // New function for manual stats calculation as fallback
  const calculateManualStats = async (listingsData, userId) => {
    try {
      // Calculate response rate and activity stats
      const activeListingsCount = listingsData?.filter(l => l.status === 'available').length || 0;
      const soldListingsCount = listingsData?.filter(l => l.status === 'sold').length || 0;
      
      // Get offers for this user's listings
      const { data: offersData } = await supabase
        .from('offers')
        .select('*')
        .eq('seller_id', userId);
        
      const offerCount = offersData?.length || 0;
      const acceptedOffers = offersData?.filter(o => o.status === 'accepted').length || 0;
      const declinedOffers = offersData?.filter(o => o.status === 'declined').length || 0;
      const responseRate = offerCount > 0 
        ? Math.round((acceptedOffers + declinedOffers) / offerCount * 100) 
        : 0;
      
      setActivityStats({
        totalListings: listingsData?.length || 0,
        activeListings: activeListingsCount,
        soldItems: soldListingsCount,
        responseRate: responseRate,
        avgResponseTime: '24h',
        offersReceived: offerCount,
        offersAccepted: acceptedOffers,
        offersDeclined: declinedOffers,
        joinDate: undefined
      });
    } catch (error) {
      console.error('Error calculating manual stats:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profileUser) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          User not found
        </Alert>
      </Container>
    );
  }

  const isOwnProfile = user?.id === profileUser.id;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {isOwnProfile ? 'Your Profile' : `${profileUser.name}'s Profile`}
          </Typography>
          
          {!isOwnProfile && (
            <Tooltip title="Report User">
              <Button
                variant="outlined"
                color="error"
                startIcon={<ReportIcon />}
                onClick={() => navigate('/report', { 
                  state: { 
                    reportType: 'user', 
                    itemId: profileUser.id, 
                    itemData: { name: profileUser.name } 
                  } 
                })}
              >
                Report User
              </Button>
            </Tooltip>
          )}
        </Box>

        <Grid container spacing={4}>
          {/* User Info Card */}
          <Grid item xs={12} md={4}>
            <UserContactCard 
              user={profileUser}
              userRating={userRating?.rating}
              joinedDate={profileUser.created_at}
              showContactButton={!isOwnProfile}
              activityStats={activityStats}
              fullView={true}
            />
            
            {/* Activity timeline */}
            {activityTimeline.length > 0 && (
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Activity Timeline
                </Typography>
                <List sx={{ width: '100%' }}>
                  {activityTimeline.map((event, index) => (
                    <ListItem 
                      key={index}
                      alignItems="flex-start"
                      sx={{ 
                        position: 'relative',
                        pl: 4,
                        pb: 3,
                        '&:before': {
                          content: '""',
                          position: 'absolute',
                          left: 16,
                          top: 0,
                          bottom: 0,
                          width: 2,
                          bgcolor: index < activityTimeline.length - 1 ? 'divider' : 'transparent',
                          zIndex: 1
                        }
                      }}
                    >
                      <ListItemIcon sx={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: 0,
                        minWidth: 'auto',
                        zIndex: 2
                      }}>
                        <Avatar sx={{ bgcolor: event.color, width: 32, height: 32 }}>
                          {event.icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle2">
                            {event.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {format(new Date(event.date), 'MMM d, yyyy')}
                            </Typography>
                            {event.description && (
                              <Typography variant="body2" color="text.secondary">
                                {event.description}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>

          {/* Tabs Section */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                  <Tab label={`Listings (${userListings.length})`} />
                  <Tab label={`Reviews (${userRating?.count || 0})`} />
                  <Tab label="Activity" />
                </Tabs>
              </Box>

              {/* Listings Tab */}
              {activeTab === 0 && (
                <Box>
                  {userListings.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                      This user has no listings yet.
                    </Typography>
                  ) : (
                    <>
                      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip 
                          icon={<StorefrontIcon />} 
                          label={`${activityStats?.activeListings || 0} active`} 
                          variant="outlined" 
                          color="primary" 
                        />
                        <Chip 
                          icon={<CheckCircleIcon />} 
                          label={`${activityStats?.soldItems || 0} sold`} 
                          variant="outlined" 
                          color="success" 
                        />
                      </Box>
                    
                      <Grid container spacing={3}>
                        {userListings.map((listing) => (
                          <Grid item key={listing.id} xs={12} sm={6}>
                            <ListingCard listing={listing} />
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                </Box>
              )}

              {/* Reviews Tab */}
              {activeTab === 1 && (
                <Box>
                  <UserReviews 
                    userId={profileUser.id} 
                    userName={profileUser.name} 
                    showAddReview={!isOwnProfile}
                  />
                </Box>
              )}
              
              {/* Activity Tab */}
              {activeTab === 2 && (
                <Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <StorefrontIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">
                              Listings
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h3" align="center" sx={{ mb: 1 }}>
                            {activityStats?.totalListings || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" align="center">
                            Total items posted
                          </Typography>
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="subtitle2" color="success.main">
                                {activityStats?.activeListings || 0}
                              </Typography>
                              <Typography variant="caption">Active</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="subtitle2" color="info.main">
                                {activityStats?.soldItems || 0}
                              </Typography>
                              <Typography variant="caption">Sold</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocalOfferIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">
                              Offers
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h3" align="center" sx={{ mb: 1 }}>
                            {activityStats?.offersReceived || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" align="center">
                            Total offers received
                          </Typography>
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="subtitle2" color="success.main">
                                {activityStats?.offersAccepted || 0}
                              </Typography>
                              <Typography variant="caption">Accepted</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="subtitle2" color="error.main">
                                {activityStats?.offersDeclined || 0}
                              </Typography>
                              <Typography variant="caption">Declined</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                            <Typography variant="h6">
                              Response Rate
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h3" align="center" sx={{ mb: 1 }}>
                            {activityStats?.responseRate || 0}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary" align="center">
                            Responds to offers
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" display="block" align="center">
                              Average response time: {activityStats?.avgResponseTime || 'N/A'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <StarIcon sx={{ mr: 1, color: 'warning.main' }} />
                            <Typography variant="h6">
                              Rating
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h3" align="center" sx={{ mb: 1 }}>
                            {userRating?.rating ? userRating.rating.toFixed(1) : 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" align="center">
                            Based on {userRating?.count || 0} reviews
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        {profileUser.name} has been a member for {profileUser.created_at ? 
                          formatDistanceToNow(new Date(profileUser.created_at)) : 'some time'}.
                      </Typography>
                      {activityStats?.lastUpdated && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Stats last updated: {formatDistanceToNow(new Date(activityStats.lastUpdated), { addSuffix: true })}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default UserProfilePage; 