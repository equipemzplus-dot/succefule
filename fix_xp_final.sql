-- UNIFIED FIX FOR XP AND RANKS
-- 1. FIX THE RANKS TABLE
-- Add missing columns if needed
ALTER TABLE public.ranks ADD COLUMN IF NOT EXISTS min_xp INTEGER DEFAULT 0;
ALTER TABLE public.ranks ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0; -- Some scripts might use 'xp'

-- Sync min_points to min_xp if min_xp was just added
UPDATE public.ranks SET min_xp = min_points WHERE min_xp = 0 AND min_points > 0;

-- Delete old ranks and insert the current progression levels
TRUNCATE public.ranks CASCADE;

INSERT INTO public.ranks (id, name, min_xp) VALUES
(1, 'DÉBUTANT', 0),
(2, 'EXPERT', 120),
(3, 'LÉGENDE', 250),
(4, 'PRO', 700),
(5, 'ÉLITE', 1500)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    min_xp = EXCLUDED.min_xp;

-- Also update 'min_points' just in case some other code uses it
UPDATE public.ranks SET min_points = min_xp;

-- 2. FIX THE USERS TABLE
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weekly_xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS monthly_xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_xp_update TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rank_id INTEGER DEFAULT 1;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rank_name TEXT DEFAULT 'DÉBUTANT';

-- DÉSACTIVER toute contrainte UNIQUE accidentelle sur les colonnes de progression
-- Ces colonnes ne DOIVENT PAS être uniques entre les utilisateurs
DO $$
DECLARE
    const_name TEXT;
BEGIN
    FOR const_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.users'::regclass 
        AND contype = 'u' 
        AND (
            confkey @> ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.users'::regclass AND attname = 'rank_id')]
            OR confkey @> ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.users'::regclass AND attname = 'rank_name')]
            OR confkey @> ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.users'::regclass AND attname = 'xp')]
        )
    LOOP
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(const_name);
    END LOOP;
END $$;

-- Add foreign key IF and ONLY IF the table exists and columns match
-- We'll use a DO block to safely apply this
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ranks' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_rank_id_fkey') THEN
            ALTER TABLE public.users 
            ADD CONSTRAINT users_rank_id_fkey 
            FOREIGN KEY (rank_id) REFERENCES public.ranks(id);
        END IF;
    END IF;
END $$;

-- Fix existing users who might have NULL or invalid rank_id
UPDATE public.users SET rank_id = 1 WHERE rank_id IS NULL;

-- 3. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
