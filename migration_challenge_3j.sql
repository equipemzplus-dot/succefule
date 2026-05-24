CREATE TABLE IF NOT EXISTS public.mz_challenge_3j_state (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    presented BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE,
    j1_completed BOOLEAN DEFAULT false,
    j2_presented BOOLEAN DEFAULT false,
    j2_started_at TIMESTAMP WITH TIME ZONE,
    j2_completed BOOLEAN DEFAULT false,
    j2_completed_at TIMESTAMP WITH TIME ZONE,
    j3_presented BOOLEAN DEFAULT false,
    j3_started_at TIMESTAMP WITH TIME ZONE,
    j3_completed BOOLEAN DEFAULT false,
    cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mz_challenge_3j_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own challenge state" ON public.mz_challenge_3j_state;
CREATE POLICY "Users can read own challenge state" ON public.mz_challenge_3j_state FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own challenge state" ON public.mz_challenge_3j_state;
CREATE POLICY "Users can update own challenge state" ON public.mz_challenge_3j_state FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own challenge state" ON public.mz_challenge_3j_state;
CREATE POLICY "Users can insert own challenge state" ON public.mz_challenge_3j_state FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin access" ON public.mz_challenge_3j_state;
CREATE POLICY "Admin access" ON public.mz_challenge_3j_state FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND (users.is_admin = true OR users.admin_role IS NOT NULL)
    )
);

-- Migration des données existantes (depuis store_preferences JSONB)
INSERT INTO public.mz_challenge_3j_state (
    user_id, presented, started_at, j1_completed, j2_presented, j2_started_at, j2_completed, j2_completed_at, j3_presented, j3_started_at, j3_completed, cancelled
)
SELECT 
    id as user_id,
    COALESCE((store_preferences->'challenge_3j'->>'presented')::boolean, false),
    (store_preferences->'challenge_3j'->>'startedAt')::timestamp with time zone,
    COALESCE((store_preferences->'challenge_3j'->>'j1Completed')::boolean, false),
    COALESCE((store_preferences->'challenge_3j'->>'j2Presented')::boolean, false),
    (store_preferences->'challenge_3j'->>'j2StartedAt')::timestamp with time zone,
    COALESCE((store_preferences->'challenge_3j'->>'j2Completed')::boolean, false),
    (store_preferences->'challenge_3j'->>'j2CompletedAtStr')::timestamp with time zone,
    COALESCE((store_preferences->'challenge_3j'->>'j3Presented')::boolean, false),
    (store_preferences->'challenge_3j'->>'j3StartedAt')::timestamp with time zone,
    COALESCE((store_preferences->'challenge_3j'->>'j3Completed')::boolean, false),
    COALESCE((store_preferences->'challenge_3j'->>'cancelled')::boolean, false)
FROM public.users
WHERE store_preferences->'challenge_3j' IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;
