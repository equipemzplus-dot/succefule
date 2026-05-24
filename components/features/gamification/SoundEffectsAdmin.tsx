import React, { useState, useEffect, useRef } from 'react';
import { Save, Volume2, Loader2, Play, Upload } from 'lucide-react';
import { supabase } from '../../../services/supabase.ts';

interface SoundEffect {
  category: string;
  url: string;
  description: string;
}

const DEFAULT_SOUNDS: SoundEffect[] = [
  { category: 'reward_appear', url: '', description: "Apparition de la récompense (Ouverture du coffre/Pop-up)" },
  { category: 'reward_claim', url: '', description: "Réclamation des points XP (Bouton 'Récupérer')" },
  { category: 'surprise', url: '', description: "Effet de surprise (Présentation d'un défi par Axis)" }
];

export const SoundEffectsAdmin = () => {
  const [sounds, setSounds] = useState<SoundEffect[]>(DEFAULT_SOUNDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchSounds();
  }, []);

  const fetchSounds = async () => {
    try {
      const { data, error } = await supabase.from('mz_sound_effects').select('*');
      if (error) {
        console.error("No sounds found or table doesn't exist yet", error);
      }
      
      if (data && data.length > 0) {
        const merged = DEFAULT_SOUNDS.map(def => {
          const found = data.find(d => d.category === def.category);
          return found ? { ...def, url: found.url } : def;
        });
        setSounds(merged);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = sounds.map(s => ({ category: s.category, url: s.url }));
      const { error } = await supabase.from('mz_sound_effects').upsert(updates, { onConflict: 'category' });
      
      if (error) throw error;
      alert('Effets sonores sauvegardés avec succès !');
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la sauvegarde. Avez-vous exécuté le code SQL pour créer la table mz_sound_effects ?");
    } finally {
      setSaving(false);
    }
  };

  const updateSound = (category: string, url: string) => {
    setSounds(sounds.map(s => s.category === category ? { ...s, url } : s));
  };

  const playSound = (url: string) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Could not play audio", e));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) return;
    
    setUploadingCategory(selectedCategory);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `sound_${selectedCategory}_${Date.now()}.${fileExt}`;
      const filePath = `sounds/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('mz_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('mz_assets')
        .getPublicUrl(filePath);

      updateSound(selectedCategory, data.publicUrl);
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'upload du fichier. Vérifiez que le bucket mz_assets est public.");
    } finally {
      setUploadingCategory(null);
      setSelectedCategory('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (category: string) => {
    setSelectedCategory(category);
    fileInputRef.current?.click();
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="animate-spin text-cyan-400 w-8 h-8" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <input 
        type="file" 
        accept="audio/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Volume2 className="text-cyan-400" />
            Gestion des Effets Sonores
          </h2>
          <p className="text-gray-400 mt-1">
            Importez ou liez vos effets sonores (MP3/WAV). Remplissez l'URL pour chaque événement spécifique.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Enregistrer
        </button>
      </div>

      <div className="bg-[#101010] p-6 rounded-2xl border border-white/5 space-y-4">
        {sounds.map((sound) => (
          <div key={sound.category} className="flex gap-4 items-start bg-white/5 p-4 rounded-xl relative group border border-white/5">
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-sm font-bold text-cyan-400">{sound.description}</label>
                <div className="text-xs text-gray-500 font-mono mb-2">ID Catégorie : {sound.category}</div>
              </div>
              <div>
                <div className="flex gap-2 mb-2 items-center">
                  <button
                    onClick={() => triggerUpload(sound.category)}
                    disabled={uploadingCategory === sound.category}
                    className="flex text-xs items-center gap-2 px-3 py-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-all font-bold"
                  >
                    {uploadingCategory === sound.category ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Importer un fichier audio
                  </button>
                  <span className="text-xs font-mono text-gray-600">- OU -</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sound.url}
                    onChange={(e) => updateSound(sound.category, e.target.value)}
                    placeholder="URL externe (Ex: https://exemple.com/son.mp3)"
                    className="w-full bg-[#0A0D14] border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                  <button 
                    onClick={() => playSound(sound.url)}
                    disabled={!sound.url}
                    className="px-4 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 flex items-center justify-center p-3 transition-colors disabled:opacity-50"
                    title="Tester le son"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl">
        <h3 className="text-blue-400 font-bold mb-2">Code SQL Nécessaire :</h3>
        <p className="text-sm text-gray-400 mb-3">Exécutez ce code dans votre console Supabase ou dans le terminal SQL ci-dessus pour préparer la table :</p>
        <pre className="bg-[#0A0D14] p-4 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS public.mz_sound_effects (
  category text PRIMARY KEY,
  url text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mz_sound_effects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.mz_sound_effects;
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.mz_sound_effects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update sound effects." ON public.mz_sound_effects;
CREATE POLICY "Admins can update sound effects." 
ON public.mz_sound_effects FOR ALL USING (true) WITH CHECK (true);`}
        </pre>
      </div>
    </div>
  );
};
