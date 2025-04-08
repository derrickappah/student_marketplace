-- Messaging System Database Schema

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group'))
);

-- Create trigger to update updated_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_timestamp
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Conversation participants table - junction table 
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  has_attachments BOOLEAN DEFAULT FALSE,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL
);

-- Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update conversation last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at, updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Function to create a new conversation
CREATE OR REPLACE FUNCTION create_conversation(
  creator_id UUID,
  participant_ids UUID[],
  initial_message TEXT DEFAULT NULL,
  listing_id UUID DEFAULT NULL,
  conversation_title TEXT DEFAULT NULL,
  conversation_type TEXT DEFAULT 'direct'
)
RETURNS JSON AS $$
DECLARE
  new_conversation_id UUID;
  message_id UUID;
  participant_id UUID;
  conversation_data JSON;
BEGIN
  -- Create the conversation
  INSERT INTO conversations (title, listing_id, type)
  VALUES (conversation_title, listing_id, conversation_type)
  RETURNING id INTO new_conversation_id;
  
  -- Add the creator as a participant
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (new_conversation_id, creator_id);
  
  -- Add other participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    -- Skip if participant is the creator (already added)
    IF participant_id <> creator_id THEN
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (new_conversation_id, participant_id);
    END IF;
  END LOOP;
  
  -- Add initial message if provided
  IF initial_message IS NOT NULL AND initial_message <> '' THEN
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (new_conversation_id, creator_id, initial_message)
    RETURNING id INTO message_id;
  END IF;
  
  -- Get conversation data to return
  SELECT json_build_object(
    'id', c.id,
    'title', c.title,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'listing_id', c.listing_id,
    'type', c.type,
    'participants', (
      SELECT json_agg(
        json_build_object(
          'user_id', cp.user_id,
          'joined_at', cp.joined_at,
          'user', json_build_object(
            'id', u.id,
            'name', u.name,
            'avatar_url', u.avatar_url,
            'email', u.email
          )
        )
      )
      FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.conversation_id = c.id
    ),
    'messages', (
      SELECT json_agg(
        json_build_object(
          'id', m.id,
          'content', m.content,
          'created_at', m.created_at,
          'sender_id', m.sender_id,
          'has_attachments', m.has_attachments
        )
      )
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at ASC
    )
  )
  FROM conversations c
  WHERE c.id = new_conversation_id
  INTO conversation_data;
  
  RETURN conversation_data;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function if it exists to avoid return type error
DROP FUNCTION IF EXISTS mark_conversation_as_read(UUID, UUID);

-- Function to mark a conversation as read for a user
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  user_id UUID,
  conversation_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE user_id = mark_conversation_as_read.user_id
  AND conversation_id = mark_conversation_as_read.conversation_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for the messaging tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY conversation_select_policy ON conversations
  FOR SELECT
  USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Conversation participants policies
CREATE POLICY conversation_participants_select_policy ON conversation_participants
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY conversation_participants_insert_policy ON conversation_participants
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR 
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY messages_select_policy ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY messages_insert_policy ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Message attachments policies
CREATE POLICY message_attachments_select_policy ON message_attachments
  FOR SELECT
  USING (
    message_id IN (
      SELECT id 
      FROM messages
      WHERE conversation_id IN (
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY message_attachments_insert_policy ON message_attachments
  FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id 
      FROM messages
      WHERE sender_id = auth.uid()
    )
  ); 