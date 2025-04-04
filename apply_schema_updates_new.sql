-- LISTING PROMOTION SYSTEM MIGRATION
-- This migration adds the necessary tables, columns and functions for the listing promotion system

-- Step 1: Add promotion fields to listings table if they don't exist
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS promotion_status TEXT DEFAULT 'none';

-- Step 2: Add check constraint for promotion_status if it doesn't have one already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'listings_promotion_status_check'
  ) THEN
    ALTER TABLE listings 
    ADD CONSTRAINT listings_promotion_status_check 
    CHECK (promotion_status IN ('none', 'pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Step 3: Create a function to automatically expire promotions
CREATE OR REPLACE FUNCTION expire_listing_promotions()
RETURNS TRIGGER AS $$
BEGIN
  -- If promotion has expired, reset the promotion status
  IF NEW.promotion_expires_at IS NOT NULL AND NEW.promotion_expires_at < NOW() THEN
    NEW.is_featured := false;
    NEW.is_priority := false;
    NEW.promotion_status := 'none';
    NEW.promotion_expires_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically check for expired promotions on update
DROP TRIGGER IF EXISTS check_promotion_expiry ON listings;
CREATE TRIGGER check_promotion_expiry
BEFORE UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION expire_listing_promotions();

-- Step 5: Create a scheduled job to expire promotions (runs daily)
CREATE OR REPLACE FUNCTION process_expired_promotions()
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET 
    is_featured = false,
    is_priority = false,
    promotion_status = 'none',
    promotion_expires_at = NULL
  WHERE promotion_status = 'approved'
    AND promotion_expires_at < NOW();
    
  -- Return the number of affected rows
  RAISE NOTICE 'Expired % promotions', FOUND;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Ensure notifications table exists with required fields
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  related_id UUID,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE
);

-- Add index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
-- Add index on type for filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
-- Add index on read status
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Step 7: Create trigger function for notifications when promotion status changes
CREATE OR REPLACE FUNCTION notify_promotion_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if there's a change in promotion_status
  IF OLD.promotion_status IS DISTINCT FROM NEW.promotion_status THEN
    -- When a promotion is approved
    IF NEW.promotion_status = 'approved' THEN
      INSERT INTO notifications (
        user_id,
        message,
        type,
        related_id,
        listing_id
      ) VALUES (
        NEW.user_id,
        'Your promotion request for "' || NEW.title || '" has been approved!',
        'promotion',
        NEW.id,
        NEW.id
      );
    -- When a promotion is rejected
    ELSIF NEW.promotion_status = 'rejected' THEN
      INSERT INTO notifications (
        user_id,
        message,
        type,
        related_id,
        listing_id
      ) VALUES (
        NEW.user_id,
        'Your promotion request for "' || NEW.title || '" has been declined.',
        'promotion',
        NEW.id,
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for promotion notifications
DROP TRIGGER IF EXISTS promotion_notification_trigger ON listings;
CREATE TRIGGER promotion_notification_trigger
AFTER UPDATE ON listings
FOR EACH ROW
WHEN (OLD.promotion_status IS DISTINCT FROM NEW.promotion_status)
EXECUTE FUNCTION notify_promotion_status_change();

-- Step 9: Add function to get pending promotion counts for admin dashboard
CREATE OR REPLACE FUNCTION get_pending_promotion_counts()
RETURNS jsonb AS $$
DECLARE
  total_count integer;
  featured_count integer;
  priority_count integer;
BEGIN
  -- Get total count of pending promotions
  SELECT COUNT(*)
  INTO total_count
  FROM listings
  WHERE promotion_status = 'pending';
  
  -- Get count of pending featured promotions
  SELECT COUNT(*)
  INTO featured_count
  FROM listings
  WHERE promotion_status = 'pending' AND requested_featured = true;
  
  -- Get count of pending priority promotions
  SELECT COUNT(*)
  INTO priority_count
  FROM listings
  WHERE promotion_status = 'pending' AND requested_priority = true;
  
  -- Return counts as JSON
  RETURN jsonb_build_object(
    'total', total_count,
    'featured', featured_count,
    'priority', priority_count
  );
END;
$$ LANGUAGE plpgsql;

-- Check and enable RLS on listings table if needed
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled 
  FROM pg_class 
  WHERE relname = 'listings' AND relkind = 'r';
  
  IF NOT rls_enabled THEN
    ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check and create policies only if they don't exist
DO $$
BEGIN
  -- Everyone can view available listings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view available listings'
      AND tablename = 'listings'
  ) THEN
    CREATE POLICY "Anyone can view available listings" ON listings
      FOR SELECT
      USING (status = 'available');
  END IF;

  -- Users can manage their own listings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own listings'
      AND tablename = 'listings'
  ) THEN
    CREATE POLICY "Users can manage their own listings" ON listings
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;

  -- Admins can manage all listings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all listings'
      AND tablename = 'listings'
  ) THEN
    CREATE POLICY "Admins can manage all listings" ON listings
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Check and enable RLS on notifications table if needed
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled 
  FROM pg_class 
  WHERE relname = 'notifications' AND relkind = 'r';
  
  IF NOT rls_enabled THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check and create notification policies only if they don't exist
DO $$
BEGIN
  -- Users can only see their own notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own notifications'
      AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications" ON notifications
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Admins can see all notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all notifications'
      AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Admins can manage all notifications" ON notifications
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$; 