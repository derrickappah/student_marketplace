import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  Card,
  CardMedia,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as FeaturedIcon,
  PushPin as PriorityIcon,
  Category as CategoryIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';

// Helper function to safely format dates
const formatDate = (dateStr, formatPattern = 'MMM dd, yyyy') => {
  if (!dateStr) return 'N/A';
  
  // Try to parse the date
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
  
  // Check if the date is valid
  if (!isValid(date)) {
    console.warn('Invalid date value:', dateStr);
    return 'Invalid date';
  }
  
  // Format the date if it's valid
  return format(date, formatPattern);
};

const ListingDetailDialog = ({ open, onClose, listing }) => {
  const theme = useTheme();

  if (!listing) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="body"
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Listing Details</Typography>
          <IconButton size="small" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Listing images */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              {listing.images && listing.images.length > 0 ? (
                <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={listing.images[0]}
                    alt={listing.title}
                    sx={{ 
                      height: 300,
                      width: '100%',
                      objectFit: 'cover' 
                    }}
                  />
                </Card>
              ) : (
                <Box
                  sx={{ 
                    height: 300,
                    width: '100%',
                    borderRadius: 2,
                    backgroundColor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="body1" color="textSecondary">
                    No Images Available
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Additional images - thumbnails */}
            {listing.images && listing.images.length > 1 && (
              <Grid container spacing={1}>
                {listing.images.slice(1, 5).map((image, index) => (
                  <Grid item xs={3} key={index}>
                    <Card sx={{ borderRadius: 1, overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        image={image}
                        alt={`${listing.title} - image ${index + 2}`}
                        sx={{ 
                          height: 70,
                          objectFit: 'cover' 
                        }}
                      />
                    </Card>
                  </Grid>
                ))}
                {listing.images.length > 5 && (
                  <Grid item xs={3}>
                    <Box
                      sx={{ 
                        height: 70,
                        borderRadius: 1,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      <Typography variant="body1">
                        +{listing.images.length - 5} more
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </Grid>

          {/* Listing details */}
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              {listing.title}
            </Typography>
            
            <Box sx={{ display: 'flex', mb: 2 }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                ${listing.price}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Condition
              </Typography>
              <Chip 
                label={listing.condition} 
                size="small" 
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Category
              </Typography>
              <Chip 
                icon={<CategoryIcon fontSize="small" />}
                label={listing.categories?.name || 'Unknown'} 
                size="small" 
                color="default"
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Seller
              </Typography>
              <Typography variant="body1">
                {listing.users?.name || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {listing.users?.email || 'No email'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Promotion Status
              </Typography>
              <Chip 
                label={listing.promotion_status || 'None'} 
                size="small" 
                color={
                  listing.promotion_status === 'approved' ? 'success' :
                  listing.promotion_status === 'pending' ? 'warning' :
                  listing.promotion_status === 'rejected' ? 'error' : 'default'
                }
                sx={{ mt: 0.5 }}
              />
            </Box>

            {listing.is_featured && (
              <Box sx={{ mb: 2 }}>
                <Chip 
                  icon={<FeaturedIcon />}
                  label="Featured" 
                  size="small" 
                  color="primary"
                  sx={{ mr: 1 }}
                />
                {listing.is_priority && (
                  <Chip 
                    icon={<PriorityIcon />}
                    label="Priority" 
                    size="small" 
                    color="secondary"
                  />
                )}
              </Box>
            )}

            {listing.promotion_expires_at && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Promotion Expires
                </Typography>
                <Chip 
                  icon={<TimeIcon fontSize="small" />}
                  label={formatDate(listing.promotion_expires_at, 'MMM dd, yyyy')} 
                  size="small" 
                  sx={{ mt: 0.5 }}
                />
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Created
              </Typography>
              <Typography variant="body2">
                {formatDate(listing.created_at, 'MMM dd, yyyy HH:mm')}
              </Typography>
            </Box>
          </Grid>

          {/* Description section */}
          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {listing.description}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ListingDetailDialog; 