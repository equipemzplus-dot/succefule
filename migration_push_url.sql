-- Migration: Add URL column to admin_push_notifications
ALTER TABLE admin_push_notifications ADD COLUMN IF NOT EXISTS url TEXT DEFAULT '/';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
