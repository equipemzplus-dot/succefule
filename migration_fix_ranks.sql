-- Migration: Add missing rank_name column to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rank_name TEXT DEFAULT 'DÉBUTANT';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
