# Messaging System Architecture Documentation

## Overview

The messaging system provides real-time communication capabilities between buyers and sellers on the student marketplace platform. It enables users to exchange messages, share attachments, see typing indicators, read receipts, and maintain conversation history.

## System Architecture

### Architecture Diagram

```
┌───────────────────┐    ┌──────────────────────┐    ┌───────────────────┐
│                   │    │                      │    │                   │
│  React Frontend   │◄──►│  Supabase Realtime   │◄──►│  PostgreSQL DB    │
│  Components       │    │  WebSocket Server    │    │  (via Supabase)   │
│                   │    │                      │    │                   │
└───────────────────┘    └──────────────────────┘    └───────────────────┘
         ▲                         ▲                          ▲
         │                         │                          │
         │                         │                          │
         ▼                         ▼                          ▼
┌───────────────────┐    ┌──────────────────────┐    ┌───────────────────┐
│                   │    │                      │    │                   │
│  Context Providers│    │  Supabase Client     │    │  Supabase Storage │
│  (Messaging, Auth)│    │  API Interface       │    │  (Attachments)    │
│                   │    │                      │    │                   │
└───────────────────┘    └──────────────────────┘    └───────────────────┘
```

### Technology Stack

- **Frontend**: React with Material-UI (MUI) components
- **State Management**: React Context API (MessagingContext, AuthContext)
- **Backend**: Supabase (BaaS - Backend as a Service)
- **Database**: PostgreSQL (via Supabase)
- **Real-time Communication**: Supabase Realtime (WebSocket)
- **File Storage**: Supabase Storage

## Core Components

### 1. Frontend Layer

#### React Components
- **Conversation List**: Displays all active conversations
- **Conversation Thread**: Shows messages within a conversation
- **Message Composer**: Interface for typing and sending messages
- **Attachment Handling**: UI for uploading and viewing attachments
- **Typing Indicators**: Shows when other users are typing
- **Read Receipts**: Visual indication of message status

#### Context Providers
- **MessagingContext**: Central state management for messaging features
- **AuthContext**: User authentication and profile information

### 2. Backend Layer

#### Supabase Client API
- **Authentication**: User identity management
- **Database Operations**: CRUD operations on conversations and messages
- **Realtime Subscriptions**: WebSocket connections for real-time updates
- **Storage Operations**: Handling file uploads and retrievals

#### Supabase Database
- **Tables**: conversations, conversation_participants, messages, message_attachments
- **RLS Policies**: Row-level security for data access control
- **Stored Procedures**: For complex operations that require server-side processing

### 3. Communication Layer

#### Supabase Realtime Channels
- **Message Channels**: For new message notifications
- **Typing Channels**: For typing indicator broadcasts
- **Presence Channels**: For online/offline status tracking

## Data Models

### Conversations
```sql
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  listing_id uuid references listings(id) on delete set null,
  metadata jsonb default '{}'::jsonb
);
```

### Conversation Participants
```sql
create table conversation_participants (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default now() not null,
  role text not null check (role in ('buyer', 'seller')),
  last_read_message_id uuid references messages(id) on delete set null,
  notifications_enabled boolean default true not null,
  unique(conversation_id, user_id)
);
```

### Messages
```sql
create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text,
  created_at timestamp with time zone default now() not null,
  status text default 'sent' check (status in ('sending', 'sent', 'delivered', 'read', 'failed')),
  reply_to_message_id uuid references messages(id) on delete set null,
  has_attachments boolean default false not null
);
```

### Message Attachments
```sql
create table message_attachments (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid references messages(id) on delete cascade not null,
  type text not null check (type in ('image', 'file', 'audio')),
  url text not null,
  filename text not null,
  size integer not null,
  metadata jsonb default '{}'::jsonb
);
```

## Data Flow

### Message Sending Flow

1. **User Composes Message**:
   - User enters message text and/or selects attachments
   - Client validates input (non-empty content, file size limits)

2. **Message Queue Processing**:
   - Message is stored in local state with 'sending' status
   - UI immediately shows message with 'sending' indicator
   - If offline, message is queued for later sending

