import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const RelatedProducts = ({ listing, currentListingId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!listing) return;
      
      try {
        setLoading(true);
        
        // Fetch products in the same category
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, price, original_price, images, category')
          .eq('category', listing.category)
          .neq('id', currentListingId) // Exclude current listing
          .eq('status', 'active') // Only active listings
          .limit(4);
        
        if (error) throw error;
        
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedProducts();
  }, [listing, currentListingId]);

  // Parse image URLs if they're in JSON format
  const parseImageUrl = (imagesData) => {
    if (!imagesData) return '';
    
    try {
      if (typeof imagesData === 'string') {
        const parsed = JSON.parse(imagesData);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '';
      }
      return Array.isArray(imagesData) && imagesData.length > 0 ? imagesData[0] : '';
    } catch (error) {
      return '';
    }
  };

  // Calculate discount percentage
  const calculateDiscount = (originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return null;
    
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return Math.round(discount);
  };

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

  if (products.length === 0 && !loading) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        You may also like
      </Typography>
      
      <Grid container spacing={2}>
        {loading ? (
          // Loading skeletons
          Array.from(new Array(4)).map((_, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          // Actual products
          products.map((product) => {
            const imageUrl = parseImageUrl(product.images);
            const discount = calculateDiscount(product.original_price, product.price);
            
            return (
              <Grid item xs={6} sm={4} md={3} key={product.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    '&:hover': { boxShadow: 3 }
                  }}
                >
                  {discount && (
                    <Chip
                      label={`-${discount}%`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        bgcolor: '#e53935',
                        color: 'white',
                        fontWeight: 'bold',
                        zIndex: 1
                      }}
                    />
                  )}
                  
                  <CardActionArea onClick={() => navigate(`/listings/${product.id}`)}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={imageUrl || '/placeholder.png'}
                      alt={product.title}
                      sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                    />
                    <CardContent>
                      <Typography 
                        variant="subtitle2" 
                        component="div"
                        sx={{ 
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          height: '2.5em'
                        }}
                      >
                        {product.title}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" component="div" fontWeight="bold">
                          {formatPrice(product.price)}
                        </Typography>
                        
                        {discount && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ textDecoration: 'line-through' }}
                          >
                            {formatPrice(product.original_price)}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
    </Box>
  );
};

export default RelatedProducts;