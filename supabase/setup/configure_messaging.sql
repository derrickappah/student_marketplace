-- This script must be run by a superuser (postgres) to configure messaging settings
-- Replace the placeholder values with your actual Supabase URL and service role key

-- Configure the database parameters for the messaging system
ALTER DATABASE postgres SET "app.settings.service_role_key" TO 'your-supabase-service-role-key';
ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'your-supabase-url';

-- Check if HTTP extension exists and create it if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
  END IF;
END
$$;

-- How to use:
-- 1. Connect to your Supabase database as the postgres user or another superuser
-- 2. Replace 'your-supabase-service-role-key' with your actual service role key
-- 3. Replace 'your-supabase-url' with your actual Supabase URL (e.g., 'https://your-project-id.supabase.co')
-- 4. Run this script
-- 
-- Alternatively, you can configure these values in the Supabase dashboard:
-- 1. Go to Settings > Database
-- 2. Under "Configuration", find or add the following parameters:
--    - app.settings.service_role_key = 'your-supabase-service-role-key'
--    - app.settings.supabase_url = 'your-supabase-url' 