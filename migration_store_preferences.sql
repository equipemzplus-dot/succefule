-- Run this in your Supabase SQL Editor to add store preferences
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS store_preferences JSONB DEFAULT '{}'::jsonb;
