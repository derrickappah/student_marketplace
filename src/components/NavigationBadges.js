import React, { useEffect, useState } from 'react';
import { Badge, Box, Tooltip, keyframes } from '@mui/material';
import {
  Message as MessageIcon,
  LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationsContext';

// Define a pulse animation for new offers
const pulseBadge = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const NavigationBadges = () => {
  const { badgeCounts, unreadCount } = useNotifications();
  const [newActivity, setNewActivity] = useState({ messages: false, offers: false });

  // Log badge counts when they change
  useEffect(() => {
    console.log('NavigationBadges: Badge counts updated', badgeCounts);
    
    // Check if there are new unread items and animate accordingly
    if (badgeCounts.messages > 0) {
      setNewActivity(prev => ({ ...prev, messages: true }));
      // Reset animation after 5 seconds
      setTimeout(() => setNewActivity(prev => ({ ...prev, messages: false })), 5000);
    }
    
    if (badgeCounts.offers > 0) {
      setNewActivity(prev => ({ ...prev, offers: true }));
      // Reset animation after 5 seconds
      setTimeout(() => setNewActivity(prev => ({ ...prev, offers: false })), 5000);
    }
  }, [badgeCounts]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* Messages Badge */}
      {badgeCounts.messages > 0 && (
        <Tooltip title={`${badgeCounts.messages} unread message${badgeCounts.messages !== 1 ? 's' : ''}`}>
          <Badge
            badgeContent={badgeCounts.messages}
            color="error"
            max={99}
            component={RouterLink}
            to="/messages"
            sx={{ 
              cursor: 'pointer',
              color: 'inherit',
              '& a': { color: 'inherit' },
              '&:hover': { opacity: 0.8 },
              animation: newActivity.messages ? `${pulseBadge} 1s ease-in-out infinite` : 'none',
            }}
          >
            <MessageIcon />
          </Badge>
        </Tooltip>
      )}

      {/* Offers Badge */}
      {badgeCounts.offers > 0 && (
        <Tooltip title={`${badgeCounts.offers} unread offer${badgeCounts.offers !== 1 ? 's' : ''}`}>
          <Badge
            badgeContent={badgeCounts.offers}
            color="error"
            max={99}
            component={RouterLink}
            to="/offers"
            sx={{ 
              cursor: 'pointer',
              color: 'inherit',
              '& a': { color: 'inherit' },
              '&:hover': { opacity: 0.8 },
              animation: newActivity.offers ? `${pulseBadge} 1s ease-in-out infinite` : 'none',
            }}
          >
            <LocalOfferIcon />
          </Badge>
        </Tooltip>
      )}
    </Box>
  );
};

export default NavigationBadges; 