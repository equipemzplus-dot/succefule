-- 1. Ajouter les nouvelles colonnes si elles n'existent pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_xp integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_xp integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_xp_update timestamp with time zone DEFAULT now();

-- 2. Initialiser les utilisateurs existants pour qu'ils s'affichent dans le classement
-- On copie temporairement leur compte global 'xp' dans 'weekly_xp' et 'monthly_xp'
-- On met 'last_xp_update' à "maintenant" pour qu'ils soient validés pour la semaine et le mois en cours.
UPDATE users 
SET 
  weekly_xp = xp,
  monthly_xp = xp,
  last_xp_update = now()
WHERE last_xp_update IS NULL;
