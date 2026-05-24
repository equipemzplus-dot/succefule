-- ==========================================
-- SCRIPT DE SÉCURITÉ CRITIQUE : PROTECTION ADMIN
-- À exécuter dans le SQL Editor de Supabase
-- ==========================================

-- 1. On s'assure que la fonction de vérification admin est robuste
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifie si l'utilisateur actuel a le statut is_admin ET n'est pas limité par un rôle marketing
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND is_admin = true 
    AND (admin_role IS NULL OR admin_role = 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Création d'un Trigger pour empêcher les modifications frauduleuses du champ is_admin
CREATE OR REPLACE FUNCTION public.protect_admin_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si quelqu'un essaie de passer is_admin à true ou de modifier le role admin
    IF (NEW.is_admin IS DISTINCT FROM OLD.is_admin OR NEW.admin_role IS DISTINCT FROM OLD.admin_role) THEN
        -- Si l'utilisateur qui fait la modification N'EST PAS un super admin alors on bloque
        IF NOT public.is_current_user_super_admin() THEN
            -- Exception : On autorise le systeme lors de la premiere creation si is_admin est false
            IF TG_OP = 'INSERT' AND NEW.is_admin = false THEN
                RETURN NEW;
            END IF;
            
            RAISE EXCEPTION 'Action interdite : Seul un Super Admin peut modifier les privilèges.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Application du Trigger sur la table users
DROP TRIGGER IF EXISTS tr_protect_admin_status ON public.users;
CREATE TRIGGER tr_protect_admin_status
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_admin_status();

-- 4. Correction de la politique RLS pour plus de sécurité
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" ON public.users 
FOR UPDATE 
USING (
  public.is_current_user_super_admin() -- Seul un admin peut modifier un autre utilisateur
)
WITH CHECK (
  public.is_current_user_super_admin() 
);

-- 5. Autoriser les utilisateurs à modifier uniquement LEURS informations NON SENSIBLES
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE
USING ( id = auth.uid() )
WITH CHECK ( 
    id = auth.uid() 
    AND is_admin = (SELECT is_admin FROM public.users WHERE id = auth.uid()) -- Interdit de changer son propre statut admin
    AND admin_role IS NOT DISTINCT FROM (SELECT admin_role FROM public.users WHERE id = auth.uid()) -- Interdit de changer son role
);

-- 6. Suppression immédiate de tous les admins suspects SAUF votre email (A REMPLACER PAR VOTRE EMAIL SI DIFFERENT)
UPDATE public.users SET is_admin = false, admin_role = NULL 
WHERE email NOT IN ('mzplusofficial@gmail.com', 'maximilienleroy01@gmail.com', 'h.bocquet.pro@gmail.com');

RAISE NOTICE 'Sécurité appliquée avec succès. Seuls les emails officiels sont administrateurs.';
