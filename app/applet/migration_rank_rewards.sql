CREATE TABLE IF NOT EXISTS public.rank_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    file_url TEXT,
    perceived_value TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_rank_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rank_id INTEGER NOT NULL,
    reward_id UUID REFERENCES public.rank_rewards(id),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, rank_id)
);

ALTER TABLE public.rank_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rank_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active rank rewards" ON public.rank_rewards;
CREATE POLICY "Anyone can view active rank rewards" ON public.rank_rewards
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage rank rewards" ON public.rank_rewards;
CREATE POLICY "Admins can manage rank rewards" ON public.rank_rewards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (is_admin = true OR admin_role IN ('super_admin', 'marketing_admin'))
        )
    );

DROP POLICY IF EXISTS "Users can insert their own claims" ON public.user_rank_rewards;
CREATE POLICY "Users can insert their own claims" ON public.user_rank_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own claims" ON public.user_rank_rewards;
CREATE POLICY "Users can read their own claims" ON public.user_rank_rewards
    FOR SELECT USING (auth.uid() = user_id);
