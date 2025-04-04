-- Realtime Offers and Offer Notifications
-- This migration adds trigger functions for creating notifications when offers are created or updated

-- Function to create an offer notification
CREATE OR REPLACE FUNCTION create_offer_notification(
  receiver_id UUID,
  offer_id UUID,
  notification_type TEXT,
  custom_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offer_record RECORD;
  listing_title TEXT;
  buyer_name TEXT;
  seller_name TEXT;
  message_text TEXT;
  new_notification_id UUID;
  result JSONB;
BEGIN
  -- Basic validation
  IF receiver_id IS NULL OR offer_id IS NULL OR notification_type IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Required parameters missing'
    );
  END IF;
  
  -- Get offer details
  SELECT o.*,
         l.title as listing_title,
         b.name as buyer_name,
         s.name as seller_name
  INTO offer_record
  FROM offers o
  JOIN listings l ON o.listing_id = l.id
  JOIN users b ON o.buyer_id = b.id
  JOIN users s ON o.seller_id = s.id
  WHERE o.id = offer_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Offer not found'
    );
  END IF;
  
  -- Create appropriate message text based on notification type
  IF custom_message IS NOT NULL THEN
    message_text := custom_message;
  ELSE
    CASE notification_type
      WHEN 'new_offer' THEN
        message_text := 'New offer of $' || offer_record.amount || ' for "' || offer_record.listing_title || '" from ' || offer_record.buyer_name;
      WHEN 'offer_accepted' THEN
        message_text := 'Your offer of $' || offer_record.amount || ' for "' || offer_record.listing_title || '" was accepted';
      WHEN 'offer_declined' THEN
        message_text := 'Your offer of $' || offer_record.amount || ' for "' || offer_record.listing_title || '" was declined';
      WHEN 'offer_updated' THEN
        message_text := 'Offer updated for "' || offer_record.listing_title || '"';
      ELSE
        message_text := 'Update regarding your offer for "' || offer_record.listing_title || '"';
    END CASE;
  END IF;
  
  -- Determine the notification type for the database
  CASE notification_type
    WHEN 'new_offer' THEN
      notification_type := 'offer';
    WHEN 'offer_accepted', 'offer_declined', 'offer_updated' THEN
      notification_type := 'offer_response';
    ELSE
      notification_type := 'offer';
  END CASE;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id,
    type,
    message,
    read,
    is_seen,
    listing_id,
    created_at,
    sender_id,  -- Use the sender as the other party in the offer
    preview     -- Include offer amount as preview
  ) VALUES (
    receiver_id,
    notification_type,
    message_text,
    FALSE,
    FALSE,
    offer_record.listing_id,
    NOW(),
    CASE 
      WHEN receiver_id = offer_record.seller_id THEN offer_record.buyer_id
      ELSE offer_record.seller_id
    END,
    '$' || offer_record.amount::TEXT || ' - ' || 
    CASE WHEN offer_record.message IS NOT NULL AND LENGTH(offer_record.message) > 0
         THEN SUBSTRING(offer_record.message, 1, 50) || CASE WHEN LENGTH(offer_record.message) > 50 THEN '...' ELSE '' END
         ELSE 'No message included'
    END
  )
  RETURNING id INTO new_notification_id;
  
  -- Return success response
  result := jsonb_build_object(
    'success', TRUE,
    'notification_id', new_notification_id,
    'receiver_id', receiver_id,
    'offer_id', offer_id,
    'created_at', NOW()
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_offer_notification(UUID, UUID, TEXT, TEXT) TO authenticated;

-- Trigger function for new offers
CREATE OR REPLACE FUNCTION offer_notification_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For a new offer, notify the seller
  IF TG_OP = 'INSERT' THEN
    PERFORM create_offer_notification(
      NEW.seller_id,  -- Receiver is the seller
      NEW.id,         -- Offer ID
      'new_offer'     -- Notification type
    );
  
  -- For an updated offer with status change, notify the buyer
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'accepted' THEN
      PERFORM create_offer_notification(
        NEW.buyer_id,      -- Receiver is the buyer
        NEW.id,            -- Offer ID
        'offer_accepted'   -- Notification type
      );
    ELSIF NEW.status = 'declined' THEN
      PERFORM create_offer_notification(
        NEW.buyer_id,      -- Receiver is the buyer
        NEW.id,            -- Offer ID
        'offer_declined'   -- Notification type
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_offer_change ON offers;
CREATE TRIGGER on_offer_change
AFTER INSERT OR UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION offer_notification_trigger();

-- Add a function to subscribe to offers (for real-time updates)
CREATE OR REPLACE FUNCTION subscribe_to_user_offers(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF user_uuid IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User ID is required'
    );
  END IF;
  
  -- This is just a helper function to make it easier for client code
  -- to know what to subscribe to - it doesn't actually perform any 
  -- database operations but returns the channel info
  
  result := jsonb_build_object(
    'success', TRUE,
    'user_id', user_uuid,
    'channel', 'offers:user=' || user_uuid::TEXT,
    'table', 'offers',
    'filter', 'buyer_id=eq.' || user_uuid::TEXT || ',seller_id=eq.' || user_uuid::TEXT,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.subscribe_to_user_offers(UUID) TO authenticated; 