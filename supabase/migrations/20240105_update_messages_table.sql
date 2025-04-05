-- Add additional columns to the messages table
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS message_images TEXT[],
  ADD COLUMN IF NOT EXISTS read_status TEXT DEFAULT 'sent' CHECK (read_status IN ('sent', 'delivered', 'read')),
  ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Create message_attachments table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create message_read_receipts table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'delivered' CHECK (status IN ('delivered', 'read')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(message_id, user_id)
);

-- Set up Row Level Security for new tables
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Define policies for message attachments
CREATE POLICY "Users can view message attachments for their conversations" ON message_attachments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN messages m ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_attachments.message_id AND cp.user_id = auth.uid()
    )
  );

-- Define policies for message read receipts
CREATE POLICY "Users can view read receipts for their conversations" ON message_read_receipts 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN messages m ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_read_receipts.message_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own read receipts" ON message_read_receipts 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their own read receipts" ON message_read_receipts 
  FOR UPDATE USING (
    auth.uid() = user_id
  ); 