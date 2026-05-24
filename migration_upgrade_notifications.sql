-- ====================================================================
-- MIGRATE INTERNAL NOTIFICATIONS TABLE
-- ====================================================================
-- Exécutez ce script dans l'éditeur SQL de votre console Supabase 
-- pour ajouter les colonnes requises de notifications avancées.

-- 1. Ajouter la colonne 'title' si elle n'existe pas
ALTER TABLE public.internal_notifications 
ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. Ajouter la colonne 'metadata' si elle n'existe pas (stockage de Blink, CTA Labels, etc.)
ALTER TABLE public.internal_notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Rendre la colonne 'sender_id' facultative (nullable) pour gérer les messages systèmes
ALTER TABLE public.internal_notifications 
ALTER COLUMN sender_id DROP NOT NULL;

-- 4. Activer ou confirmer l'indexation de base pour la performance
CREATE INDEX IF NOT EXISTS idx_internal_notifications_recipient ON public.internal_notifications(recipient_id);


-- ====================================================================
-- EXEMPLE DE REQUÊTE SQL CORRIGÉE POUR LA SIMULATION (STREAK 3 JOURS)
-- ====================================================================
-- Utilisez 'NULL' ou un UUID d'utilisateur valide à la place de la chaîne 'system' 
-- pour la colonne 'sender_id' afin d'éviter l'erreur de conversion UUID (22P02).
--
-- Remplacer 'VOTRE_USER_ID_ICI' par votre UUID réel (ex: le vôtre dans la table public.users) :

/*
DO $$
DECLARE
    v_user_id UUID := 'VOTRE_USER_ID_ICI'; -- Mettez ici votre UUID !
BEGIN
    INSERT INTO public.internal_notifications (
        recipient_id, 
        sender_id, 
        type, 
        message, 
        is_read, 
        title,
        metadata, 
        created_at
    )
    VALUES (
        v_user_id,
        v_user_id, -- On utilise l'UUID de l'utilisateur pour le sender_id ou NULL si nullable
        'premium_upsell',
        E'🔥 Actif depuis 3 jours d\'affilée ! Ta constance est ta plus grande force, mais sans l\'automatisation Premium, tu travailles deux fois plus dur pour deux fois moins de résultats. Rejoins l\'élite MZ+ !',
        false,
        'Régularité Elite 💎',
        '{"scenario": "streak_3d", "is_blink": true, "cta_label": "Activer mon système premium 👑"}'::jsonb,
        clock_timestamp()
    );
END $$;
*/
