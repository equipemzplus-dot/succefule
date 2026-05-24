import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Zap, Rocket, Gem } from 'lucide-react';

interface PremiumOfferPopupProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  onUpgrade: () => void;
  cta?: string;
}

export const PremiumOfferPopup: React.FC<PremiumOfferPopupProps> = ({ isOpen, onClose, message, onUpgrade, cta }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-sm bg-[#0a0a0a] border border-purple-500/20 rounded-[2rem] overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.15)]"
          >
            {/* Header / Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-600/10 blur-[80px] pointer-events-none" />
            
            <div className="p-6 md:p-8 flex flex-col items-center text-center relative z-10">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-neutral-500 hover:text-white bg-white/5 rounded-full transition-colors"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>

              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400 shadow-xl mb-4">
                <Gem size={22} className="animate-pulse" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                <Zap size={11} className="text-purple-400" />
                <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-purple-400">Opportunité Élite</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-4 leading-tight">
                Accélère tes <span className="text-purple-500">Résultats</span>
              </h2>

              <p className="text-sm text-neutral-400 font-normal leading-relaxed mb-6">
                {message}
              </p>

              <div className="grid grid-cols-1 w-full gap-3">
                <button
                  onClick={onUpgrade}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider text-[11px] hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 group"
                >
                  <Rocket size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  {cta || "Passer Premium maintenant"}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-neutral-500 hover:text-neutral-300 font-bold uppercase tracking-wider text-[10px] transition-colors"
                >
                  Continuer en mode standard
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 w-full">
                <div className="flex items-center justify-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all duration-300">
                  <ShieldCheck size={14} className="text-purple-400" />
                  <span className="text-[8px] font-extrabold uppercase tracking-wider text-neutral-300">Paiement 100% Sécurisé</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
