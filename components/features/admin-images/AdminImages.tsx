import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import { Image as ImageIcon, Upload, CheckCircle2, Trash2, Plus } from 'lucide-react';

interface ImageConfig {
  id: string; // name
  name: string;
  logo_url: string | null;
}

const DEFAULT_IMAGES = [
  'Orange Money',
  'Wave',
  'MTN Mobile Money',
  'Moov Money',
  'M-Pesa',
  'Airtel Money',
  'Flooz',
  'Virement Bancaire'
];

export const AdminImages: React.FC = () => {
  const [methods, setMethods] = useState<ImageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [newImageName, setNewImageName] = useState('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'app_images')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      const storedImages: Record<string, string> = data?.value || {};
      
      const combined: ImageConfig[] = [];
      const seen = new Set<string>();
      
      // Load predefined
      DEFAULT_IMAGES.forEach(name => {
         combined.push({ id: name, name, logo_url: storedImages[name] || null });
         seen.add(name);
      });
      
      // Load any others
      Object.keys(storedImages).forEach(name => {
         if (!seen.has(name)) {
             combined.push({ id: name, name, logo_url: storedImages[name] });
         }
      });
      
      setMethods(combined);

    } catch (err: any) {
      console.error("Error managing methods:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveToPlatformSettings = async (newMethods: ImageConfig[]) => {
      const valueToStore: Record<string, string> = {};
      newMethods.forEach(m => {
         if (m.logo_url) {
            valueToStore[m.name] = m.logo_url;
         }
      });
      
      try {
         await supabase.from('platform_settings').upsert({ id: 'app_images', value: valueToStore });
      } catch (err) {
         console.error(err);
         alert("Erreur lors de la sauvegarde.");
      }
  };

  const handleFileClick = (id: string) => {
    setActiveUploadId(id);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadId) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("L'image est trop volumineuse (max 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Str = event.target?.result as string;
      const newMethods = methods.map(m => m.id === activeUploadId ? { ...m, logo_url: base64Str } : m);
      setMethods(newMethods);
      await saveToPlatformSettings(newMethods);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveUploadId(null);
  };
  
  const handleAddNew = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newImageName.trim()) return;
     const newId = newImageName.trim();
     if (methods.find(m => m.id === newId)) return;
     
     const newMethods = [...methods, { id: newId, name: newId, logo_url: null }];
     setMethods(newMethods);
     setNewImageName('');
     await saveToPlatformSettings(newMethods);
  };
  
  const handleDelete = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     if (!window.confirm("Supprimer cette image ?")) return;
     const newMethods = methods.filter(m => m.id !== id);
     setMethods(newMethods);
     await saveToPlatformSettings(newMethods);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-indigo-800/20 p-6 rounded-[2rem] border border-purple-500/20">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
            <ImageIcon className="text-purple-400" /> Gestion des Images
          </h2>
          <p className="text-purple-200/60 text-sm mt-1">Importez ici les images et logos nécessaires pour la plateforme.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-t-2 border-purple-500 animate-spin" /></div>
      ) : (
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                   <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                     <div className="w-2 h-6 bg-purple-500 rounded-full"></div> Logos des services
                   </h3>
                   <p className="text-sm text-neutral-400">Cliquez sur une case pour importer le logo (PNG/SVG transparent recommandé, max 2MB).</p>
               </div>
               
               <form onSubmit={handleAddNew} className="flex gap-2">
                   <input type="text" value={newImageName} onChange={e => setNewImageName(e.target.value)} placeholder="Nouveau nom..." className="px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500" />
                   <button type="submit" disabled={!newImageName.trim()} className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50"><Plus size={20} /></button>
               </form>
           </div>

           <input 
             type="file" 
             accept="image/*" 
             className="hidden" 
             ref={fileInputRef}
             onChange={handleFileChange}
           />

           <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {methods.map(method => (
               <div key={method.id} className="relative bg-[#111] p-5 rounded-2xl border border-white/10 group flex flex-col justify-between hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => handleFileClick(method.id)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1 shadow-inner relative">
                      {method.logo_url ? (
                        <img src={method.logo_url} alt={method.name} className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon className="text-neutral-300" />
                      )}
                      
                      {/* Upload Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                         <Upload size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {method.logo_url && (
                            <CheckCircle2 size={16} className="text-green-500" />
                        )}
                        <button onClick={(e) => handleDelete(method.id, e)} className="p-1.5 bg-black/20 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={14} />
                        </button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-white text-md">{method.name}</h4>
                    <p className="text-xs text-neutral-500 mt-1">{method.logo_url ? 'Image importée' : 'Aucune image'}</p>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
