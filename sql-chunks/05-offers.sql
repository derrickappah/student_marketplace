-- Offers Table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own offers" ON offers 
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can insert offers" ON offers 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update offer status" ON offers 
  FOR UPDATE USING (auth.uid() = seller_id);

-- Create timestamp update trigger
CREATE TRIGGER update_offers_timestamp
BEFORE UPDATE ON offers
FOR EACH ROW EXECUTE PROCEDURE update_timestamp(); 