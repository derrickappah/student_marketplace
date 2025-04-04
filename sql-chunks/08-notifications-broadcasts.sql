-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'offer', 'offer_response', 'review', 'listing_status')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Set up Row Level Security (RLS) for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark notifications as read" ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- Broadcasts table for realtime updates
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel TEXT NOT NULL,
  payload JSONB NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Set up Row Level Security (RLS) for broadcasts
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view broadcasts" ON broadcasts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create broadcasts" ON broadcasts 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 