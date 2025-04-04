# Supabase Backend Setup

This directory contains the database migrations for the Student Marketplace application. This README provides instructions for setting up the backend infrastructure.

## Getting Started

### Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- A Supabase project (free or paid)
- Node.js and npm

### Setup Instructions

1. **Initialize Supabase locally for development:**

```bash
supabase init
supabase start
```

2. **Apply migrations to your local Supabase instance:**

```bash
supabase db reset
```

This will apply all the migrations in this directory to your local Supabase instance.

3. **Deploy edge functions:**

```bash
supabase functions deploy
```

4. **Link to your remote Supabase project:**

```bash
supabase link --project-ref <your-project-reference>
```

5. **Push schema changes to production:**

```bash
supabase db push
```

6. **Deploy functions to production:**

```bash
supabase functions deploy --project-ref <your-project-reference>
```

## Database Structure

The Student Marketplace uses the following tables:

- `users` - User profiles linked to auth.users
- `categories` - Product categories
- `listings` - Items for sale
- `reviews` - User reviews and ratings
- `offers` - Purchase offers on listings
- `saved_listings` - User's saved/favorited listings
- `viewed_listings` - Recently viewed listings
- `conversations` - Message threads
- `conversation_participants` - Users in a conversation
- `messages` - Individual messages
- `notifications` - User notifications
- `broadcasts` - For real-time updates (used by edge functions)

## Edge Functions

The application uses the following Supabase Edge Functions:

1. **analytics.js** - Provides data analytics for users, listings, and marketplace trends
2. **realtime-handler.js** - Handles real-time updates for listings, messages, and offers
3. **index.js** - General purpose functions including payment processing and search

## Row Level Security (RLS)

The database uses Row Level Security to ensure that users can only access data they are authorized to see. For example:

- Users can only see their own messages and conversations
- Sellers can only update their own listings
- Anyone can view available listings, but only the owner can view pending or sold listings
- Only the receiver can see their own notifications

## Creating New Migrations

To create a new migration:

```bash
supabase migration new <migration-name>
```

This will create a new timestamped SQL file in the migrations directory. Edit this file to make your database changes.

## Troubleshooting

- **Database connection issues**: Check your .env file for correct Supabase URL and key
- **Function deployment failures**: Ensure you have the latest Supabase CLI version
- **Missing tables**: Verify that all migrations have been applied with `supabase db reset`
- **RLS policy errors**: Check permissions in the SQL schema file

## Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase CLI Reference](https://supabase.io/docs/reference/cli)
- [Edge Functions Documentation](https://supabase.io/docs/guides/functions) 