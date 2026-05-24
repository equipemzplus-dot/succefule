-- Correction complète de la table users pour l'XP et les Rangs
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weekly_xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS monthly_xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_xp_update TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rank_id INTEGER DEFAULT 1; -- Par défaut Débutant (1)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rank_name TEXT DEFAULT 'DÉBUTANT';

-- Supprimer toute contrainte unique accidentelle sur ces colonnes qui pourrait causer l'erreur 409
-- (Note: l'ID utilisateur doit rester unique, mais pas l'XP ou le rang)

-- Recharger le cache du schéma
NOTIFY pgrst, 'reload schema';
