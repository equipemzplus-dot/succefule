import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase.ts';
import { Loader2, Store, Save } from 'lucide-react';
import { SectionTitle, GoldBorderCard, PrimaryButton } from '../../UI.tsx';

export const AdminStoreSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'store_customization')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setEnabled(data.value?.enabled !== false); // default true
      }
    } catch (err: any) {
      console.error("Error fetching store settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error } = await supabase
        .from('platform_settings')
        .upsert({ id: 'store_customization', value: { enabled } });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving store settings:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <SectionTitle 
        title="Paramètres Boutique Globale" 
        subtitle="Activez ou désactivez la personnalisation des boutiques pour tous les utilisateurs." 
      />

      <GoldBorderCard className="p-8 bg-black/40 border-orange-500/20">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500 shrink-0">
            <Store size={24} />
          </div>
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-lg font-black uppercase text-white mb-2">Options de personnalisation</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Si cette option est désactivée, les utilisateurs ne pourront plus voir les paramètres de personnalisation de leur boutique (thème, nom, couleur). L'icône de statistiques s'affichera directement à la place.
              </p>
            </div>

            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={enabled} 
                  onChange={(e) => setEnabled(e.target.checked)} 
                />
                <div className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-orange-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
              <span className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-orange-400 transition-colors">
                Autoriser la personnalisation des boutiques
              </span>
            </label>

            {error && (
              <p className="text-xs text-red-500 font-bold uppercase">{error}</p>
            )}

            {success && (
              <p className="text-xs text-emerald-500 font-bold uppercase">Sauvegardé avec succès !</p>
            )}

            <div>
              <PrimaryButton onClick={handleSave} isLoading={saving} className="bg-orange-600 hover:bg-orange-500 text-white">
                <Save size={16} /> Enregistrer
              </PrimaryButton>
            </div>
          </div>
        </div>
      </GoldBorderCard>
    </div>
  );
};
