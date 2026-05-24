-- Migration: Background Notification Priority System
CREATE TABLE IF NOT EXISTS public.mz_background_notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notif_type TEXT NOT NULL, -- e.g. 'challenge_j1_reminder', 'challenge_j1_success'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bg_notif_user_type ON public.mz_background_notifications_log(user_id, notif_type);

-- Table for pending high priority notifications if needed, 
-- but we can just process them in a loop.

-- Add a column to track if a user is currently "active" in the session to avoid sending multiple notifs
-- although last_ping in mz_rewards_time_tracking already gives us a good indicator.

NOTIFY pgrst, 'reload schema';
