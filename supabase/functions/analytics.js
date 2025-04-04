// Analytics edge function for the student marketplace
import { createClient } from '@supabase/supabase-js';

// Request handler
export const serve = async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Get Supabase client from environment variables
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Parse request data
    const { type, userId, listingId, timeRange } = await req.json();

    // Process the appropriate analytics based on the request type
    let result;
    switch (type) {
      case 'user-activity':
        result = await getUserActivity(supabaseClient, userId, timeRange);
        break;
      case 'listing-views':
        result = await getListingViews(supabaseClient, listingId, timeRange);
        break;
      case 'listing-interests':
        result = await getListingInterests(supabaseClient, listingId);
        break;
      case 'marketplace-trends':
        result = await getMarketplaceTrends(supabaseClient, timeRange);
        break;
      default:
        throw new Error('Invalid analytics type requested');
    }

    // Return successful response
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Get statistics about a user's activity
async function getUserActivity(supabase, userId, timeRange = '30d') {
  // Convert timeRange to a Date object for filtering
  const startDate = getStartDateFromRange(timeRange);
  
  // Run queries in parallel for better performance
  const [
    { data: listingsData, error: listingsError },
    { data: offersData, error: offersError },
    { data: messagesData, error: messagesError },
    { data: viewsData, error: viewsError }
  ] = await Promise.all([
    // Count user's listings created in time range
    supabase
      .from('listings')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString()),
    
    // Count offers made by user in time range  
    supabase
      .from('offers')
      .select('id, status', { count: 'exact' })
      .eq('buyer_id', userId)
      .gte('created_at', startDate.toISOString()),
    
    // Count messages sent by user in time range
    supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('sender_id', userId)
      .gte('created_at', startDate.toISOString()),
    
    // Get view statistics for user's listings
    supabase
      .from('viewed_listings')
      .select('listing_id')
      .in('listing_id', supabase
        .from('listings')
        .select('id')
        .eq('user_id', userId)
      )
      .gte('viewed_at', startDate.toISOString())
  ]);
  
  // Check for errors
  if (listingsError || offersError || messagesError || viewsError) {
    throw new Error('Error fetching user activity data');
  }
  
  // Process offers data to get status counts
  const offerStatusCounts = {
    pending: 0,
    accepted: 0,
    declined: 0
  };
  
  if (offersData) {
    offersData.forEach(offer => {
      offerStatusCounts[offer.status]++;
    });
  }
  
  // Calculate unique listing views
  const uniqueListingViews = new Set();
  if (viewsData) {
    viewsData.forEach(view => {
      uniqueListingViews.add(view.listing_id);
    });
  }
  
  // Return the activity data
  return {
    timeRange,
    newListings: listingsData ? listingsData.length : 0,
    offersMade: offersData ? offersData.length : 0,
    offerStatus: offerStatusCounts,
    messagesSent: messagesData ? messagesData.length : 0,
    listingViews: viewsData ? viewsData.length : 0,
    uniqueListingsViewed: uniqueListingViews.size
  };
}

// Get statistics about a listing's views
async function getListingViews(supabase, listingId, timeRange = '30d') {
  const startDate = getStartDateFromRange(timeRange);
  
  // Get view data for the specific listing
  const { data, error } = await supabase
    .from('viewed_listings')
    .select('viewed_at, user_id')
    .eq('listing_id', listingId)
    .gte('viewed_at', startDate.toISOString())
    .order('viewed_at', { ascending: true });
  
  if (error) {
    throw new Error('Error fetching listing view data');
  }
  
  // Process data to get daily views and unique viewers
  const viewsByDay = {};
  const uniqueViewers = new Set();
  
  data.forEach(view => {
    const day = view.viewed_at.substring(0, 10); // YYYY-MM-DD format
    
    if (!viewsByDay[day]) {
      viewsByDay[day] = 0;
    }
    viewsByDay[day]++;
    
    uniqueViewers.add(view.user_id);
  });
  
  // Convert viewsByDay to array format for easier frontend processing
  const viewsTimeline = Object.entries(viewsByDay).map(([date, count]) => ({
    date,
    views: count
  }));
  
  return {
    timeRange,
    totalViews: data.length,
    uniqueViewers: uniqueViewers.size,
    viewsTimeline
  };
}

