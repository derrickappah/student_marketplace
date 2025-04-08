import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Skeleton,
} from '@mui/material';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { parseImageUrls } from '../../supabaseClient';

const MoreFromSellerSection = ({ sellerId, currentListingId }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchSellerListings = async () => {
      if (!sellerId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, price, images')
          .eq('user_id', sellerId)
          .neq('id', currentListingId) // Exclude current listing
          .eq('status', 'active') // Only active listings
          .order('created_at', { ascending: false })
          .limit(4);
        
        if (error) throw error;
        
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching seller listings:', error);
        setError('Failed to load more listings from this seller.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSellerListings();
  }, [sellerId, currentListingId]);
  
  // Format price with correct currency symbol
  const formatPrice = (price) => {
    if (typeof price !== 'number') return 'Price not available';
    
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).replace('GHS', 'GHC');
  };

  if (listings.length === 0 && !loading) return null;

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        More from this Seller
      </Typography>
      
      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={6} sm={3} key={item}>
              <Card sx={{ height: '100%' }}>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="50%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {listings.map((listing) => {
              // Parse image URLs
              const imageUrls = parseImageUrls(listing.images);
              const firstImage = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;
              
              return (
                <Grid item xs={6} sm={3} key={listing.id}>
                  <Card sx={{ height: '100%', borderRadius: 2 }}>
                    <CardActionArea onClick={() => navigate(`/listings/${listing.id}`)}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={firstImage || '/placeholder.png'}
                        alt={listing.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Typography variant="subtitle2" noWrap>
                          {listing.title}
                        </Typography>
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          {formatPrice(listing.price)}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          
          {listings.length > 0 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button 
                variant="text" 
                onClick={() => navigate(`/user/${sellerId}/listings`)}
              >
                View All Listings
              </Button>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default MoreFromSellerSection;