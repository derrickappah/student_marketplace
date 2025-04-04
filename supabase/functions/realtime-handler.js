// Realtime handler for WebSocket connections
import { createClient } from '@supabase/supabase-js';

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
    const { action, payload } = await req.json();

    // Process the appropriate action
    let result;
    switch (action) {
      case 'broadcast-listing-update':
        result = await broadcastListingUpdate(supabaseClient, payload);
        break;
      case 'notify-new-message':
        result = await notifyNewMessage(supabaseClient, payload);
        break;
      case 'notify-offer-update':
        result = await notifyOfferUpdate(supabaseClient, payload);
        break;
      default:
        throw new Error('Invalid action requested');
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

// Broadcast a listing update to all subscribers
async function broadcastListingUpdate(supabase, { listingId, updateType, details }) {
  try {
    // Validate the input
    if (!listingId || !updateType) {
      throw new Error('Missing required parameters');
    }

    // Get the listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('title, user_id')
      .eq('id', listingId)
      .single();

    if (listingError) {
      throw new Error('Error fetching listing details');
    }

    // Prepare the payload to broadcast
    const broadcastPayload = {
      type: updateType,
      listing_id: listingId,
      listing_title: listing.title,
      details,
      timestamp: new Date().toISOString()
    };

    // Broadcast to the listing's channel
    const broadcastResult = await supabase
      .from('broadcasts')
      .insert({
        channel: `listing:${listingId}`,
        payload: broadcastPayload,
        sender_id: details.userId || null
      });

    if (broadcastResult.error) {
      throw new Error('Error broadcasting update');
    }

    return {
      success: true,
      message: `Broadcast sent to listing:${listingId}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in broadcastListingUpdate:', error);
    throw error;
  }
}

// Notify a user about a new message
async function notifyNewMessage(supabase, { conversationId, senderId, recipientId, message }) {
  try {
    // Validate the input
    if (!conversationId || !senderId || !recipientId) {
      throw new Error('Missing required parameters');
    }

    // Get the sender details
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('name')
      .eq('id', senderId)
      .single();

    if (senderError) {
      throw new Error('Error fetching sender details');
    }

    // Create a notification for the recipient
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'message',
        message: `New message from ${sender.name}: ${message?.substring(0, 50)}${message?.length > 50 ? '...' : ''}`,
        conversation_id: conversationId,
        read: false
      });

    if (notificationError) {
      throw new Error('Error creating notification');
    }

    // Broadcast to the user's personal channel
    const broadcastResult = await supabase
      .from('broadcasts')
      .insert({
        channel: `user:${recipientId}`,
        payload: {
          type: 'new_message',
          conversation_id: conversationId,
          sender_name: sender.name,
          sender_id: senderId,
          message_preview: message?.substring(0, 50),
          timestamp: new Date().toISOString()
        },
        sender_id: senderId
      });

    if (broadcastResult.error) {
      throw new Error('Error broadcasting message notification');
    }

    return {
      success: true,
      message: `Notification sent to user:${recipientId}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in notifyNewMessage:', error);
    throw error;
  }
}

// Notify a user about an offer update
async function notifyOfferUpdate(supabase, { offerId, updateType }) {
  try {
    // Validate the input
    if (!offerId || !updateType) {
      throw new Error('Missing required parameters');
    }

    // Get the offer details
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        amount,
        status,
        listings:listing_id(title)
      `)
      .eq('id', offerId)
      .single();

    if (offerError) {
      throw new Error('Error fetching offer details');
    }

    // Determine the recipient based on the update type
    let recipientId, message;
    
    if (updateType === 'new_offer') {
      recipientId = offer.seller_id;
      message = `New offer of $${offer.amount} for "${offer.listings.title}"`;
    } else if (updateType === 'offer_accepted') {
      recipientId = offer.buyer_id;
      message = `Your offer of $${offer.amount} for "${offer.listings.title}" was accepted`;
    } else if (updateType === 'offer_declined') {
      recipientId = offer.buyer_id;
      message = `Your offer of $${offer.amount} for "${offer.listings.title}" was declined`;
    } else {
      throw new Error('Invalid update type');
    }

    // Create a notification for the recipient
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'offer_response',
        message,
        listing_id: offer.listing_id,
        offer_id: offerId,
        read: false
      });

    if (notificationError) {
      throw new Error('Error creating notification');
    }

    // Broadcast to the user's personal channel
    const broadcastResult = await supabase
      .from('broadcasts')
      .insert({
        channel: `user:${recipientId}`,
        payload: {
          type: updateType,
          offer_id: offerId,
          listing_id: offer.listing_id,
          listing_title: offer.listings.title,
          amount: offer.amount,
          status: offer.status,
          timestamp: new Date().toISOString()
        },
        sender_id: updateType === 'new_offer' ? offer.buyer_id : offer.seller_id
      });

    if (broadcastResult.error) {
      throw new Error('Error broadcasting offer notification');
    }

    return {
      success: true,
      message: `Notification sent to user:${recipientId}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in notifyOfferUpdate:', error);
    throw error;
  }
} 