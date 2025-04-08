import React from 'react';
import {
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const ListingHeader = ({ listingTitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ mb: { xs: 2, md: 3 } }}>
      {/* Back button for mobile */}
      {isMobile && (
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          component={RouterLink}
          to="/listings"
          sx={{ pl: 0 }}
        >
          Back to Listings
        </Button>
      )}

      {/* Breadcrumbs navigation - hidden on mobile */}
      {!isMobile && (
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/" color="inherit">
            Home
          </Link>
          <Link component={RouterLink} to="/listings" color="inherit">
            Listings
          </Link>
          <Typography color="text.primary" noWrap sx={{ maxWidth: '300px' }}>
            {listingTitle}
          </Typography>
        </Breadcrumbs>
      )}
    </Box>
  );
};

export default ListingHeader; 