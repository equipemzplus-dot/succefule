-- Initialisation de la table des rangs pour éviter les erreurs de clé étrangère
CREATE TABLE IF NOT EXISTS public.ranks (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    min_xp INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertion des rangs de base
INSERT INTO public.ranks (id, name, min_xp) VALUES 
(0, 'Débutant', 0),
(1, 'Expert', 120),
(2, 'Légende', 250),
(3, 'Pro', 700),
(4, 'Élite', 1500)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    min_xp = EXCLUDED.min_xp;

-- Assurer que la colonne rank_id dans users pointe bien vers cette table si possible
-- On ne le fait que si la colonne n'est pas déjà liée, mais le message d'erreur indique qu'elle l'est probablement.

ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture publique des rangs" ON public.ranks;
CREATE POLICY "Lecture publique des rangs" ON public.ranks FOR SELECT USING (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
