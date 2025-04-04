-- Permanent solution for the ambiguous seller_id reference
-- This file creates database views with explicit table aliases for listings

-- 1. Create a view for listings with explicit table aliases to avoid ambiguity
CREATE OR REPLACE VIEW listings_with_details AS
SELECT 
  l.id,
  l.title,
  l.description,
  l.price,
  l.condition,
  l.status,
  l.created_at,
  l.updated_at,
  l.is_featured,
  l.is_priority,
  l.promotion_status,
  l.promotion_expires_at,
  l.images,
  l.user_id, -- explicit column from listings
  l.category_id,
  u.id AS seller_id, -- explicit seller_id with different name
  u.name AS seller_name,
  u.email AS seller_email,
  u.university AS seller_university,
  c.name AS category_name
FROM 
  listings l
JOIN 
  users u ON l.user_id = u.id
LEFT JOIN 
  categories c ON l.category_id = c.id;

-- 2. Create specialized views for featured and priority listings
CREATE OR REPLACE VIEW featured_listings_view AS
SELECT 
  l.id,
  l.title,
  l.description,
  l.price,
  l.condition,
  l.status,
  l.created_at,
  l.updated_at,
  l.is_featured,
  l.is_priority,
  l.promotion_status,
  l.promotion_expires_at,
  l.images,
  l.user_id, 
  l.category_id,
  u.id AS seller_id, 
  u.name AS seller_name,
  u.email AS seller_email,
  u.university AS seller_university,
  c.name AS category_name
FROM 
  listings l
JOIN 
  users u ON l.user_id = u.id
LEFT JOIN 
  categories c ON l.category_id = c.id
WHERE 
  l.status = 'available' 
  AND l.is_featured = true 
  AND (l.promotion_status = 'approved')
  AND (l.promotion_expires_at IS NULL OR l.promotion_expires_at > NOW());

CREATE OR REPLACE VIEW priority_listings_view AS
SELECT 
  l.id,
  l.title,
  l.description,
  l.price,
  l.condition,
  l.status,
  l.created_at,
  l.updated_at,
  l.is_featured,
  l.is_priority,
  l.promotion_status,
  l.promotion_expires_at,
  l.images,
  l.user_id, 
  l.category_id,
  u.id AS seller_id, 
  u.name AS seller_name,
  u.email AS seller_email,
  u.university AS seller_university,
  c.name AS category_name
FROM 
  listings l
JOIN 
  users u ON l.user_id = u.id
LEFT JOIN 
  categories c ON l.category_id = c.id
WHERE 
  l.status = 'available' 
  AND l.is_priority = true 
  AND (l.promotion_status = 'approved')
  AND (l.promotion_expires_at IS NULL OR l.promotion_expires_at > NOW());

-- 3. Create modified trigger function for handling promotion history
CREATE OR REPLACE FUNCTION update_promotion_history_fixed()
RETURNS TRIGGER AS $$
BEGIN
  -- If promotion status changed from 'none' to 'pending'
  IF OLD.promotion_status = 'none' AND NEW.promotion_status = 'pending' THEN
    -- Determine promotion type
    DECLARE
      promo_type TEXT;
    BEGIN
      IF NEW.is_featured AND NEW.is_priority THEN
        promo_type := 'both';
      ELSIF NEW.is_featured THEN
        promo_type := 'featured';
      ELSIF NEW.is_priority THEN
        promo_type := 'priority';
      ELSE
        promo_type := 'unknown';
      END IF;
      
      -- Insert new record to promotion history with explicit references
      INSERT INTO promotion_request_history (
        listing_id, 
        user_id, 
        promotion_type, 
        status, 
        requested_at
      ) VALUES (
        NEW.id,
        NEW.user_id, -- Use explicit user_id from listings to avoid ambiguity
        promo_type,
        'pending',
        NOW()
      );
    END;
  -- If promotion status changed from 'pending' to 'approved' or 'rejected'
  ELSIF OLD.promotion_status = 'pending' AND (NEW.promotion_status = 'approved' OR NEW.promotion_status = 'rejected') THEN
    -- Update existing record with explicit table qualifier
    UPDATE promotion_request_history
    SET 
      status = NEW.promotion_status,
      processed_at = NOW(),
      processed_by = auth.uid(),
      expires_at = NEW.promotion_expires_at
    WHERE 
      promotion_request_history.listing_id = NEW.id AND 
      promotion_request_history.status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Replace the existing trigger
