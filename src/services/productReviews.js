import { supabase } from '../supabaseClient';

// Get the average rating and count of reviews for a specific product/listing
export const getProductRating = async (listingId) => {
  try {
    console.log(`Getting rating for listing: ${listingId}`);
    
    // Try with review_type first
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('listing_id', listingId)
        .eq('review_type', 'product'); // Only consider product reviews
      
      if (!error) {
        // No error means review_type column exists, proceed normally
        // Calculate average rating
        if (data && data.length > 0) {
          const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = totalRating / data.length;
          return { 
            rating: parseFloat(averageRating.toFixed(1)), 
            count: data.length, 
            error: null 
          };
        }
        
        return { rating: 0, count: 0, error: null };
      }
    } catch (firstTryError) {
      console.warn('Error in first try with review_type filter:', firstTryError);
      // Continue to fallback
    }
    
    // Fallback: if review_type doesn't exist, just get all reviews for this listing
    console.log('Falling back to query without review_type');
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('listing_id', listingId);
    
    if (error) throw error;
    
    // Calculate average rating
    if (data && data.length > 0) {
      const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / data.length;
      return { 
        rating: parseFloat(averageRating.toFixed(1)), 
        count: data.length, 
        error: null 
      };
    }
    
    return { rating: 0, count: 0, error: null };
  } catch (err) {
    console.error('Error in getProductRating:', err);
    return { rating: 0, count: 0, error: err.message };
  }
};

// Get all product reviews for a specific listing
export const getProductReviews = async (listingId) => {
  try {
    console.log(`Fetching product reviews for listing ${listingId}`);
    
    // First try with review_type filter
    let reviews = [];
    let error = null;
    
    try {
      // First get the reviews without joins to avoid select issues
      const result = await supabase
        .from('reviews')
        .select('*')
        .eq('listing_id', listingId)
        .eq('review_type', 'product')
        .order('created_at', { ascending: false });
      
      if (!result.error) {
        // No error means review_type column exists
        reviews = result.data || [];
        error = result.error;
      } else {
        console.warn('Error using review_type filter:', result.error);
        throw new Error('Need to try fallback');
      }
    } catch (firstTryError) {
      // Fallback: try without review_type filter
      console.log('Falling back to query without review_type');
      const fallbackResult = await supabase
        .from('reviews')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });
      
      reviews = fallbackResult.data || [];
      error = fallbackResult.error;
    }
    
    if (error) {
      console.error('Error fetching product reviews:', error);
      throw error;
    }
    
    if (reviews.length === 0) {
      return { data: [], error: null };
    }
    
    // Get all unique reviewer IDs
    const reviewerIds = [...new Set(reviews.map(review => review.reviewer_id))];
    
    // Fetch reviewer data separately
    const { data: reviewers, error: reviewersError } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', reviewerIds);
    
    if (reviewersError) {
      console.error('Error fetching reviewer details:', reviewersError);
      // Return reviews without reviewer info if there's an error
      return { data: reviews, error: null };
    }
    
    // Map the reviewer data to each review
    const enrichedReviews = reviews.map(review => {
      const reviewer = reviewers?.find(r => r.id === review.reviewer_id);
      return {
        ...review,
        reviewer: reviewer || null
      };
    });
    
    return { data: enrichedReviews || [], error: null };
  } catch (err) {
    console.error('Unexpected error in getProductReviews:', err);
    return { data: [], error: err.message };
  }
};

// Check if a user has already reviewed a specific product/listing
export const hasUserReviewedProduct = async (listingId, userId) => {
  try {
    if (!userId) return false;
    
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('listing_id', listingId)
      .eq('reviewer_id', userId)
      .eq('review_type', 'product')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error('Error checking if user reviewed product:', error);
      throw error;
    }
    
    return !!data; // Returns true if a review exists, false otherwise
  } catch (err) {
    console.error('Unexpected error in hasUserReviewedProduct:', err);
    return false;
  }
};

// Get a user's review for a specific product/listing
export const getUserProductReview = async (listingId, userId) => {
  try {
    if (!userId) return { data: null, error: 'User not authenticated' };
    
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', listingId)
      .eq('reviewer_id', userId)
      .eq('review_type', 'product')
      .maybeSingle();

    if (error) {
      console.error('Error fetching user product review:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in getUserProductReview:', err);
    return { data: null, error: err.message };
  }
};

// Update a product review
export const updateProductReview = async (reviewId, { rating, comment }) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      throw new Error('You must be logged in to update a review');
    }
    
    // First check if the user is the author of the review
    const { data: existingReview, error: reviewError } = await supabase
      .from('reviews')
      .select('reviewer_id')
      .eq('id', reviewId)
      .single();
      
    if (reviewError) throw reviewError;
    if (!existingReview) throw new Error('Review not found');
    if (existingReview.reviewer_id !== userData.user.id) {
      throw new Error('You can only edit your own reviews');
    }
    
    // Now update the review
    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating,
        comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId);
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (err) {
    console.error('Error updating product review:', err);
    return { data: null, error: err.message };
  }
};

// Delete a product review
export const deleteProductReview = async (reviewId) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      throw new Error('You must be logged in to delete a review');
    }
    
    // First check if the user is the author of the review
    const { data: existingReview, error: reviewError } = await supabase
      .from('reviews')
      .select('reviewer_id')
      .eq('id', reviewId)
      .single();
      
    if (reviewError) throw reviewError;
    if (!existingReview) throw new Error('Review not found');
    if (existingReview.reviewer_id !== userData.user.id) {
      throw new Error('You can only delete your own reviews');
    }
    
    // Now delete the review
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Error deleting product review:', err);
    return { success: false, error: err.message };
  }
};