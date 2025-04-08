# Messaging System Implementation Guide

This document provides implementation guidelines and best practices for developers working on the messaging system.

## Development Setup

### Environment Requirements

1. **Node.js**: Version 16+ recommended
2. **NPM/Yarn**: For package management
3. **Supabase CLI**: For local development and migrations
4. **Git**: For version control
5. **React Developer Tools**: Browser extension for debugging

### Local Development

1. **Environment Variables**:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Supabase Local Development**:
   ```bash
   supabase start
   ```

## Code Organization

### Directory Structure

- `/src/components/messaging/`: UI components for messaging
- `/src/contexts/MessagingContext.js`: State management for messaging
- `/src/services/supabase.js`: API methods for Supabase operations
- `/src/hooks/useConversation.js`: Custom hooks for conversation operations

### Key Files

- `MessagingContext.js`: Central state management for messaging
- `ConversationList.js`: Component for displaying conversations
- `ConversationThread.js`: Component for displaying messages
- `MessageComposer.js`: Component for message input
- `AttachmentUploader.js`: Component for file attachments

## Core Functionality Implementation

### Creating a New Conversation

```javascript
// Inside a component
const { user } = useAuth();
const { createConversation } = useMessaging();

const startConversation = async (otherUserId, listingId) => {
  try {
    const result = await createConversation({
      participants: [user.id, otherUserId],
      listingId,
      metadata: { title: 'About your listing' }
    });
    
    if (result.data) {
      // Navigate to the new conversation
      navigate(`/messages/${result.data.id}`);
    }
  } catch (error) {
    console.error('Failed to create conversation:', error);
    // Show error notification
  }
};
```

### Sending Messages

```javascript
// Inside a component
const { sendMessage } = useMessaging();
const [content, setContent] = useState('');
const [files, setFiles] = useState([]);

const handleSend = async () => {
  if (!content.trim() && files.length === 0) return;
  
  try {
    await sendMessage(conversationId, content, files);
    setContent('');
    setFiles([]);
  } catch (error) {
    console.error('Failed to send message:', error);
    // Show error notification
  }
};
```

### Loading Messages

```javascript
// Inside a component
const { activeConversation, setActiveConversation, loading } = useMessaging();
const { id } = useParams(); // React Router param for conversation ID

useEffect(() => {
  const loadConversation = async () => {
    try {
      await setActiveConversation(id);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      // Show error notification
    }
  };
  
  if (id && (!activeConversation || activeConversation.id !== id)) {
    loadConversation();
  }
  
  return () => {
    // Clean up subscriptions
  };
}, [id, activeConversation, setActiveConversation]);
```

### Handling Attachments

```javascript
// Inside a component
const { uploadAttachment } = useMessaging();

const handleFileUpload = async (files) => {
  try {
    const uploadPromises = Array.from(files).map(file => 
      uploadAttachment(file, conversationId)
    );
    
    const results = await Promise.all(uploadPromises);
    // Add attachment preview to UI
    return results.map(r => r.url);
  } catch (error) {
    console.error('Failed to upload attachments:', error);
    // Show error notification
    return [];
  }
};
```

## Supabase Database Setup

### Setting Up RLS Policies

```sql
-- Allow users to select messages only from conversations they participate in
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Allow users to insert messages only into conversations they participate in
CREATE POLICY "Users can insert messages into their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );
```

### Database Functions

