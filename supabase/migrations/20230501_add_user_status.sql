-- Migration to add status column to users table

-- Add the status column with default 'active'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'suspended', 'deleted'));

-- Update any existing RLS policies that might need to be aware of the status column
-- Create a policy to allow admins to update user status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Admins can update user status'
    ) THEN
        CREATE POLICY "Admins can update user status" ON users
        FOR UPDATE
        USING (
            auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
        );
    END IF;
END
$$;

-- Add comment to document the column
COMMENT ON COLUMN users.status IS 'User account status: active, suspended, or deleted';

-- Backfill existing records (set all to active if they don't have a status yet)
UPDATE users SET status = 'active' WHERE status IS NULL; 