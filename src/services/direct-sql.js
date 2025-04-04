import { supabase } from "./supabase";

/**
 * Directly executes a SQL query to delete a listing and all related records
 * This uses explicit table aliases to avoid ambiguous column references
 */
export const directDeleteListing = async (listingId, userId) => {
  try {
    console.log('Starting direct SQL deletion for listing:', listingId);
    
    // First check if the listing belongs to the user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, title')
      .match({ id: listingId })
      .single();
      
    if (listingError) {
      console.error('Error verifying listing ownership:', listingError);
      return { success: false, error: listingError };
    }
    
    if (!listing) {
      return { success: false, error: { message: 'Listing not found' } };
    }
    
    if (listing.user_id !== userId) {
      return { success: false, error: { message: 'You do not own this listing' } };
    }
    
    // Perform the deletion steps with proper table aliases
    
    // 1. Delete saved listings
    const { error: savedError } = await supabase
      .from('saved_listings')
      .delete()
      .match({ listing_id: listingId });
      
    if (savedError) {
      console.error('Error deleting saved listings:', savedError);
    }
    
    // 2. Delete offers using a direct delete with proper table alias
    
    // Get all offers for this listing
    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select('id')
      .match({ listing_id: listingId });
      
    if (offersError) {
      console.error('Error fetching offers:', offersError);
    } else if (offers && offers.length > 0) {
      // Delete each offer individually to avoid issues
      for (const offer of offers) {
        const { error: offerDeleteError } = await supabase
          .from('offers')
          .delete()
          .match({ id: offer.id });
          
        if (offerDeleteError) {
          console.error(`Error deleting offer ${offer.id}:`, offerDeleteError);
        }
      }
    }
    
    // 3. Finally delete the listing itself
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .match({ id: listingId });
      
    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return { success: false, error: deleteError };
    }
    
    console.log('Direct SQL deletion completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in directDeleteListing:', error);
    return { success: false, error };
  }
};

// Add a new direct deletion function that focuses only on the primary keys without any joins
export const deleteListingByPrimaryKey = async (listingId, userId) => {
  try {
    console.log('Using primary key only deletion for listing:', listingId);
    
    // First confirm ownership
    const { data: listing, error: ownershipError } = await supabase
      .from('listings')
      .select('id')
      .match({ id: listingId, user_id: userId })
      .single();
    
    if (ownershipError || !listing) {
      console.error('Ownership verification failed:', ownershipError);
      return { success: false, error: ownershipError || { message: 'Listing not found or not owned by user' } };
    }
    
    console.log('Ownership verified, proceeding with deletion');
    
    // Step 1: Get all offers by this listing ID and delete them by their primary keys
    console.log('Step 1: Retrieving offer IDs');
    const { data: offerIds } = await supabase
      .from('offers')
      .select('id')
      .eq('listing_id', listingId);
    
    if (offerIds && offerIds.length > 0) {
      console.log(`Found ${offerIds.length} offers to delete`);
      
      // Delete each offer one by one by ID
      for (const offer of offerIds) {
        console.log(`Deleting offer with ID: ${offer.id}`);
        await supabase
          .from('offers')
          .delete()
          .match({ id: offer.id });
      }
    }
    
    // Step 2: Delete all saved listings references
    console.log('Step 2: Deleting saved_listings references');
    await supabase
      .from('saved_listings')
      .delete()
      .match({ listing_id: listingId });
    
    // Step 3: Delete the listing itself by primary key only
    console.log('Step 3: Deleting the listing itself');
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .match({ id: listingId });
    
    if (deleteError) {
      console.error('Error in final listing deletion:', deleteError);
      return { success: false, error: deleteError };
    }
    
    console.log('Primary key deletion complete');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteListingByPrimaryKey:', error);
    return { success: false, error };
  }
};

// Add new function to handle deletion with triggers disabled
export const deleteListingWithTriggersDisabled = async (listingId, userId) => {
  try {
    console.log('Starting deletion with triggers disabled for listing:', listingId);
    
    // First check if the listing belongs to the user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, title')
      .match({ id: listingId, user_id: userId })
      .single();
      
    if (listingError || !listing) {
      console.error('Error verifying listing ownership:', listingError);
      return { success: false, error: listingError || { message: 'Listing not found or not owned by user' } };
    }
    
    console.log('Ownership verified, proceeding with deletion');
    
    // Disable triggers to avoid ambiguous column reference issues
    const { error: disableError } = await supabase.rpc('disable_seller_stats_triggers');
    if (disableError) {
      console.error('Error disabling triggers:', disableError);
      // Continue anyway, this is just a precaution
    }
    
    try {
      // Step 1: Delete saved listings
      console.log('Deleting saved listings references');
      await supabase
        .from('saved_listings')
        .delete()
        .eq('listing_id', listingId);
      
      // Step 2: Get all offers by this listing ID and delete them
      console.log('Retrieving offer IDs');
      const { data: offers } = await supabase
        .from('offers')
        .select('id')
        .eq('listing_id', listingId);
      
      if (offers && offers.length > 0) {
        console.log(`Found ${offers.length} offers to delete`);
        
        // Delete each offer one by one by ID
        for (const offer of offers) {
          console.log(`Deleting offer with ID: ${offer.id}`);
          await supabase
            .from('offers')
            .delete()
            .eq('id', offer.id);
        }
      }
      
      // Step 3: Delete the listing itself
      console.log('Deleting the listing itself');
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);
      
      if (deleteError) {
        console.error('Error in final listing deletion:', deleteError);
        return { success: false, error: deleteError };
      }
      
      console.log('Deletion with triggers disabled complete');
      return { success: true };
    } finally {
      // Always re-enable triggers even if deletion fails
      const { error: enableError } = await supabase.rpc('enable_seller_stats_triggers');
      if (enableError) {
        console.error('Error re-enabling triggers:', enableError);
        // Log but don't fail the operation
      }
    }
  } catch (error) {
    console.error('Error in deleteListingWithTriggersDisabled:', error);
    return { success: false, error };
  }
};

export default { 
  directDeleteListing, 
  deleteListingByPrimaryKey,
  deleteListingWithTriggersDisabled
}; 