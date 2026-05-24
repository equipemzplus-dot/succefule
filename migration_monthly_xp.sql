-- Add monthly_xp column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_xp integer DEFAULT 0;
