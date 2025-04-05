-- Function to check if messaging configuration is set up properly
CREATE OR REPLACE FUNCTION public.check_messaging_config()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  supabase_url TEXT;
  service_role_key TEXT;
  has_http_extension BOOLEAN;
BEGIN
  -- Check for HTTP extension
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) INTO has_http_extension;
  
  -- Try to get configuration settings (safely with default if not found)
  BEGIN
    supabase_url := current_setting('app.settings.supabase_url', true);
  EXCEPTION WHEN OTHERS THEN
    supabase_url := NULL;
  END;
  
  BEGIN
    service_role_key := current_setting('app.settings.service_role_key', true);
    -- Mask the key for security, showing only first and last 4 chars if exists
    IF service_role_key IS NOT NULL AND LENGTH(service_role_key) > 8 THEN
      service_role_key := SUBSTRING(service_role_key, 1, 4) || '...' || 
                         SUBSTRING(service_role_key, LENGTH(service_role_key) - 3);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    service_role_key := NULL;
  END;
  
  -- Build result
  result := jsonb_build_object(
    'http_extension_installed', has_http_extension,
    'supabase_url_configured', supabase_url IS NOT NULL,
    'service_role_key_configured', service_role_key IS NOT NULL,
    'supabase_url', COALESCE(supabase_url, 'Not configured'),
    'service_role_key', COALESCE(service_role_key, 'Not configured'),
    'status', CASE 
      WHEN has_http_extension AND supabase_url IS NOT NULL AND service_role_key IS NOT NULL THEN 'Ready'
      ELSE 'Configuration incomplete'
    END,
    'instructions', 'To configure, run the setup/configure_messaging.sql script as a superuser'
  );
  
  RETURN result;
END;
$$;

-- Grant permission to authenticated users to check the configuration
GRANT EXECUTE ON FUNCTION public.check_messaging_config() TO authenticated;

COMMENT ON FUNCTION public.check_messaging_config() IS 
'Checks if the messaging system is properly configured with HTTP extension and required parameters'; 