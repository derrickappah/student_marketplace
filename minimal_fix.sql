-- Minimal fix for the admin_logs issue
-- This runs the bare minimum SQL needed to make the column nullable

-- Direct ALTER TABLE statement to make admin_id nullable
ALTER TABLE admin_logs ALTER COLUMN admin_id DROP NOT NULL; 