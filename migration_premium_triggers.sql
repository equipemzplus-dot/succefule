-- Migration for Premium Trigger System
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_premium_trigger_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS premium_trigger_history JSONB DEFAULT '[]'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN public.users.last_active_at IS 'Last time the user was active on the platform';
COMMENT ON COLUMN public.users.last_premium_trigger_at IS 'Last time a premium upsell trigger was shown';
COMMENT ON COLUMN public.users.premium_trigger_history IS 'History of premium triggers shown to the user';
