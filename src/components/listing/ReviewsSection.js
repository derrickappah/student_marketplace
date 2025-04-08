import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider, 
  Button,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import ProductReviews from '../ProductReviews';
import SellerReviews from '../SellerReviews';
import ReviewIcon from '@mui/icons-material/Reviews';

const ReviewsSection = ({ listingId, listingUserId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeSection, setActiveSection] = useState('product');

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        {isMobile && (
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant={activeSection === 'product' ? 'contained' : 'outlined'}
              startIcon={<ReviewIcon />}
              onClick={() => setActiveSection('product')}
              fullWidth
            >
              Product Reviews
            </Button>
            <Button
              variant={activeSection === 'seller' ? 'contained' : 'outlined'}
              startIcon={<ReviewIcon />}
              onClick={() => setActiveSection('seller')}
              fullWidth
            >
              Seller Reviews
            </Button>
          </Stack>
        )}

        <Box sx={{ mb: 4, display: isMobile && activeSection !== 'product' ? 'none' : 'block' }}>
          <ProductReviews listingId={listingId} />
        </Box>
        
        {!isMobile && <Divider sx={{ my: 4 }} />}
        
        <Box sx={{ display: isMobile && activeSection !== 'seller' ? 'none' : 'block' }}>
          <SellerReviews userId={listingUserId} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReviewsSection; 