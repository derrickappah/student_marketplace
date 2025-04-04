-- Listings Table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  condition TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'pending', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view available listings" ON listings 
  FOR SELECT USING (status = 'available' OR user_id = auth.uid());
CREATE POLICY "Users can insert own listings" ON listings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON listings 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listings" ON listings 
  FOR DELETE USING (auth.uid() = user_id);

-- Create timestamp update trigger
CREATE TRIGGER update_listings_timestamp
BEFORE UPDATE ON listings
FOR EACH ROW EXECUTE PROCEDURE update_timestamp(); 