-- Add promotion fields to listings table
ALTER TABLE IF EXISTS listings
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS promotion_status TEXT DEFAULT 'none' CHECK (promotion_status IN ('none', 'pending', 'approved', 'rejected'));

-- Create a view for featured listings
CREATE OR REPLACE VIEW featured_listings AS
SELECT l.*, u.name as seller_name, u.university as seller_university, c.name as category_name
FROM listings l
JOIN users u ON l.user_id = u.id
LEFT JOIN categories c ON l.category_id = c.id
WHERE l.status = 'available' 
AND l.is_featured = true 
AND (l.promotion_status = 'approved')
AND (l.promotion_expires_at IS NULL OR l.promotion_expires_at > NOW());

-- Create a view for priority listings
CREATE OR REPLACE VIEW priority_listings AS
SELECT l.*, u.name as seller_name, u.university as seller_university, c.name as category_name
FROM listings l
JOIN users u ON l.user_id = u.id
LEFT JOIN categories c ON l.category_id = c.id
WHERE l.status = 'available' 
AND l.is_priority = true 
AND (l.promotion_status = 'approved')
AND (l.promotion_expires_at IS NULL OR l.promotion_expires_at > NOW());

-- Create a function to get featured listings
CREATE OR REPLACE FUNCTION get_featured_listings(limit_count INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price DECIMAL,
  images TEXT[],
  condition TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  seller_name TEXT,
  seller_university TEXT,
  category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id, 
    l.title, 
    l.price, 
    l.images, 
    l.condition, 
    l.created_at,
    l.user_id,
    u.name as seller_name,
    u.university as seller_university,
    c.name as category_name
  FROM listings l
  JOIN users u ON l.user_id = u.id
  LEFT JOIN categories c ON l.category_id = c.id
  WHERE l.status = 'available' 
    AND l.is_featured = true 
    AND (l.promotion_status = 'approved')
    AND (l.promotion_expires_at IS NULL OR l.promotion_expires_at > NOW())
  ORDER BY l.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set promotion status to 'pending' when promotion options are set
CREATE OR REPLACE FUNCTION set_promotion_pending()
RETURNS TRIGGER AS $$
BEGIN
  -- If no promotion options set, status is none
  IF NEW.is_featured = false AND NEW.is_priority = false THEN
    NEW.promotion_status := 'none';
  -- If promotion status was none and now has promotions set, mark as pending
  ELSIF (OLD.promotion_status = 'none' OR OLD.promotion_status IS NULL) AND 
        (NEW.is_featured = true OR NEW.is_priority = true) THEN
    NEW.promotion_status := 'pending';
  -- If promotion settings changed and previously approved, set back to pending
  ELSIF OLD.promotion_status = 'approved' AND
        ((OLD.is_featured <> NEW.is_featured) OR (OLD.is_priority <> NEW.is_priority)) THEN
    NEW.promotion_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_listing_promotion_pending
BEFORE UPDATE ON listings
FOR EACH ROW
WHEN (OLD.is_featured IS DISTINCT FROM NEW.is_featured OR
      OLD.is_priority IS DISTINCT FROM NEW.is_priority)
EXECUTE FUNCTION set_promotion_pending();

-- Apply the same trigger for new listings
CREATE TRIGGER set_new_listing_promotion_pending
BEFORE INSERT ON listings
FOR EACH ROW
WHEN (NEW.is_featured = true OR NEW.is_priority = true)
EXECUTE FUNCTION set_promotion_pending(); 