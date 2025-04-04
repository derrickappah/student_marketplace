import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Skeleton,
  Paper,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getRecentlyViewedListings } from '../services/supabase';
import ListingCard from './ListingCard';

const RecentlyViewedListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getRecentlyViewedListings(4); // Get 4 recently viewed listings
        setListings(data);
      } catch (err) {
        console.error('Error fetching recently viewed listings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, [user]);

  if (!user || (listings.length === 0 && !loading)) {
    return null; // Don't show if no recently viewed listings or not logged in
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Recently Viewed
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {listings.map(listing => (
            <Grid item key={listing.id} xs={12} sm={6} md={3}>
              <ListingCard listing={listing} />
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

export default RecentlyViewedListings; 