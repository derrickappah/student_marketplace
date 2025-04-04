export const adminDeleteListing = async (listingId) => {
  try {
    // First, get the listing to record details in the audit log
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (fetchError) throw fetchError;
    
    // Use a basic direct SQL query through RPC to avoid ambiguity
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `DELETE FROM listings WHERE id = '${listingId}'`
    });
    
    if (error) {
      // If the RPC fails, try a direct deletion with additional qualifying filter
      console.log('Falling back to direct deletion');
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        // Add this line to explicitly specify the columns we're referring to
        .eq('user_id', listing.user_id);
        
      if (deleteError) throw deleteError;
    }
    
    return { success: true, listing };
  } catch (error) {
    console.error('Error in adminDeleteListing:', error);
    return { success: false, error };
  }
}; 