import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  Gift,
  ExternalLink,
  Info,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface BonusContentReaderProps {
  title: string;
  content: string;
  previewUrl?: string;
  bonusId?: string;
  onClose: () => void;
  onComplete?: () => void;
}

export const BonusContentReader: React.FC<BonusContentReaderProps> = ({
  title,
  content,
  previewUrl,
  bonusId,
  onClose,
  onComplete,
}) => {
  const [markedAsDone, setMarkedAsDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    
    if (scrollHeight <= clientHeight) {
      setProgress(100);
      return;
    }

    const currentProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    setProgress(Math.min(100, Math.max(0, currentProgress)));
  };

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleComplete = () => {
    setMarkedAsDone(true);
    
    // Dispatch reward event specifically for bonus
    if (bonusId) {
      const storageKey = `mz_bonus_viewed_${bonusId}`;
      const alreadyViewed = localStorage.getItem(storageKey);

      if (!alreadyViewed) {
        localStorage.setItem(storageKey, "true");
        window.dispatchEvent(
          new CustomEvent("mz-xp-reward", {
            detail: {
              amount: 10,
              title: "🎁 Bonus Débloqué",
              description: "Tu as reçu 10 points XP pour avoir exploré ce bonus exclusif.",
              source: "bonus_complete",
            },
          }),
        );
      }
    }

    setTimeout(() => {
      if (onComplete) onComplete();
      onClose();
    }, 1200);
  };

  const readerContent = (
    <motion.div 
      initial={{ opacity: 0, x: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
      className="fixed inset-0 z-[10000] flex flex-col overflow-hidden bg-[#020202] text-white"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Header Bar */}
      <div className="relative z-50 flex-shrink-0 backdrop-blur-xl border-b border-white/5 bg-black/40 pt-[calc(env(safe-area-inset-top,0px))]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="group flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl md:rounded-2xl transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft size={16} className="text-neutral-400 group-hover:text-white transition-colors" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-white hidden xs:inline">Retour</span>
          </button>

          <div className="flex flex-col items-center gap-1 md:gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-amber-500 whitespace-nowrap overflow-hidden">
               <Sparkles size={12} className="animate-pulse shrink-0" />
               <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] truncate">Bonus Élite</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
             <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[8px] md:text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Lecture</span>
                <div className="flex items-center gap-2">
                   <div className="w-12 md:w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                      />
                   </div>
                   <span className="text-[9px] md:text-[10px] font-bold text-amber-500 w-6 md:w-8 text-right font-mono">{progress}%</span>
                </div>
             </div>
             <div className="sm:hidden text-amber-500 font-mono text-[10px] font-bold">{progress}%</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto custom-scrollbar"
      >
        <div className="max-w-3xl mx-auto px-5 md:px-6 py-10 md:py-24">
          <header className="mb-10 md:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl shadow-xl">
                <Gift className="text-amber-500" size={20} md:size={24} />
              </div>
              <span className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-8"
            >
              {title}
            </motion.h1>

            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ delay: 0.2 }}
               className="flex items-start gap-4 p-5 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md"
            >
               <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <Info className="text-amber-500" size={20} />
               </div>
               <p className="text-xs md:text-sm text-neutral-400 font-medium leading-relaxed">
                  Ce contenu est réservé exclusivement aux membres <span className="text-amber-500 font-black">ELITE</span>. 
                  Il contient des stratégies et outils avancés pour booster ton empire digital.
               </p>
            </motion.div>
          </header>

          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-12 md:mb-20 group"
            >
              <div className="relative aspect-video rounded-3xl md:rounded-[3rem] overflow-hidden border border-white/10 bg-black shadow-2xl group-hover:border-amber-500/20 transition-all duration-700">
                {previewUrl.includes("youtube.com") || previewUrl.includes("youtu.be") ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${previewUrl.includes("v=") ? previewUrl.split("v=")[1].split("&")[0] : previewUrl.split("/").pop()}?autoplay=0&rel=0`}
                    className="w-full h-full absolute inset-0"
                    allowFullScreen
                  />
                ) : previewUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) ? (
                  <img src={previewUrl} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="prose prose-invert prose-amber max-w-none 
            prose-p:text-neutral-400 prose-p:text-lg md:prose-p:text-xl prose-p:leading-relaxed prose-p:mb-10
            prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
            prose-h2:text-3xl md:prose-h2:text-5xl prose-h2:mt-24 prose-h2:mb-10 prose-h2:text-amber-500
            prose-h3:text-xl md:prose-h3:text-2xl prose-h3:mt-16 prose-h3:mb-6
            prose-strong:text-white prose-strong:font-black
            prose-blockquote:bg-amber-500/5 prose-blockquote:border-l-4 prose-blockquote:border-amber-500 prose-blockquote:p-8 md:prose-blockquote:p-12 prose-blockquote:rounded-r-3xl prose-blockquote:not-italic prose-blockquote:text-xl md:prose-blockquote:text-2xl prose-blockquote:font-black
            prose-li:text-neutral-400 prose-li:text-lg md:prose-li:text-xl prose-li:mb-4
            prose-img:rounded-[2rem] prose-img:border prose-img:border-white/10
            selection:bg-amber-500/30 selection:text-white whitespace-pre-wrap"
          >
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <div className="py-24 text-center">
                <Sparkles size={48} className="text-white/5 mx-auto mb-6" />
                <p className="text-neutral-600 italic">Chargement du contenu stratégique...</p>
              </div>
            )}
          </motion.div>

          <footer className="mt-32 pb-24 pt-20 border-t border-white/5">
            <div className="flex flex-col items-center text-center">
              <div className={`p-6 rounded-full mb-8 transition-all duration-700 ${markedAsDone ? 'bg-amber-500 border-none scale-110 shadow-[0_0_50px_rgba(245,158,11,0.3)]' : 'bg-white/5 border border-white/10'}`}>
                 <CheckCircle2 size={40} className={markedAsDone ? 'text-black' : 'text-neutral-600'} />
              </div>
              
              <h3 className="text-3xl font-black mb-4 uppercase tracking-[0.05em]">Mission accomplie ?</h3>
              <p className="text-neutral-500 mb-12 max-w-sm text-sm">Chaque bonus Elite est une brique indispensable pour ton expansion.</p>
              
              <button
                onClick={handleComplete}
                disabled={markedAsDone}
                className={`
                  group w-full max-w-md py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 shadow-2xl relative overflow-hidden
                  ${markedAsDone 
                    ? 'bg-amber-500 text-black translate-y-1' 
                    : 'bg-white text-black hover:bg-neutral-100 hover:scale-[1.02] active:scale-95'
                  }
                `}
              >
                <div className="relative z-10 flex items-center justify-center gap-4">
                  {markedAsDone ? (
                    <>
                      <Check size={24} strokeWidth={4} />
                      <span>Expérience Acquise !</span>
                    </>
                  ) : (
                    <>
                      <span>J'ai tout assimilé</span>
                      <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </div>
                {!markedAsDone && (
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                )}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(
    readerContent,
    document.body
  );
};
