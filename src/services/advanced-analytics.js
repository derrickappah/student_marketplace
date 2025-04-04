import { supabase } from "./supabase";

// Get user activity analytics
export const getUserActivityAnalytics = async (userId, timeRange = '30d') => {
  try {
    const { data, error } = await supabase.functions.invoke('analytics', {
      body: { 
        type: 'user-activity',
        userId,
        timeRange 
      }
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user activity analytics:', error);
    return { data: null, error: error.message };
  }
};

// Get listing view analytics
export const getListingViewAnalytics = async (listingId, timeRange = '30d') => {
  try {
    const { data, error } = await supabase.functions.invoke('analytics', {
      body: { 
        type: 'listing-views',
        listingId,
        timeRange 
      }
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching listing view analytics:', error);
    return { data: null, error: error.message };
  }
};

// Get listing interest analytics
export const getListingInterestAnalytics = async (listingId) => {
  try {
    const { data, error } = await supabase.functions.invoke('analytics', {
      body: { 
        type: 'listing-interests',
        listingId 
      }
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching listing interest analytics:', error);
    return { data: null, error: error.message };
  }
};

// Get marketplace trend analytics
export const getMarketplaceTrendAnalytics = async (timeRange = '30d') => {
  try {
    const { data, error } = await supabase.functions.invoke('analytics', {
      body: { 
        type: 'marketplace-trends',
        timeRange 
      }
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching marketplace trend analytics:', error);
    return { data: null, error: error.message };
  }
};

// Update or create a broadcast about a listing
export const broadcastListingUpdate = async (listingId, updateType, details) => {
  try {
    const { data, error } = await supabase.functions.invoke('realtime-handler', {
      body: {
        action: 'broadcast-listing-update',
        payload: {
          listingId,
          updateType,
          details
        }
      }
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error broadcasting listing update:', error);
    return { data: null, error: error.message };
  }
};

// Create a payment for a listing
export const createPayment = async (listingId, amount, paymentMethod) => {
  try {
    const { data, error } = await supabase.functions.invoke('index', {
      body: {
        listingId,
        amount,
        paymentMethod
      },
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      path: '/process-payment'
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { data: null, error: error.message };
  }
};

// Subscribe to real-time updates for a listing
export const subscribeToListingUpdates = (listingId, callback) => {
  return supabase
    .channel(`listing:${listingId}`)
    .on('presence', { event: 'sync' }, () => {
      const presenceState = supabase.getPresenceState(`listing:${listingId}`);
      const viewerCount = Object.keys(presenceState).length;
      console.log(`${viewerCount} viewers are currently looking at this listing`);
    })
    .on('broadcast', { event: 'update' }, (payload) => {
      callback(payload);
    })
    .subscribe();
};

// Subscribe to personal notifications
export const subscribeToPersonalChannel = (userId, callback) => {
  return supabase
    .channel(`user:${userId}`)
    .on('broadcast', { event: '*' }, (payload) => {
      callback(payload);
    })
    .subscribe();
}; 