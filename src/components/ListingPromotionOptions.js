import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Paper,
  Grid,
  Chip,
  Tooltip,
  Divider,
  Alert,
  Button,
} from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import StarIcon from '@mui/icons-material/Star';
import PushPinIcon from '@mui/icons-material/PushPin';
import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

/**
 * ListingPromotionOptions component for promoting listings
 * 
 * @param {Object} props Component props
 * @param {Object} props.promotionOptions Current promotion options state
 * @param {Function} props.onChange Callback when promotion options change
 * @param {string} props.promotionStatus Current promotion status (none, pending, approved, rejected)
 * @param {Function} props.onRequestPromotion Callback when promotion is requested
 * @param {Date} props.expiresAt Date when promotion expires
 * @param {boolean} props.isEditing Whether the component is being used in edit mode
 */
const ListingPromotionOptions = ({ 
  promotionOptions = {}, 
  onChange, 
  promotionStatus = 'none',
  onRequestPromotion,
  expiresAt,
  isEditing = false
}) => {
  const handleChange = (event) => {
    const { name, checked } = event.target;
    onChange({ ...promotionOptions, [name]: checked });
  };

  // Determine if form inputs should be disabled
  const isDisabled = promotionStatus === 'pending' || promotionStatus === 'approved';
  
  // Format expiration date
  const formatExpiryDate = (date) => {
    if (!date) return '';
    const expDate = new Date(date);
    return expDate.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Render status chip
  const renderStatusChip = () => {
    switch (promotionStatus) {
      case 'pending':
        return (
          <Chip 
            icon={<AccessTimeIcon />} 
            label="Pending Approval" 
            color="warning" 
            size="small" 
            sx={{ ml: 1 }}
          />
        );
      case 'approved':
        return (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Approved" 
            color="success" 
            size="small" 
            sx={{ ml: 1 }}
          />
        );
      case 'rejected':
        return (
          <Chip 
            icon={<CancelIcon />} 
            label="Rejected" 
            color="error" 
            size="small" 
            sx={{ ml: 1 }}
          />
        );
      default:
        return null;
    }
  };

  const hasSelectedPromotions = promotionOptions.featured || promotionOptions.priority;

  return (
    <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <WhatshotIcon color="error" sx={{ mr: 1 }} />
        <Typography variant="h6">Promotion Options</Typography>
        {renderStatusChip()}
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {promotionStatus === 'approved' && expiresAt && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Your promotion is active until {formatExpiryDate(expiresAt)}
        </Alert>
      )}

      {promotionStatus === 'rejected' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Your promotion request was not approved. You can make changes and request again.
        </Alert>
      )}
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enhance your listing's visibility with these promotion options
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={!!promotionOptions.featured} 
                    onChange={handleChange}
                    name="featured"
                    color="primary"
                    disabled={isDisabled}
                  />
                }
                label="Featured Listing"
              />
              <Tooltip title="Your listing will appear in the featured section on the homepage">
                <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
              </Tooltip>
            </Box>
            <Chip 
              icon={<StarIcon />} 
              label="Popular Choice" 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mt: 0.5 }}>
            Get more visibility by featuring your listing on the homepage and search results
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={!!promotionOptions.priority} 
                    onChange={handleChange}
                    name="priority"
                    color="secondary"
                    disabled={isDisabled}
                  />
                }
                label="Priority Listing"
              />
              <Tooltip title="Your listing will be prioritized in search results and category pages">
                <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
              </Tooltip>
            </Box>
            <Chip 
              icon={<PushPinIcon />} 
              label="Top of Results" 
              size="small" 
              color="secondary" 
              variant="outlined" 
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mt: 0.5 }}>
            Show your listing before others in search results and category pages
          </Typography>
        </Grid>
      </Grid>
      
      {promotionStatus === 'none' && hasSelectedPromotions && onRequestPromotion && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={onRequestPromotion}
          >
            Request Promotion
          </Button>
        </Box>
      )}
      
      {isEditing && promotionStatus === 'none' && hasSelectedPromotions && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Save this listing to request promotion. Promotions require admin approval before becoming active.
        </Alert>
      )}
      
      {!isEditing && hasSelectedPromotions && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Promotion options will be applied once your listing is reviewed and approved. This usually takes less than 24 hours.
        </Alert>
      )}
      
      {promotionStatus === 'pending' && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Your promotion request is pending approval. You'll receive a notification once it's reviewed.
        </Alert>
      )}
    </Paper>
  );
};

export default ListingPromotionOptions; 