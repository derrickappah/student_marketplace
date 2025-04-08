# Messaging System Sequence Diagrams

## Core User Interactions

This document provides sequence diagrams that illustrate the key interactions within the messaging system.

### Message Sending Sequence

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Context as Messaging Context
    participant Client as Supabase Client
    participant Realtime as Supabase Realtime
    participant DB as PostgreSQL DB
    participant Recipient

    User->>UI: Composes message
    UI->>Context: sendMessage(convId, content, files)
    
    alt Has Attachments
        Context->>Client: Upload files to storage
        Client->>DB: Store in attachments bucket
        DB-->>Client: Return file URLs
    end
    
    Context->>Client: Call RPC function
    Client->>DB: send_message_to_conversation(...)
    Note over DB: Insert message & update timestamp
    DB-->>Client: Return message ID
    
    Context->>Context: Update local state (optimistic)
    Context-->>UI: Return success status
    UI-->>User: Show message in thread
    
    DB->>Realtime: Broadcast INSERT event
    Realtime->>Recipient: Send message to subscribers
    Recipient->>Recipient: Update conversation UI
    Recipient->>DB: Update read status
    DB->>Realtime: Broadcast status change
    Realtime->>Context: Deliver read receipt
    Context->>UI: Update message status
    UI->>User: Display read receipt
```

### Conversation Loading Sequence

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Context as Messaging Context
    participant Client as Supabase Client
    participant DB as PostgreSQL DB
    participant Realtime as Supabase Realtime

    User->>UI: Navigate to messages
    UI->>Context: fetchConversations()
    Context->>Client: Query conversation_participants
    Client->>DB: SELECT with user_id filter
    DB-->>Client: Return participant data
    
    Context->>Client: Query conversations with join
    Client->>DB: SELECT with detailed data
    DB-->>Client: Return conversations
    
    Context->>Context: Process conversation data
    Context-->>UI: Update state with conversations
    UI-->>User: Display conversation list
    
    User->>UI: Select conversation
    UI->>Context: setActiveConversation(id)
    Context->>Client: Query detailed messages
    Client->>DB: SELECT messages with attachments
    DB-->>Client: Return message data
    
    Context->>Context: Process message data
    Context-->>UI: Update state with messages
    UI-->>User: Display message thread
    
    Context->>Client: Subscribe to channels
    Client->>Realtime: Create channel subscriptions
    Note over Client,Realtime: Messages, typing, presence
    
    Context->>Client: Mark as read
    Client->>DB: Update read status
    DB->>Realtime: Broadcast read status
    Realtime->>Client: Notify original sender
```

### Typing Indicator Sequence

```mermaid
sequenceDiagram
    participant User1
    participant UI1 as User1 UI
    participant Context1 as User1 Messaging Context
    participant Realtime as Supabase Realtime
    participant Context2 as User2 Messaging Context
    participant UI2 as User2 UI
    participant User2

    User1->>UI1: Starts typing
    UI1->>Context1: handleTyping(true)
    
    Note over Context1: Throttle (300ms)
    Context1->>Realtime: Broadcast typing event
    Realtime->>Context2: Deliver typing event
    
    Context2->>Context2: Update typing state
    Context2->>UI2: Show typing indicator
    UI2->>User2: Display "User1 is typing..."
    
    User1->>UI1: Stops typing
    Note over UI1: After idle timeout
    UI1->>Context1: handleTyping(false)
    Context1->>Realtime: Broadcast stopped typing
    Realtime->>Context2: Deliver stopped typing
    
    Context2->>Context2: Update typing state
    Context2->>UI2: Hide typing indicator
    UI2->>User2: Remove typing indicator
```

### Attachment Handling Sequence

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Context as Messaging Context
    participant Storage as Supabase Storage
    participant Client as Supabase Client
    participant DB as PostgreSQL DB
    participant Recipient

    User->>UI: Select files to upload
    UI->>Context: uploadAttachment(file, convId)
    
    Context->>Storage: Upload file
    Storage-->>Context: Return file URL
    
    User->>UI: Send message with attachments
    UI->>Context: sendMessage(convId, text, [fileUrl])
    Context->>Client: Call RPC function
    
    Client->>DB: Insert message with has_attachments=true
    Client->>DB: Insert attachment records
    DB-->>Client: Return message ID
    
    Context->>Context: Update local state
    Context-->>UI: Return success status
    UI-->>User: Show message with attachment
    
    DB->>Recipient: Broadcast message event
    Recipient->>Storage: Request file with signed URL
    Storage-->>Recipient: Return file content
    Recipient-->>User: Display attachment
