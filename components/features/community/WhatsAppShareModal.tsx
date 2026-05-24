import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Share2 as ShareIcon } from 'lucide-react';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  title?: string;
  description?: string;
}

export const WhatsAppShareModal = ({ 
  isOpen, 
  onClose, 
  onShare, 
  title = "Impacte la Communauté",
  description = "Ton expertise est une source d'inspiration. Partage ton évolution maintenant pour motiver les autres membres !"
}: WhatsAppShareModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 w-full h-full">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md w-full h-full" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-[340px] bg-[#111] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
      >
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-4">
               <ShareIcon size={24} className="text-emerald-500" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tighter mb-2 leading-tight">
               Partager sur <br/>
               <span className="text-emerald-500 text-xl sm:text-2xl">WhatsApp</span>
            </h3>
            
            <p className="text-[10px] sm:text-[12px] text-neutral-400 font-medium mb-6 sm:mb-8 leading-relaxed">
              {description}
            </p>

            <div className="flex flex-col w-full gap-2">
                <button 
                  onClick={onShare}
                  className="w-full py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] sm:text-[11px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                    PARTAGER MAINTENANT
                </button>
                <button onClick={onClose} className="w-full py-2 text-[9px] sm:text-[10px] font-black text-neutral-600 uppercase tracking-widest hover:text-white transition-colors">Plus tard</button>
            </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
