-- Saved Listings Table (Favorites)
CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, listing_id)
);

-- Set up Row Level Security (RLS) for saved listings
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved listings" ON saved_listings 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save listings" ON saved_listings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave listings" ON saved_listings 
  FOR DELETE USING (auth.uid() = user_id);

-- Viewed Listings Table (for recently viewed)
CREATE TABLE IF NOT EXISTS viewed_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, listing_id)
);

-- Set up Row Level Security (RLS) for viewed listings
ALTER TABLE viewed_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own viewed listings" ON viewed_listings 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can track viewed listings" ON viewed_listings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own viewed listings" ON viewed_listings 
  FOR UPDATE USING (auth.uid() = user_id); 