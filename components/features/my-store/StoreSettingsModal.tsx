import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Palette, Type, Check, Paintbrush } from 'lucide-react';
import { supabase } from '../../../services/supabase.ts';

interface StorePreferences {
  name: string;
  theme: 'light' | 'dark';
  primary_color: string;
}

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialPreferences?: StorePreferences;
  onSave: (prefs: StorePreferences) => void;
}

export const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f97316', // Orange
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#eab308'  // Yellow
];

export function StoreSettingsModal({ isOpen, onClose, userId, initialPreferences, onSave }: StoreSettingsModalProps) {
  const [preferences, setPreferences] = useState<StorePreferences>({
    name: '',
    theme: 'light',
    primary_color: '#6366f1'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (initialPreferences && Object.keys(initialPreferences).length > 0) {
      setPreferences({
        name: initialPreferences.name || '',
        theme: initialPreferences.theme || 'light',
        primary_color: initialPreferences.primary_color || '#6366f1'
      });
    }
  }, [initialPreferences, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ store_preferences: preferences })
        .eq('id', userId);

      if (error) throw error;
      
      setSaveSuccess(true);
      onSave(preferences);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving store preferences:', err);
    } finally {
       setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/80">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Paramètres Boutique</h3>
                <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold">Personnalisation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[60vh]">
             {/* Name */}
             <div className="space-y-3">
               <label className="flex items-center gap-2 text-sm font-bold text-white/80">
                 <Type size={16} className="text-[#6366f1]" />
                 Nom de la boutique
               </label>
               <input 
                 type="text" 
                 value={preferences.name}
                 onChange={(e) => setPreferences({ ...preferences, name: e.target.value })}
                 placeholder="Ex: Mon Shop Officiel"
                 className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1] transition-colors font-medium text-sm"
               />
             </div>

             {/* Theme */}
             <div className="space-y-3">
               <label className="flex items-center gap-2 text-sm font-bold text-white/80">
                 <Palette size={16} className="text-emerald-500" />
                 Thème
               </label>
               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                      preferences.theme === 'light' 
                        ? 'bg-white text-black border-white font-bold' 
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                     Clair
                  </button>
                  <button 
                    onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                      preferences.theme === 'dark' 
                        ? 'bg-[#0f0f12] text-white border-white/30 font-bold shadow-lg' 
                        : 'bg-black/50 border-white/5 text-white/50 hover:bg-black'
                    }`}
                  >
                     Sombre
                  </button>
               </div>
             </div>

             {/* Colors */}
             <div className="space-y-3">
               <label className="flex items-center gap-2 text-sm font-bold text-white/80">
                 <Paintbrush size={16} className="text-orange-500" />
                 Couleur principale
               </label>
               <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {PRESET_COLORS.map(color => (
                     <button
                       key={color}
                       onClick={() => setPreferences({ ...preferences, primary_color: color })}
                       className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                          preferences.primary_color === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                       }`}
                       style={{ backgroundColor: color }}
                     >
                        {preferences.primary_color === color && <Check size={14} className="text-white" />}
                     </button>
                  ))}
               </div>
             </div>

             {/* Preview Mini */}
             <div className="mt-4 p-4 rounded-xl border border-white/5 font-sans" style={{ backgroundColor: preferences.theme === 'dark' ? '#0f0f12' : '#f9fafb' }}>
                <div className="text-xs uppercase tracking-widest mb-3 opacity-50 font-bold" style={{ color: preferences.theme === 'dark' ? 'white' : 'black' }}>Aperçu Rapide</div>
                <div className="flex items-center justify-between mb-4">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: preferences.primary_color }}>
                      <Settings size={14} />
                   </div>
                   <div className="font-bold text-sm tracking-tight" style={{ color: preferences.theme === 'dark' ? 'white' : 'black' }}>
                      {preferences.name || "Nom de la boutique"}
                   </div>
                </div>
                <div className="w-full h-10 rounded-lg text-white flex items-center justify-center text-xs font-bold font-sans shadow-md" style={{ backgroundColor: preferences.primary_color }}>
                   Bouton d'action
                </div>
             </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/5 bg-black/40">
            <button 
               onClick={handleSave}
               disabled={isSaving || saveSuccess}
               className={`w-full py-3.5 rounded-xl font-black uppercase text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                  saveSuccess 
                    ? "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]" 
                    : "bg-white text-black hover:bg-gray-100 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
               }`}
            >
               {isSaving ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
               ) : saveSuccess ? (
                  <>
                     <Check size={18} />
                     Enregistré !
                  </>
               ) : (
                  'Enregistrer les paramètres'
               )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