3. **API Request**:
   - Client sends message data to Supabase
   - For attachments, files are first uploaded to Storage bucket
   - Message record is created with references to attachments

4. **Server Processing**:
   - Supabase validates user permissions via RLS
   - Message is inserted into database
   - 'updated_at' timestamp is updated on conversation

5. **Realtime Broadcast**:
   - Database change triggers Supabase Realtime
   - Event is broadcast to conversation channel subscribers
   - Message is delivered to other participant's client

6. **Receipt Handling**:
   - Recipient's client updates message status to 'delivered'
   - When message is viewed, status is updated to 'read'
   - Read status is broadcast back to sender

### Conversation Loading Flow

1. **Initial Load**:
   - On app start/navigation, fetch user's conversations
   - Query joined with participants and latest messages
   - Sort by most recent activity

2. **Conversation Selection**:
   - When user selects conversation, fetch detailed message history
   - Paginate messages (most recent first, load older as needed)
   - Subscribe to realtime channels for the conversation

3. **Real-time Updates**:
   - New messages arrive via WebSocket subscription
   - Typing indicators and presence are updated in real-time
   - Conversation list is updated to reflect new activity

## Optimizations

### Performance Optimizations

1. **Message Pagination**:
   - Limit initial message load to most recent 50 messages
   - Implement infinite scroll to load older messages
   - Store message cache to reduce database queries

2. **Attachment Handling**:
   - Generate and store image thumbnails for faster previews
   - Implement progressive loading for larger files
   - Use signed URLs with expiry for secure access

3. **Realtime Throttling**:
   - Throttle typing indicator events (300ms)
   - Batch update conversation list instead of per-message
   - Use local state optimistically before server confirmation

### Offline Support

1. **Message Queuing**:
   - Store outgoing messages in localStorage when offline
   - Attempt to send queued messages when connection restored
   - Show offline indicator in UI

2. **State Persistence**:
   - Cache conversation data in localStorage/IndexedDB
   - Implement versioning for data synchronization
   - Allow reading previously loaded messages when offline

## Security Considerations

1. **Data Access Control**:
   - Row-Level Security (RLS) policies ensure users can only access their conversations
   - Validate user identity for each database operation
   - Prevent access across conversation boundaries

2. **File Security**:
   - Validate file types and scan for malware
   - Use signed URLs with short expiry for attachments
   - Limit file sizes and implement upload quotas

3. **Privacy**:
   - Allow users to delete their own messages
   - Implement conversation archiving
   - Respect user notification preferences

## Monitoring and Observability

1. **Error Tracking**:
   - Log message delivery failures
   - Track WebSocket connection stability
   - Monitor attachment upload success rates

2. **Performance Metrics**:
   - Measure message delivery latency
   - Track conversation load times
   - Monitor API response times

3. **User Engagement**:
   - Track message volume by conversation
   - Measure user response times
   - Monitor feature usage (attachments, etc.)

## Implemented Components

| Component | Implementation Status | Details |
|-----------|------------------------|---------|
| Basic Messaging | Completed | Text messages with timestamps |
| Conversations | Completed | Multi-participant threads with history |
| Attachments | Completed | Image and file sharing capabilities |
| Typing Indicators | Completed | Real-time typing status broadcasts |
| Read Receipts | Completed | Message status tracking |
| Presence | Completed | Online/offline status tracking |
| Message Search | Planned | Full-text search across conversations |
| Voice Messages | Future Enhancement | Audio recording and playback |

## Future Enhancements

1. **Rich Media Support**:
   - Embed media players for video/audio files
   - Support for code snippets with syntax highlighting
   - Location sharing with map integration

2. **Advanced Features**:
   - Message translation
   - Scheduled messages
   - Message reactions with emoji
   - Group conversations for multi-party negotiations

3. **Integration Enhancements**:
   - Integration with notification system for push notifications
   - Calendar integration for scheduling meetings
   - Payment integration for in-chat transactions 