// Get data about interest in a listing (saves, offers, messages)
async function getListingInterests(supabase, listingId) {
  // Run queries in parallel
  const [
    { data: savesData, error: savesError },
    { data: offersData, error: offersError },
    { data: conversationsData, error: conversationsError }
  ] = await Promise.all([
    // Count saves for this listing
    supabase
      .from('saved_listings')
      .select('id', { count: 'exact' })
      .eq('listing_id', listingId),
    
    // Get offer data for this listing
    supabase
      .from('offers')
      .select('amount, status')
      .eq('listing_id', listingId),
    
    // Count conversations about this listing
    supabase
      .from('conversations')
      .select('id', { count: 'exact' })
      .eq('listing_id', listingId)
  ]);
  
  if (savesError || offersError || conversationsError) {
    throw new Error('Error fetching listing interest data');
  }
  
  // Process offers data
  let highestOffer = 0;
  let offerStatusCounts = {
    pending: 0,
    accepted: 0,
    declined: 0
  };
  
  if (offersData && offersData.length > 0) {
    offersData.forEach(offer => {
      if (offer.amount > highestOffer) {
        highestOffer = offer.amount;
      }
      offerStatusCounts[offer.status]++;
    });
  }
  
  return {
    saves: savesData ? savesData.length : 0,
    offers: offersData ? offersData.length : 0,
    highestOffer,
    offerStatus: offerStatusCounts,
    conversations: conversationsData ? conversationsData.length : 0
  };
}

// Get marketplace trend data
async function getMarketplaceTrends(supabase, timeRange = '30d') {
  const startDate = getStartDateFromRange(timeRange);
  
  // Run queries in parallel
  const [
    { data: categoryData, error: categoryError },
    { data: listingsData, error: listingsError },
    { data: offerData, error: offerError }
  ] = await Promise.all([
    // Get listings by category
    supabase
      .from('listings')
      .select(`
        id, 
        price,
        category_id,
        categories(name)
      `)
      .gte('created_at', startDate.toISOString()),
    
    // Get new listings over time
    supabase
      .from('listings')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true }),
    
    // Get offer acceptance rate
    supabase
      .from('offers')
      .select('status')
      .gte('created_at', startDate.toISOString())
  ]);
  
  if (categoryError || listingsError || offerError) {
    throw new Error('Error fetching marketplace trend data');
  }
  
  // Process category data
  const categoryCounts = {};
  const categoryPrices = {};
  
  if (categoryData) {
    categoryData.forEach(item => {
      const categoryName = item.categories?.name || 'Uncategorized';
      
      if (!categoryCounts[categoryName]) {
        categoryCounts[categoryName] = 0;
        categoryPrices[categoryName] = [];
      }
      
      categoryCounts[categoryName]++;
      categoryPrices[categoryName].push(item.price);
    });
  }
  
  // Calculate average prices per category
  const categoryAvgPrices = {};
  Object.entries(categoryPrices).forEach(([category, prices]) => {
    if (prices.length > 0) {
      const sum = prices.reduce((total, price) => total + price, 0);
      categoryAvgPrices[category] = sum / prices.length;
    }
  });
  
  // Process listing creation timeline
  const listingsByDay = {};
  
  if (listingsData) {
    listingsData.forEach(listing => {
      const day = listing.created_at.substring(0, 10); // YYYY-MM-DD format
      
      if (!listingsByDay[day]) {
        listingsByDay[day] = 0;
      }
      listingsByDay[day]++;
    });
  }
  
  // Process offer data
  const offerStatusCounts = {
    pending: 0,
    accepted: 0,
    declined: 0
  };
  
  if (offerData) {
    offerData.forEach(offer => {
      offerStatusCounts[offer.status]++;
    });
  }
  
  // Calculate offer acceptance rate
  const acceptanceRate = offerData && offerData.length > 0
    ? offerStatusCounts.accepted / offerData.length
    : 0;
  
  return {
    timeRange,
    listingsByCategory: Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count
    })),
    avgPriceByCategory: Object.entries(categoryAvgPrices).map(([category, avgPrice]) => ({
      category,
      avgPrice
    })),
    newListingsTimeline: Object.entries(listingsByDay).map(([date, count]) => ({
      date,
      count
    })),
    offerStats: {
      total: offerData ? offerData.length : 0,
      pending: offerStatusCounts.pending,
      accepted: offerStatusCounts.accepted,
      declined: offerStatusCounts.declined,
      acceptanceRate
    }
  };
}

// Helper function to convert a time range string to a Date object
function getStartDateFromRange(timeRange) {
  const now = new Date();
  const value = parseInt(timeRange);
  const unit = timeRange.charAt(timeRange.length - 1);
  
  switch (unit) {
    case 'd':
      now.setDate(now.getDate() - value);
      break;
    case 'w':
      now.setDate(now.getDate() - (value * 7));
      break;
    case 'm':
      now.setMonth(now.getMonth() - value);
      break;
    case 'y':
      now.setFullYear(now.getFullYear() - value);
      break;
    default:
      // Default to 30 days if invalid format
      now.setDate(now.getDate() - 30);
  }
  
  return now;
} 