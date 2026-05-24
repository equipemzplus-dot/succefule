-- Add xp column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;

-- Optional: If the table was protected by RLS, this column will just inherit access (assuming users edit/read their own row).
-- Note: if there are other permissions or views, you might need to recreate them, but usually adding a column is safe.
