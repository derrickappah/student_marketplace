-- Function to trigger edge function for message notifications
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  channel_name TEXT;
  service_role_key TEXT;
  supabase_url TEXT;
BEGIN
  -- Broadcast to all participants in the conversation channel
  channel_name := 'messages:conversation=' || NEW.conversation_id;
  
  -- Call the edge function if the message is coming from a user (not system)
  IF NEW.sender_id IS NOT NULL THEN
    -- Get URL and key from environment variables or use fallbacks
    supabase_url := COALESCE(current_setting('app.settings.supabase_url', true), 'SUPABASE_URL_PLACEHOLDER');
    service_role_key := COALESCE(current_setting('app.settings.service_role_key', true), 'SERVICE_ROLE_KEY_PLACEHOLDER');
    
    -- Only make the call if both values are valid (not placeholders)
    IF supabase_url != 'SUPABASE_URL_PLACEHOLDER' AND service_role_key != 'SERVICE_ROLE_KEY_PLACEHOLDER' THEN
      -- Call the edge function
      PERFORM
        net.http_post(
          url := CONCAT(supabase_url, '/functions/v1/messaging-notify'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', CONCAT('Bearer ', service_role_key)
          ),
          body := jsonb_build_object(
            'message', jsonb_build_object(
              'id', NEW.id,
              'conversation_id', NEW.conversation_id,
              'sender_id', NEW.sender_id,
              'content', NEW.content,
              'created_at', NEW.created_at,
              'read_status', NEW.read_status,
              'has_attachments', NEW.has_attachments
            )
          )::jsonb
        );
    ELSE
      -- Log that configuration is missing
      RAISE NOTICE 'Edge function not called: URL or key not configured';
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't break the insert
  RAISE WARNING 'Error in handle_new_message: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger for message notifications
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

-- Create HTTP extension if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
  END IF;
END
$$;

-- IMPORTANT: After running this migration, you must configure the URL and key using secrets in the Supabase dashboard
-- or by running these SQL commands as superuser:
-- ALTER DATABASE postgres SET "app.settings.service_role_key" TO 'your-supabase-service-role-key';
-- ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'your-supabase-url'; 