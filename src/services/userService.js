import { supabase } from './supabase';

/**
 * Fetch user profile data
 * @param {string} userId - The user ID to fetch profile for
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - The user ID to update
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - Updated user profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Delete a listing safely with proper cleanup
 * @param {string} listingId - The ID of the listing to delete
 * @returns {Promise<Object>} - Result of the operation
 */
export const userDeleteListing = async (listingId) => {
  try {
    // First try to use the safe_delete_listing function if it exists
    const { data, error } = await supabase
      .rpc('safe_delete_listing', { listing_id: listingId });
    
    if (error) {
      console.error('Safe delete function failed, trying direct delete:', error);
      
      // If RPC fails, try direct delete with cascade
      const { error: directError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);
      
      if (directError) {
        throw directError;
      }
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error deleting listing:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user activity statistics
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - User activity statistics
 */
export const getUserActivity = async (userId) => {
  try {
    // Get listings count
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, status')
      .eq('user_id', userId);
    
    if (listingsError) throw listingsError;
    
    // Get reviews count
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .eq('seller_id', userId);
    
    if (reviewsError) throw reviewsError;
    
    // Get rating
    const { count: reviewCount, error: ratingError } = await supabase
      .from('reviews')
      .select('rating', { count: 'exact' })
      .eq('seller_id', userId);
    
    if (ratingError) throw ratingError;
    
    // Calculate statistics
    const activeListings = listings.filter(l => l.status === 'available').length;
    const soldListings = listings.filter(l => l.status === 'sold').length;
    
    return {
      totalListings: listings.length,
      activeListings,
      soldListings,
      reviewCount: reviews.length,
      hasActivity: listings.length > 0 || reviews.length > 0
    };
  } catch (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }
};

/**
 * Get transactions for a user (as buyer or seller)
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - List of transactions
 */
export const getUserTransactions = async (userId) => {
  try {
    // Get offers where user is buyer
    const { data: buyerOffers, error: buyerError } = await supabase
      .from('offers')
      .select(`
        *,
        listing:listing_id(
          id,
          title,
          price,
          images,
          status
        ),
        seller:seller_id(
          id,
          name,
          avatar_url
        )
      `)
      .eq('buyer_id', userId)
      .eq('status', 'accepted');
    
    if (buyerError) throw buyerError;
    
    // Get offers where user is seller
    const { data: sellerOffers, error: sellerError } = await supabase
      .from('offers')
      .select(`
        *,
        listing:listing_id(
          id,
          title,
          price,
          images,
          status
        ),
        buyer:buyer_id(
          id,
          name,
          avatar_url
        )
      `)
      .eq('seller_id', userId)
      .eq('status', 'accepted');
    
    if (sellerError) throw sellerError;
    
    // Process and return combined transactions
    const buyerTransactions = buyerOffers.map(offer => ({
      ...offer,
      type: 'purchase',
      otherParty: offer.seller
    }));
    
    const sellerTransactions = sellerOffers.map(offer => ({
      ...offer,
      type: 'sale',
      otherParty: offer.buyer
    }));
    
    // Combine and sort by date (newest first)
    return [...buyerTransactions, ...sellerTransactions]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    throw error;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  getUserActivity,
  getUserTransactions,
  userDeleteListing
}; 