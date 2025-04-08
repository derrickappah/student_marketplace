-- Add updated_at field to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL;

-- Create trigger for updating the timestamp
CREATE TRIGGER update_messages_timestamp
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE PROCEDURE update_timestamp(); 