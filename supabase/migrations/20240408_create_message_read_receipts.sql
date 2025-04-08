-- Create message_read_receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own read receipts" ON message_read_receipts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own read receipts" ON message_read_receipts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert read receipts" ON message_read_receipts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating the timestamp
CREATE TRIGGER update_message_read_receipts_timestamp
BEFORE UPDATE ON message_read_receipts
FOR EACH ROW EXECUTE PROCEDURE update_timestamp(); 