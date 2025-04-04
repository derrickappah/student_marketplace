import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Divider,
  Chip,
  Button,
  Badge,
  Grid,
  Link,
  Tooltip,
  Stack,
  Rating,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
import VerifiedIcon from '@mui/icons-material/Verified';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SellIcon from '@mui/icons-material/Sell';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import WebIcon from '@mui/icons-material/Web';
import ContactSellerButton from './ContactSellerButton';

const UserContactCard = ({ 
  user, 
  listing = null, 
  userRating = null, 
  joinedDate = null,
  showContactButton = true,
  elevation = 1,
  activityStats = null,
  fullView = false,
  showMessageButton = true
}) => {
  if (!user) return null;
  
  // Extract social links from user profile if available
  const socialLinks = user.social_links || {};
  
  // Activity stats with default values
  const stats = activityStats || {
    totalListings: 0,
    responseRate: 0,
    avgResponseTime: 'N/A',
    positiveRatings: 0
  };
  
  return (
    <Paper elevation={elevation} sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: fullView ? 3 : 2 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            user.verified_seller ? (
              <Tooltip title="Verified Seller">
                <VerifiedIcon color="primary" />
              </Tooltip>
            ) : null
          }
        >
          <Avatar 
            src={user.avatar_url} 
            alt={user.name}
            sx={{ width: 60, height: 60, mr: 2 }}
          >
            {user.name?.charAt(0) || '?'}
          </Avatar>
        </Badge>
        <Box>
          <Typography variant="h6">{user.name}</Typography>
          {user.university && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {user.university}
              </Typography>
            </Box>
          )}
          {joinedDate && (
            <Typography variant="caption" color="text.secondary" display="block">
              Member for {formatDistanceToNow(new Date(joinedDate), { addSuffix: false })}
            </Typography>
          )}
          {userRating !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Rating 
                value={userRating} 
                precision={0.5} 
                size="small" 
                readOnly 
              />
            </Box>
          )}
        </Box>
      </Box>
      
      {/* User bio if available and in full view mode */}
      {user.bio && fullView && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2">
            {user.bio}
          </Typography>
        </Box>
      )}
      
      {/* Activity stats section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Seller Activity
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StorefrontIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {stats.totalListings} {stats.totalListings === 1 ? 'Listing' : 'Listings'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SellIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {stats.positiveRatings} Successful {stats.positiveRatings === 1 ? 'Sale' : 'Sales'}
              </Typography>
            </Box>
          </Grid>
          {fullView && (
            <>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <QueryBuilderIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {stats.avgResponseTime} Response
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {stats.responseRate}% Response Rate
                  </Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
      
      {/* Verification chips */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {user.verified_email && (
            <Chip
              size="small"
              icon={<VerifiedIcon fontSize="small" />}
              label="Email Verified"
              color="primary"
              variant="outlined"
              sx={{ mb: 1 }}
            />
          )}
          {user.verified_phone && (
            <Chip
              size="small"
              icon={<VerifiedIcon fontSize="small" />}
              label="Phone Verified"
              color="primary"
              variant="outlined"
              sx={{ mb: 1 }}
            />
          )}
          {userRating > 4 && (
            <Chip
              size="small"
              icon={<StarIcon fontSize="small" />}
              label="Top Rated"
              color="success"
              variant="outlined"
              sx={{ mb: 1 }}
            />
          )}
        </Stack>
      </Box>
      
      {/* Social links if available and in full view */}
      {fullView && Object.values(socialLinks).some(Boolean) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Connect
          </Typography>
          <Stack direction="row" spacing={1}>
            {socialLinks.twitter && (
              <Tooltip title="Twitter">
                <Link href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                  <TwitterIcon color="action" />
                </Link>
              </Tooltip>
            )}
            {socialLinks.instagram && (
              <Tooltip title="Instagram">
                <Link href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                  <InstagramIcon color="action" />
                </Link>
              </Tooltip>
            )}
            {socialLinks.linkedin && (
              <Tooltip title="LinkedIn">
                <Link href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                  <LinkedInIcon color="action" />
                </Link>
              </Tooltip>
            )}
            {socialLinks.website && (
              <Tooltip title="Website">
                <Link href={socialLinks.website} target="_blank" rel="noopener noreferrer">
                  <WebIcon color="action" />
                </Link>
              </Tooltip>
            )}
          </Stack>
        </Box>
      )}
      
      {/* Listing information if provided */}
      {listing && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            About this listing:
          </Typography>
          <Typography variant="body2" gutterBottom>
            {listing.title} - GHC {parseFloat(listing.price).toFixed(2)}
          </Typography>
        </>
      )}
      
      {/* Contact/message button */}
      {showContactButton && user.id && (
        <Box sx={{ mt: 3 }}>
          <ContactSellerButton 
            seller={user}
            listing={listing}
            buttonText={listing ? "Contact About This Listing" : "Send Message"}
            fullWidth
            variant="contained"
          />
        </Box>
      )}
      
      {/* View profile button if not in full view and not viewing a listing */}
      {!fullView && !listing && user.id && (
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="outlined" 
            fullWidth
            component={Link}
            href={`/user/${user.id}`}
          >
            View Full Profile
          </Button>
        </Box>
      )}

      {/* Response rate and stats */}
      {activityStats && activityStats.responseRate !== undefined && (
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip title="Percentage of offers this seller responds to">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Response Rate:</Typography>
              <Chip 
                size="small" 
                label={`${activityStats.responseRate}%`} 
                color={activityStats.responseRate > 80 ? 'success' : 
                       activityStats.responseRate > 50 ? 'primary' : 'default'}
              />
            </Box>
          </Tooltip>
          
          {activityStats.avgResponseTime && (
            <Tooltip title="Average time to respond to messages and offers">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Response Time:</Typography>
                <Typography variant="body2" color="text.secondary">
                  ~{activityStats.avgResponseTime}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default UserContactCard; 