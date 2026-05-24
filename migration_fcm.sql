-- Migration: Add FCM support to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_fcm_sync timestamp with time zone;

-- Grant access to these new columns just in case
-- (Assuming standard public access for now as per current project state)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Making sure users can update their own row
CREATE POLICY IF NOT EXISTS users_self_update ON users 
  FOR UPDATE USING (auth.uid() = id);