```sql
-- Function to send a message to a conversation
CREATE OR REPLACE FUNCTION send_message_to_conversation(
  conv_id UUID,
  message_content TEXT,
  message_images TEXT[] DEFAULT NULL,
  reply_to_message_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_message_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Verify user is part of conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;
  
  -- Insert new message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    reply_to_message_id,
    has_attachments
  ) VALUES (
    conv_id,
    current_user_id,
    message_content,
    reply_to_message_id,
    message_images IS NOT NULL AND array_length(message_images, 1) > 0
  ) RETURNING id INTO new_message_id;
  
  -- Update conversation timestamp
  UPDATE conversations
  SET updated_at = now()
  WHERE id = conv_id;
  
  -- Insert attachments if provided
  IF message_images IS NOT NULL AND array_length(message_images, 1) > 0 THEN
    INSERT INTO message_attachments (
      message_id,
      type,
      url,
      filename,
      size
    )
    SELECT
      new_message_id,
      CASE 
        WHEN lower(url) LIKE '%.jpg' OR lower(url) LIKE '%.jpeg' OR lower(url) LIKE '%.png' OR lower(url) LIKE '%.gif' THEN 'image'
        ELSE 'file'
      END,
      url,
      split_part(url, '/', -1),
      0 -- Size not available at this point
    FROM unnest(message_images) AS url;
  END IF;
  
  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Real-time Features Implementation

### Subscribing to Messages

```javascript
// Inside MessagingContext.js
const subscribeToMessages = (conversationId) => {
  if (!user || !conversationId) return null;
  
  const channel = supabase
    .channel(`messages:conversation=${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        // Process new message
        const newMessage = payload.new;
        
        // Update conversations state with new message
        setConversations((prevConversations) => {
          return prevConversations.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: [...(conv.messages || []), newMessage],
                latestMessage: newMessage,
                updated_at: newMessage.created_at
              };
            }
            return conv;
          });
        });
        
        // Update active conversation if viewing this one
        if (activeConversation?.id === conversationId) {
          setActiveConversation((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...(prev.messages || []), newMessage]
            };
          });
        }
      }
    )
    .subscribe();
  
  return channel;
};
```

### Typing Indicators

```javascript
// Inside MessagingContext.js
const sendTypingIndicator = async (conversationId, isTyping) => {
  if (!user || !conversationId) return;
  
  try {
    const typingChannel = supabase.channel(`typing:conversation=${conversationId}`);
    
    // Broadcast typing state
    await typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.id,
        is_typing: isTyping,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
  }
};
```

## Testing

### Unit Tests

```javascript
// Example test for sendMessage function
import { renderHook, act } from '@testing-library/react-hooks';
import { useMessaging } from '../contexts/MessagingContext';
import { supabase } from '../supabaseClient';

// Mock Supabase
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis(),
    then: jest.fn()
  }
}));

describe('useMessaging hook', () => {
  test('sendMessage should insert a new message and update state', async () => {
    // Setup
    const mockMessage = {
      id: 'msg-123',
      conversation_id: 'conv-123',
      content: 'Test message',
      created_at: new Date().toISOString(),
      sender_id: 'user-123'
    };
    
    supabase.rpc.mockImplementation(() => Promise.resolve({
      data: mockMessage.id,
      error: null
    }));
    
    // Execute
    const { result } = renderHook(() => useMessaging());
    
    await act(async () => {
      await result.current.sendMessage(
        mockMessage.conversation_id,
        mockMessage.content
      );
    });
    
    // Verify
    expect(supabase.rpc).toHaveBeenCalledWith(
      'send_message_to_conversation',
      expect.objectContaining({
        conv_id: mockMessage.conversation_id,
        message_content: mockMessage.content
      })
    );
  });
});
```

### Integration Tests

```javascript
// Test for conversation interaction
test('User can send and receive messages in a conversation', async () => {
  // Setup: create test users and conversation
  
  // Render the conversation component
  render(<ConversationThread conversationId="test-conv-id" />);
  
  // Type a message
  const input = screen.getByPlaceholderText('Type a message...');
  fireEvent.change(input, { target: { value: 'Hello world' } });
  
  // Send the message
  const sendButton = screen.getByText('Send');
  fireEvent.click(sendButton);
  
  // Verify message appears in the thread
  await waitFor(() => {
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
  
  // Simulate receiving a response
  act(() => {
    // Trigger the subscription callback with a new message
    const newMessageEvent = {
      new: {
        id: 'response-123',
        conversation_id: 'test-conv-id',
        content: 'Hi there!',
        created_at: new Date().toISOString(),
        sender_id: 'other-user-id'
      }
    };
    
    // Call the subscription callback directly
    // This would normally be done by Supabase
    // mockSubscriptionCallback(newMessageEvent);
  });
  
  // Verify response appears
  await waitFor(() => {
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues and Solutions

#### Message Not Appearing in Real-time

1. **Check WebSocket Connection**:
   - Verify Supabase channel subscription status
   - Check browser console for connection errors

2. **Verify RLS Policies**:
   - Ensure user has permission to view the conversation
   - Check for policy conflicts or restrictions

3. **Debug Solution**:
   ```javascript
   // Add this to verify subscription
   console.log('Channel status:', channel.state);
   
   // Try reconnecting manually
   if (channel.state !== 'SUBSCRIBED') {
     channel.subscribe();
   }
   ```

#### File Upload Failures

1. **Check Storage Bucket Configuration**:
   - Verify permissions on bucket
   - Check file size limits

2. **Debug Solution**:
   ```javascript
   // Log detailed upload errors
   const { data, error } = await supabase.storage
     .from('message-attachments')
     .upload(filePath, file);
   
   if (error) {
     console.error('Upload details:', {
       filePath,
       fileType: file.type,
       fileSize: file.size,
       error: error.message
     });
   }
   ```

## Performance Guidelines

1. **Optimize Renders**:
   - Use memoization for components (`React.memo`, `useMemo`, `useCallback`)
   - Implement virtualized lists for long conversations

2. **Database Queries**:
   - Use indexes on `conversation_id`, `created_at` fields
   - Keep join complexity to a minimum

3. **Real-time Efficiency**:
   - Throttle typing indicators (300ms minimum)
   - Use specific channel subscriptions only when viewing a conversation
   - Clean up subscriptions when leaving a conversation

## Security Best Practices

1. **Data Validation**:
   - Sanitize user inputs on client and server
   - Implement message content restrictions (length, content)

2. **User Authentication**:
   - Verify user session before any operation
   - Check permissions for each conversation access

3. **File Security**:
   - Validate file types before upload
   - Generate unique, non-guessable file paths
   - Use signed URLs with expiration for access

## Deployment Checklist

1. **Pre-Deployment**:
   - Run all tests
   - Optimize bundle size
   - Check for security vulnerabilities

2. **Database**:
   - Apply migrations
   - Verify indexes and constraints
   - Test RLS policies

3. **Monitoring**:
   - Set up error tracking
   - Configure performance monitoring
   - Implement usage analytics 