```

## Authentication and Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Auth as Auth Context
    participant Supabase as Supabase Auth
    participant RLS as Row Level Security
    participant DB as Database

    User->>UI: Login credentials
    UI->>Auth: Login(email, password)
    Auth->>Supabase: signInWithPassword
    Supabase-->>Auth: Return JWT & user data
    Auth->>Auth: Store session
    Auth-->>UI: Authentication successful
    
    User->>UI: Access messages
    UI->>DB: Query conversations
    Note over DB,RLS: RLS validates token
    RLS->>RLS: Check user_id in participants
    RLS-->>DB: Allow/deny access
    DB-->>UI: Return allowed data only
    
    User->>UI: Send message
    UI->>DB: Insert message
    RLS->>RLS: Verify conversation access
    RLS-->>DB: Allow/deny operation
    DB-->>UI: Confirm operation result
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Context as Messaging Context
    participant Client as Supabase Client
    participant DB as Database

    User->>UI: Send message
    UI->>Context: sendMessage(convId, content)
    Context->>Client: API call
    
    alt Network Error
        Client--xContext: Connection failed
        Context->>Context: Queue message locally
        Context-->>UI: Show network error
        UI-->>User: Display "Message queued for sending"
        
        Note over Context: When connection restored
        Context->>Client: Retry API call
        Client->>DB: Process message
        DB-->>Client: Success response
        Client-->>Context: Update status
        Context-->>UI: Update UI
        UI-->>User: Show "Message sent"
    
    else Permission Error
        Client->>DB: Attempt operation
        DB--xClient: Permission denied
        Client-->>Context: Return error
        Context-->>UI: Show permission error
        UI-->>User: Display "Not authorized"
    
    else Database Error
        Client->>DB: Attempt operation
        DB--xClient: Database constraint error
        Client-->>Context: Return error details
        Context-->>UI: Show specific error
        UI-->>User: Display helpful message
    end
```

## Offline Support Sequence

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Context as Messaging Context
    participant Storage as Local Storage
    participant Network as Network Monitor
    participant Client as Supabase Client
    participant DB as Database

    Network->>Context: Connection lost event
    Context->>UI: Update network status
    UI-->>User: Show offline indicator
    
    User->>UI: Send message while offline
    UI->>Context: sendMessage(convId, content)
    Context->>Context: Mark message as queued
    Context->>Storage: Store in offline queue
    Context-->>UI: Update with pending status
    UI-->>User: Show message as "Sending..."
    
    Network->>Context: Connection restored event
    Context->>Storage: Get queued messages
    Context->>Client: Send queued messages
    Client->>DB: Process messages
    DB-->>Client: Confirm processing
    Client-->>Context: Update message status
    Context->>Storage: Clear from queue
    Context-->>UI: Update message status
    UI-->>User: Show messages as "Sent"
```

## Real-time Presence Management

```mermaid
sequenceDiagram
    participant User1
    participant Context1 as User1 Messaging Context
    participant Presence as Supabase Presence
    participant Context2 as User2 Messaging Context
    participant User2

    User1->>Context1: Enter conversation
    Context1->>Presence: track(userId, status)
    Presence->>Presence: Store presence state
    Presence->>Context2: Sync presence event
    Context2->>Context2: Update online users
    Context2-->>User2: Show User1 is online
    
    Note over User1: Idle timeout
    Context1->>Presence: Update status to away
    Presence->>Context2: Sync presence event
    Context2-->>User2: Show User1 is away
    
    Note over User1: Close tab/app
    Context1->>Presence: Untrack (auto disconnect)
    Presence->>Context2: Sync presence event
    Context2-->>User2: Show User1 is offline
``` 