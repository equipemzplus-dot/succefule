-- =======================================================
-- CORRECTION SÉCURITÉ : ACTIVATION DE LA RLS SUR GROUP_MESSAGES
-- À exécuter dans le SQL Editor de Supabase
-- =======================================================

-- 1. Activer la sécurité Row Level Security (RLS) sur la table group_messages
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- 2. Recréer/S'assurer que les politiques adaptées existent (au cas où elles n'étaient pas présentes ou incorrectes)
-- Note : Ces politiques sont à adapter selon vos besoins exacts.
-- En général, "lecture_libre" permet à tout le monde de lire, ou seulement aux connectés.

-- Si vous souhaitez autoriser les utilisateurs connectés à lire les messages :
DROP POLICY IF EXISTS "lecture_libre" ON public.group_messages;
CREATE POLICY "lecture_libre" ON public.group_messages 
FOR SELECT 
TO authenticated 
USING (true);

-- Si vous souhaitez autoriser les utilisateurs connectés à envoyer des messages :
DROP POLICY IF EXISTS "insertion_libre" ON public.group_messages;
CREATE POLICY "insertion_libre" ON public.group_messages 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = sender_id);

-- Si vous souhaitez que seuls les admins ou l'auteur puissent supprimer des messages :
DROP POLICY IF EXISTS "suppression_messages" ON public.group_messages;
CREATE POLICY "suppression_messages" ON public.group_messages 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() = sender_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);
