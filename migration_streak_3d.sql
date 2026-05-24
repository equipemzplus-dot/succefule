-- Migration: Create a dedicated table to handle user activity streaks automatically without touching store_preferences JSONB.
CREATE TABLE IF NOT EXISTS public.user_activity_streaks (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    consecutive_days INTEGER DEFAULT 1,
    last_active_date DATE DEFAULT CURRENT_DATE,
    streak_3d_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_activity_streaks ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "Users can read own streak" ON public.user_activity_streaks;
CREATE POLICY "Users can read own streak" ON public.user_activity_streaks 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Update policy
DROP POLICY IF EXISTS "Users can update own streak" ON public.user_activity_streaks;
CREATE POLICY "Users can update own streak" ON public.user_activity_streaks 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Insert policy
DROP POLICY IF EXISTS "Users can insert own streak" ON public.user_activity_streaks;
CREATE POLICY "Users can insert own streak" ON public.user_activity_streaks 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Admin policy
DROP POLICY IF EXISTS "Admin full access streak" ON public.user_activity_streaks;
CREATE POLICY "Admin full access streak" ON public.user_activity_streaks 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND (users.is_admin = true OR users.admin_role IS NOT NULL)
        )
    );