DROP TRIGGER IF EXISTS promotion_history_trigger ON listings;
CREATE TRIGGER promotion_history_trigger_fixed
AFTER UPDATE ON listings
FOR EACH ROW
WHEN (OLD.promotion_status IS DISTINCT FROM NEW.promotion_status)
EXECUTE FUNCTION update_promotion_history_fixed();

-- 5. Admin function for safely approving promotions
CREATE OR REPLACE FUNCTION admin_safe_approve_promotion(
  in_listing_id UUID,
  in_exp_date TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
  admin_id UUID;
  listing_user_id UUID;
  is_featured_val BOOLEAN;
  is_priority_val BOOLEAN;
  promotion_type_val TEXT;
BEGIN
  -- Get the current admin user
  admin_id := auth.uid();
  
  -- Get the listing details first (including promotion settings)
  SELECT 
    user_id, is_featured, is_priority 
  INTO 
    listing_user_id, is_featured_val, is_priority_val
  FROM 
    listings 
  WHERE 
    id = in_listing_id;
  
  -- Determine promotion type for history
  IF is_featured_val AND is_priority_val THEN
    promotion_type_val := 'both';
  ELSIF is_featured_val THEN
    promotion_type_val := 'featured';
  ELSIF is_priority_val THEN
    promotion_type_val := 'priority';
  ELSE
    promotion_type_val := 'unknown';
  END IF;
  
  -- First, update the promotion history (this avoids trigger complexity)
  UPDATE promotion_request_history
  SET 
    status = 'approved',
    processed_at = NOW(),
    processed_by = admin_id,
    expires_at = in_exp_date
  WHERE 
    listing_id = in_listing_id AND 
    status = 'pending';
  
  -- If no record was found, create one
  IF NOT FOUND THEN
    INSERT INTO promotion_request_history (
      listing_id, 
      user_id, 
      promotion_type, 
      status, 
      requested_at,
      processed_at,
      processed_by,
      expires_at
    ) VALUES (
      in_listing_id,
      listing_user_id,
      promotion_type_val,
      'approved',
      NOW(),
      NOW(),
      admin_id,
      in_exp_date
    );
  END IF;
  
  -- Then update the listing with explicit column references
  UPDATE listings SET 
    promotion_status = 'approved',
    promotion_expires_at = in_exp_date
  WHERE 
    id = in_listing_id;
  
  RETURN TRUE;
  
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Admin function for safely rejecting promotions
CREATE OR REPLACE FUNCTION admin_safe_reject_promotion(
  in_listing_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  admin_id UUID;
  listing_user_id UUID;
  is_featured_val BOOLEAN;
  is_priority_val BOOLEAN;
  promotion_type_val TEXT;
BEGIN
  -- Get the current admin user
  admin_id := auth.uid();
  
  -- Get the listing details first
  SELECT 
    user_id, is_featured, is_priority 
  INTO 
    listing_user_id, is_featured_val, is_priority_val
  FROM 
    listings 
  WHERE 
    id = in_listing_id;
  
  -- Determine promotion type for history
  IF is_featured_val AND is_priority_val THEN
    promotion_type_val := 'both';
  ELSIF is_featured_val THEN
    promotion_type_val := 'featured';
  ELSIF is_priority_val THEN
    promotion_type_val := 'priority';
  ELSE
    promotion_type_val := 'unknown';
  END IF;
  
  -- First, update the promotion history (this avoids trigger complexity)
  UPDATE promotion_request_history
  SET 
    status = 'rejected',
    processed_at = NOW(),
    processed_by = admin_id
  WHERE 
    listing_id = in_listing_id AND 
    status = 'pending';
  
  -- If no record was found, create one
  IF NOT FOUND THEN
    INSERT INTO promotion_request_history (
      listing_id, 
      user_id, 
      promotion_type, 
      status, 
      requested_at,
      processed_at,
      processed_by
    ) VALUES (
      in_listing_id,
      listing_user_id,
      promotion_type_val,
      'rejected',
      NOW(),
      NOW(),
      admin_id
    );
  END IF;
  
  -- Then update the listing with explicit column references
  UPDATE listings SET 
    promotion_status = 'rejected',
    is_featured = false,
    is_priority = false
  WHERE 
    id = in_listing_id;
  
  RETURN TRUE;
  
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to these new functions
GRANT EXECUTE ON FUNCTION admin_safe_approve_promotion(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_safe_reject_promotion(UUID) TO authenticated; 