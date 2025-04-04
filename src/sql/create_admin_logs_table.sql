-- Create admin_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL, -- create, update, delete, view, settings, etc.
  details TEXT,
  target_id TEXT, -- ID of the entity being acted upon (user_id, listing_id, etc.)
  target_type VARCHAR(50), -- Type of entity (user, listing, category, etc.)
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add indexes for common queries
  CONSTRAINT admin_logs_action_type_check CHECK (
    action_type IN ('create', 'update', 'delete', 'view', 'settings', 'export', 'import', 'bulk_action')
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS admin_logs_action_type_idx ON admin_logs(action_type);
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS admin_logs_target_type_idx ON admin_logs(target_type);

-- Add RLS policies
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admin users can see logs
CREATE POLICY admin_logs_select_policy ON admin_logs
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Only admin users can insert logs
CREATE POLICY admin_logs_insert_policy ON admin_logs
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- No one can update logs (immutable audit trail)
CREATE POLICY admin_logs_update_policy ON admin_logs
  FOR UPDATE USING (false);

-- Only super_admin can delete logs
CREATE POLICY admin_logs_delete_policy ON admin_logs
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

COMMENT ON TABLE admin_logs IS 'Tracks all administrative actions for audit purposes';
COMMENT ON COLUMN admin_logs.admin_id IS 'ID of the admin user who performed the action';
COMMENT ON COLUMN admin_logs.action_type IS 'Type of action performed (create, update, delete, etc.)';
COMMENT ON COLUMN admin_logs.details IS 'Additional details about the action';
COMMENT ON COLUMN admin_logs.target_id IS 'ID of the entity being acted upon';
COMMENT ON COLUMN admin_logs.target_type IS 'Type of entity being acted upon';
COMMENT ON COLUMN admin_logs.ip_address IS 'IP address of the admin user'; 