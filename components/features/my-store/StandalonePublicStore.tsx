import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase.ts';
import { Product } from '../../../types.ts';
import { PublicStorefront } from './PublicStorefront.tsx';
import { Loader2 } from 'lucide-react';

interface StandalonePublicStoreProps {
  storeOwnerCode: string;
}

export const StandalonePublicStore: React.FC<StandalonePublicStoreProps> = ({ storeOwnerCode }) => {
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        // 1. Fetch the user profile by referral\_code
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('referral_code', storeOwnerCode)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) {
          setError("Boutique introuvable.");
          setLoading(false);
          return;
        }

        setOwnerProfile(profile);

        // 2. Fetch all generic products (the catalog)
        let { data: allProducts, error: productsError } = await supabase
          .from('products')
          .select('*');

        if (productsError) throw productsError;
        if (!allProducts) allProducts = [];

        // 3. Filter only the products the user added to their store
        const storeProductIds = profile.store_product_ids || [];
        const myProducts = allProducts.filter(p => storeProductIds.includes(p.id));

        setProducts(myProducts);
      } catch (err: any) {
        console.error("Error fetching store:", err);
        setError(err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    if (storeOwnerCode) {
      fetchStore();
    }
  }, [storeOwnerCode]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0f0f12] flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-[#6366f1] animate-spin mb-4" />
        <p className="text-white/60 font-medium">Chargement de la boutique...</p>
      </div>
    );
  }

  if (error || !ownerProfile) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0f0f12] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-black text-white mb-2">Oups!</h1>
        <p className="text-white/60 mb-6">{error || "Boutique introuvable"}</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-[#6366f1] text-white font-bold rounded-xl"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  // Handle Close - perhaps just go home or back
  const handleClose = () => {
    window.location.href = '/';
  };

  return (
    <PublicStorefront
      products={products}
      referralCode={storeOwnerCode}
      storeName={ownerProfile.store_preferences?.store_name || `Boutique de ${ownerProfile.full_name}`}
      preferences={ownerProfile.store_preferences}
      onClose={handleClose}
    />
  );
};
