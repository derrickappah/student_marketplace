-- SQL script to create a test promotion request
-- This will allow us to verify that the promotion statistics are working

-- Check if we need to create test listings
DO $$
DECLARE
  listing_count INT;
BEGIN
  -- Check how many pending or approved listings we have
  SELECT COUNT(*) INTO listing_count 
  FROM listings 
  WHERE promotion_status IN ('pending', 'approved');
  
  -- Only create test data if we don't have any listings with promotions
  IF listing_count = 0 THEN
    -- Create test listings with promotion statuses
    INSERT INTO listings (
      id,
      title,
      description,
      price,
      status,
      condition,
      user_id,
      created_at,
      promotion_status,
      is_featured,
      is_priority
    ) VALUES (
      -- We'll use a direct admin account ID that should already exist
      gen_random_uuid(),
      'Test Listing with Promotion',
      'This is a test listing to verify promotion statistics',
      99.99,
      'available',
      'new',
      (SELECT id FROM users WHERE role = 'admin' LIMIT 1), -- Use an existing admin user
      NOW(),
      'pending',
      true,   -- Featured promotion
      false   -- Not priority
    );

    -- Create another test listing with a different promotion type
    INSERT INTO listings (
      id,
      title,
      description,
      price,
      status,
      condition,
      user_id,
      created_at,
      promotion_status,
      is_featured,
      is_priority
    ) VALUES (
      gen_random_uuid(),
      'Another Test Listing',
      'This is another test listing with priority promotion',
      149.99,
      'available',
      'like_new',
      (SELECT id FROM users WHERE role = 'admin' LIMIT 1), -- Use an existing admin user
      NOW(),
      'pending',
      false,   -- Not featured
      true     -- Priority promotion
    );

    -- Create a third test listing with both promotion types
    INSERT INTO listings (
      id,
      title,
      description,
      price,
      status,
      condition,
      user_id,
      created_at,
      promotion_status,
      is_featured,
      is_priority
    ) VALUES (
      gen_random_uuid(),
      'Premium Test Listing',
      'This test listing has both promotion types',
      199.99,
      'available',
      'good',
      (SELECT id FROM users WHERE role = 'admin' LIMIT 1), -- Use an existing admin user
      NOW(),
      'approved',  -- Already approved
      true,        -- Featured
      true         -- Priority
    );
    
    RAISE NOTICE 'Created 3 test listings with promotions';
  ELSE
    RAISE NOTICE 'Test data already exists, skipping creation';
  END IF;
END $$; 