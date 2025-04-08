-- Add review_type column to reviews table
ALTER TABLE reviews
ADD COLUMN review_type TEXT DEFAULT 'seller' CHECK (review_type IN ('seller', 'product'));

-- Update existing reviews to have the default type 'seller'
UPDATE reviews
SET review_type = 'seller'
WHERE review_type IS NULL;

-- Add an index to improve query performance when filtering by review_type
CREATE INDEX idx_reviews_review_type ON reviews(review_type);

-- Add a unique constraint to ensure one review per user per product per review type
CREATE UNIQUE INDEX idx_unique_user_product_review_type ON reviews(reviewer_id, listing_id, review_type) WHERE listing_id IS NOT NULL;