-- ==========================================================
-- SÉCURISATION AVANCÉE DU COMPTE UNIQUE ADMINISTRATEUR MZ+
-- ==========================================================
-- Ce script doit être lancé directement dans le SQL Editor de Supabase
-- pour restructurer la base de données et empêcher définitivement 
-- les usurpations de rôle Administrateur.

-- 1. Révoquer immédiatement les droits administrateur de tout le monde
UPDATE public.users 
SET is_admin = false, 
    admin_role = NULL 
WHERE email IS DISTINCT FROM 'google@gmail.com';

-- 2. Assurer que le compte de google@gmail.com est bien administrateur suprême
UPDATE public.users 
SET is_admin = true, 
    admin_role = 'super_admin' 
WHERE email = 'google@gmail.com';

-- 3. Restructurer les fonctions de vérification administrateur
-- Cela invalide immédiatement les requêtes et bypass RLS de quiconque d'autre
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email = 'google@gmail.com'
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email = 'google@gmail.com'
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Écrire le trigger ultime de surveillance de la table public.users
-- Ce trigger rejette la requête au niveau de PostgreSQL si quelqu'un tente
-- de modifier is_admin ou admin_role, sauf si le compte est strictement google@gmail.com
-- et si l'utilisateur qui effectue la modification est google@gmail.com lui-même.
CREATE OR REPLACE FUNCTION public.protect_admin_status_strict()
RETURNS TRIGGER AS $$
BEGIN
    -- Protection 1 : Interdit de donner des droits admin à un autre email que google@gmail.com
    IF (NEW.is_admin = true OR NEW.admin_role IS NOT NULL) THEN
        IF NEW.email IS DISTINCT FROM 'google@gmail.com' THEN
            RAISE EXCEPTION 'Action interdite : Seul le compte administrateur officiel (google@gmail.com) peut posséder des privilèges administrateur.';
        END IF;
    END IF;
    
    -- Protection 2 : Seul l'administrateur google@gmail.com connecté est autorisé à manipuler ces colonnes critiques
    IF (OLD.is_admin IS DISTINCT FROM NEW.is_admin OR OLD.admin_role IS DISTINCT FROM NEW.admin_role) THEN
        IF auth.email() IS DISTINCT FROM 'google@gmail.com' THEN
            RAISE EXCEPTION 'Action interdite : Seule la console de sécurité de google@gmail.com peut modifier les rôles administrateur.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Lier le trigger à la table users
DROP TRIGGER IF EXISTS tr_protect_admin_status ON public.users;
DROP TRIGGER IF EXISTS tr_protect_admin_status_strict ON public.users;

CREATE TRIGGER tr_protect_admin_status_strict
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_admin_status_strict();

-- 6. Recréer les politiques de sécurité (RLS) sur la table users
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" ON public.users 
FOR UPDATE 
USING (
  public.is_current_user_super_admin()
)
WITH CHECK (
  public.is_current_user_super_admin() 
);

-- 7. Autoriser les membres à modifier uniquement LEURS infos non sensibles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE
USING ( id = auth.uid() )
WITH CHECK ( 
    id = auth.uid() 
    AND is_admin = (SELECT is_admin FROM public.users WHERE id = auth.uid()) -- Bloque tout changement de statut admin par l'utilisateur lui-même
    AND admin_role IS NOT DISTINCT FROM (SELECT admin_role FROM public.users WHERE id = auth.uid()) -- Bloque tout changement de rôle
);
