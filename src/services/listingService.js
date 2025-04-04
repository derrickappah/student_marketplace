import { supabase } from './supabase';

/**
 * Safely deletes a listing by handling all dependencies
 * 
 * @param {string} listingId - The UUID of the listing to delete
 * @param {string} userId - The UUID of the user requesting the deletion (for permission check)
 * @returns {Promise<{success: boolean, error: object|null}>} Result of the operation
 */
export const safeDeleteListing = async (listingId, userId) => {
  try {
    // First, check if the user has permission to delete this listing
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching listing:', fetchError);
      return { success: false, error: fetchError };
    }
    
    // Check ownership - only the listing owner can delete it
    if (listing.user_id !== userId) {
      return { 
        success: false, 
        error: { message: 'You do not have permission to delete this listing' }
      };
    }
    
    // Try to use the safe_delete_listing function if it exists
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('safe_delete_listing', {
        listing_id_param: listingId
      });
      
      // If the function executed successfully and returned true
      if (!rpcError && rpcResult === true) {
        console.log('Listing successfully deleted with safe_delete_listing function');
        return { success: true, error: null };
      }
      
      // If there was an RPC error but it's not "function doesn't exist", propagate the error
      if (rpcError && !rpcError.message?.includes('function does not exist')) {
        console.error('Error from safe_delete_listing function:', rpcError);
        return { success: false, error: rpcError };
      }
    } catch (rpcError) {
      // If there's an exception when calling the RPC function, log it but continue with fallback
      console.warn('Failed to use safe_delete_listing function, falling back to manual deletion', rpcError);
    }
    
    // If the RPC function doesn't exist or didn't work, manually delete related records
    // Start a transaction by using the REST API
    
    // 1. Delete records in promotion_request_history if it exists
    try {
      const { error: promotionHistoryError } = await supabase
        .from('promotion_request_history')
        .delete()
        .eq('listing_id', listingId);
      
      if (promotionHistoryError && !promotionHistoryError.message?.includes('does not exist')) {
        console.warn('Error deleting promotion history:', promotionHistoryError);
      }
    } catch (err) {
      // Ignore table doesn't exist errors
      console.warn('Error while deleting promotion history (might be normal):', err.message);
    }
    
    // 2. Delete records in listing_promotions if the table exists
    try {
      // Since listing_promotions is the table causing issues, use a direct SQL approach
      const { error: listingPromotionsError } = await supabase.rpc('exec_sql', {
        sql_query: `DELETE FROM listing_promotions WHERE listing_id = '${listingId}'`
      });
      
      if (listingPromotionsError && 
          !listingPromotionsError.message?.includes('does not exist') &&
          !listingPromotionsError.message?.includes('function does not exist')) {
        console.warn('Error deleting listing promotions:', listingPromotionsError);
      }
    } catch (err) {
      // Ignore table doesn't exist errors
      console.warn('Error while deleting listing promotions (might be normal):', err.message);
    }
    
    // 3. Delete saved listings
    const { error: savedListingsError } = await supabase
      .from('saved_listings')
      .delete()
      .eq('listing_id', listingId);
      
    if (savedListingsError) {
      console.warn('Error deleting saved listings:', savedListingsError);
    }
    
    // 4. Delete viewed listings
    const { error: viewedListingsError } = await supabase
      .from('viewed_listings')
      .delete()
      .eq('listing_id', listingId);
      
    if (viewedListingsError) {
      console.warn('Error deleting viewed listings:', viewedListingsError);
    }
    
    // 5. Delete offers
    const { error: offersError } = await supabase
      .from('offers')
      .delete()
      .eq('listing_id', listingId);
      
    if (offersError) {
      console.warn('Error deleting offers:', offersError);
    }
    
    // 6. Finally, delete the listing itself
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);
      
    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return { success: false, error: deleteError };
    }
    
    console.log('Listing successfully deleted with manual deletion');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in safeDeleteListing:', error);
    return { success: false, error };
  }
};

/**
 * Gets a listing by ID
 * 
 * @param {string} listingId - The UUID of the listing to fetch
 * @returns {Promise<{data: object|null, error: object|null}>} Result of the operation
 */
export const getListingById = async (listingId) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email,
          university,
          profile_image
        ),
        category:category_id (
          id,
          name
        )
      `)
      .eq('id', listingId)
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching listing:', error);
    return { data: null, error };
  }
};

/**
 * Updates a listing
 * 
 * @param {string} listingId - The UUID of the listing to update
 * @param {object} updates - The fields to update
 * @param {string} userId - The UUID of the user requesting the update (for permission check)
 * @returns {Promise<{success: boolean, error: object|null}>} Result of the operation
 */
export const updateListing = async (listingId, updates, userId) => {
  try {
    // First, check if the user has permission to update this listing
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', listingId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching listing:', fetchError);
      return { success: false, error: fetchError };
    }
    
    // Check ownership - only the listing owner can update it
    if (listing.user_id !== userId) {
      return { 
        success: false, 
        error: { message: 'You do not have permission to update this listing' }
      };
    }
    
    // Update the listing
    const { error: updateError } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId);
      
    if (updateError) {
      console.error('Error updating listing:', updateError);
      return { success: false, error: updateError };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in updateListing:', error);
    return { success: false, error };
  }
}; 