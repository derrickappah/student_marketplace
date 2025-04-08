# Messaging System Backend Setup

This directory contains scripts and SQL needed to set up the messaging system backend in your Supabase database.

## Database Schema

The messaging system consists of the following tables:

1. **conversations** - Stores conversation metadata
2. **conversation_participants** - Junction table linking users to conversations
3. **messages** - Stores individual messages in conversations
4. **message_attachments** - Stores attachments for messages

Plus several stored procedures, triggers, and policies for proper functionality.

## Setting Up

### Prerequisites

1. A Supabase project with:
   - `uuid-ossp` extension enabled
   - Users table already set up
   - Service role API key available

2. Node.js installed on your system

3. Environment variables in your `.env` file:
   - `REACT_APP_SUPABASE_URL`: Your Supabase project URL
   - `REACT_APP_SUPABASE_SERVICE_KEY`: Your Supabase service role API key

### Setup Process

1. Install required dependencies:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. Create the `exec_sql` function in your Supabase database:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the following SQL:

   ```sql
   -- Create function to execute SQL statements via RPC
   CREATE OR REPLACE FUNCTION exec_sql(sql text)
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER -- Runs with privileges of the function creator
   AS $$
   BEGIN
     EXECUTE sql;
   END;
   $$;
   ```

3. Run the database setup script:
   ```bash
   node src/db/apply_messaging_schema.js
   ```

## Storage Setup

The messaging system also needs a Supabase Storage bucket for file attachments:

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket named `message-attachments`
4. Set the bucket's privacy to "Private"
5. Add RLS policies:

   ```sql
   -- Allow users to upload attachments
   CREATE POLICY "Users can upload their own message attachments"
   ON storage.objects FOR INSERT 
   WITH CHECK (
     bucket_id = 'message-attachments' AND
     auth.uid() = (storage.foldername(name))[1]::uuid
   );

   -- Allow users to view attachments they have access to
   CREATE POLICY "Users can view message attachments in their conversations"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'message-attachments' AND
     EXISTS (
       SELECT 1 FROM conversation_participants cp
       JOIN messages m ON m.conversation_id = cp.conversation_id
       JOIN message_attachments ma ON ma.message_id = m.id
       WHERE cp.user_id = auth.uid() AND ma.url LIKE '%' || name
     )
   );
   ```

## Common Errors and Solutions

### Function Return Type Error

If you encounter an error like:
```
ERROR: 42P13: cannot change return type of existing function
HINT: Use DROP FUNCTION mark_conversation_as_read(uuid,uuid) first.
```

This happens because you already have a function with the same name but a different return type. There are two ways to fix this:

1. **The schema already includes the fix**: A `DROP FUNCTION IF EXISTS` statement has been added before function creation.

2. **Manual fix**: If you still encounter the error, you can manually run:
   ```sql
   DROP FUNCTION IF EXISTS mark_conversation_as_read(uuid, uuid);
   ```
   
   Then run the setup script again.

### Other Database Errors

If you encounter other database errors during setup, you can:

1. Check your database logs in the Supabase dashboard
2. Run individual SQL statements manually to isolate the problem
3. Ensure all prerequisites are met, particularly the existence of the users table and uuid-ossp extension

## Testing the Setup

You can verify your setup by:

1. Creating a conversation between two users
2. Sending messages in that conversation 
3. Checking that the messages appear for both users
4. Uploading an attachment and verifying it's accessible

## Troubleshooting

If you encounter errors during setup:

1. Check that all required tables are created properly:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' AND 
         table_name IN ('conversations', 'conversation_participants', 'messages', 'message_attachments');
   ```

2. Verify RLS policies are in place:
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE tablename IN ('conversations', 'conversation_participants', 'messages', 'message_attachments');
   ```

3. Check that the stored procedures are created:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_type = 'FUNCTION' AND 
         routine_schema = 'public' AND
         routine_name IN ('create_conversation', 'mark_conversation_as_read', 'update_conversation_timestamp', 'update_conversation_last_message');
   ``` 