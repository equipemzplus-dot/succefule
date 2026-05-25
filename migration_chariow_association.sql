-- Migration pour associer les produits locaux avec l'API Chariow
-- Exécutez ce script dans l'éditeur SQL de votre tableau de bord Supabase

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS chariow_product_id VARCHAR(255);

-- Ajouter un commentaire explicatif sur la colonne
COMMENT ON COLUMN public.products.chariow_product_id IS 'ID de correspondance du produit Chariow (ex: prd_...)';
