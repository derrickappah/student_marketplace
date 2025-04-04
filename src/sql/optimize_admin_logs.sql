-- Add combined indexes for common query patterns in admin logs

-- This index helps with filtering logs by action type and date range, which is a common operation
CREATE INDEX IF NOT EXISTS admin_logs_action_date_idx ON admin_logs(action_type, created_at);

-- This index helps with filtering logs by admin and date range
CREATE INDEX IF NOT EXISTS admin_logs_admin_date_idx ON admin_logs(admin_id, created_at);

-- This index helps when searching for specific targets
CREATE INDEX IF NOT EXISTS admin_logs_target_idx ON admin_logs(target_type, target_id);

-- Add a GIN index for full-text search on details
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS admin_logs_details_trgm_idx ON admin_logs USING GIN (details gin_trgm_ops);

-- Add a partial index for the most common action types to speed up specific queries
CREATE INDEX IF NOT EXISTS admin_logs_update_actions_idx ON admin_logs(created_at)
WHERE action_type = 'update';

CREATE INDEX IF NOT EXISTS admin_logs_create_actions_idx ON admin_logs(created_at) 
WHERE action_type = 'create';

-- Add function to clean up old logs (can be called periodically)
CREATE OR REPLACE FUNCTION clean_old_admin_logs(days_to_keep INTEGER)
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  DELETE FROM admin_logs
  WHERE created_at < NOW() - (days_to_keep * INTERVAL '1 day');
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql; 