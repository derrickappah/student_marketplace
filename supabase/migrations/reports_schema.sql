-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Check that at least one reportable item is specified
ALTER TABLE reports ADD CONSTRAINT check_reportable_item 
  CHECK (
    (reported_user_id IS NOT NULL) OR 
    (listing_id IS NOT NULL) OR 
    (message_id IS NOT NULL)
  );

-- Set up Row Level Security for Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view reports they've made" ON reports 
  FOR SELECT USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports 
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Admins can view and manage all reports (will be applied via application logic)
-- CREATE POLICY "Admins can view all reports" ON reports 
--   FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- Reports timestamp trigger
CREATE TRIGGER update_reports_timestamp
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE PROCEDURE update_timestamp(); 