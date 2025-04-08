-- Migration to create the user_status table if it doesn't exist

-- Create the user_status table
CREATE TABLE IF NOT EXISTS user_status (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline',
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default status for users who don't have one
INSERT INTO user_status (user_id, status)
SELECT id, 'offline' FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_status us WHERE us.user_id = u.id)
ON CONFLICT DO NOTHING;

-- Add RLS policies for the user_status table
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- Allow users to read any user's status
CREATE POLICY "Anyone can read user status" ON user_status
FOR SELECT USING (true);

-- Allow users to update only their own status
CREATE POLICY "Users can update their own status" ON user_status
FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to insert their own status
CREATE POLICY "Users can insert their own status" ON user_status
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_status TO authenticated;

-- Add comment to document the table
COMMENT ON TABLE user_status IS 'Stores user online/offline status for messaging features';