-- Add weekly_xp and last_xp_update columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_xp integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_xp_update timestamp with time zone DEFAULT now();
