import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Check,
  BookOpen,
  Crown,
  Hourglass,
  Lock,
  Unlock,
  Sparkles,
  Zap,
} from "lucide-react";
import { supabase } from "../../../services/supabase.ts";
import { QuestionAnswerSection } from "./QuestionAnswerSection.tsx";
import ReactMarkdown from "react-markdown";

interface TextFormationReaderProps {
  title: string;
  content: string;
  onClose: () => void;
  onComplete?: () => void;
  formationId?: string;
  isAdmin?: boolean;
  previewUrl?: string;
  onUpgrade?: () => void;
  type?: "formation" | "bonus";
  profile?: any;
}

export const TextFormationReader: React.FC<TextFormationReaderProps> = ({
  title,
  content,
  onClose,
  onComplete,
  formationId,
  isAdmin,
  previewUrl,
  onUpgrade,
  type = "formation",
  profile,
}) => {
  const [markedAsDone, setMarkedAsDone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const qaSectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [countdown, setCountdown] = useState(60); 
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);

  useEffect(() => {
    setCountdown(60);
    setIsCountdownComplete(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCountdownComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [formationId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const handleScrollToQA = () => {
    if (qaSectionRef.current) {
      qaSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (!containerRef.current || !textContainerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    
    const scrollHeight = containerRef.current.scrollHeight;
    const scrollableHeight = scrollHeight - clientHeight;

    if (scrollableHeight <= 0) {
      setProgress(100);
      return;
    }

    const currentProgress = Math.round((scrollTop / scrollableHeight) * 100);
    setProgress(Math.min(100, Math.max(0, currentProgress)));
  };

  useEffect(() => {
    // Lock body scroll
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Force scroll to top on mount and when content changes
    const resetScroll = () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
        containerRef.current.scrollTo(0, 0); // extra safety
      }
    };

    resetScroll();
    requestAnimationFrame(() => {
      resetScroll();
      handleScroll();
    });

    // Double check after a small delay for smooth layout transitions
    const timer = setTimeout(() => {
      resetScroll();
      handleScroll();
    }, 150);

    return () => {
      document.body.style.overflow = originalStyle;
      clearTimeout(timer);
    };
  }, [content]);

  const triggerXPIfNeeded = (force = false) => {
    if ((progress >= 95 || force) && formationId) {
      const storageKey = `mz_formation_xp_${currentUserId}_${formationId}`;
      const hasGottenXP = localStorage.getItem(storageKey);

      // TOUJOURS envoyer l'événement de complétion pour les systèmes qui écoutent (Défis, logs, etc.)
      // mais on ne donne l'XP qu'une seule fois.
      window.dispatchEvent(
        new CustomEvent("mz-formation-completed", {
          detail: { 
            formationId, 
            type,
            newlyCompleted: !hasGottenXP
          }
        })
      );

      if (!hasGottenXP || isAdmin) {
        localStorage.setItem(storageKey, "true");
        window.dispatchEvent(
          new CustomEvent("mz-xp-reward", {
            detail: {
              amount: 10,
              title: "🎉 Bien joué.",
              description:
                type === "bonus"
                  ? "Tu as reçu 10 points pour avoir consulté ce bonus."
                  : "Tu as reçu 10 points pour avoir terminé la formation MZ+.",
              source:
                formationId === "default-free-video"
                  ? "formation_day2_complete"
                  : type === "bonus"
                    ? "bonus_complete"
                    : "formation_complete",
            },
          }),
        );
      }
    }
  };

  const handleComplete = () => {
    setMarkedAsDone(true);
    triggerXPIfNeeded(true);
    setTimeout(() => {
      if (onComplete) onComplete();
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    onClose();
  };

  const readerContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-hidden animate-fade-in bg-black">
      {/* Top Bar */}
      <div className="flex-shrink-0 sticky top-0 z-50 backdrop-blur-2xl border-b border-white/5 bg-black/90">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">
              Quitter
            </span>
          </button>
          <div className="flex-1 flex justify-center px-4">
             <div className="max-w-[200px] md:max-w-sm w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                />
             </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Copy Link Button */}
            <button
              onClick={() => {
                const refParam = profile?.referral_code ? `&ref=${profile.referral_code}` : '';
                const shareLink = `${window.location.origin}/academie?formationId=${formationId}${refParam}`;
                navigator.clipboard.writeText(shareLink);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className={`p-1.5 px-3 flex items-center gap-1.5 border rounded-full transition-all duration-300 text-[10px] font-black uppercase tracking-wider ${
                copiedLink
                  ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
              title="Copier le lien spécifique de cette leçon"
            >
              <span>{copiedLink ? '✓ Copié !' : 'Copier Lien'}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={() => {
                const refParam = profile?.referral_code ? `&ref=${profile.referral_code}` : '';
                const shareLink = `${window.location.origin}/academie?formationId=${formationId}${refParam}`;
                const refText = `🎥 Regarde la masterclass stratégique "${title}" sur MZ+ gratuitement ! Apprends à automatiser tes revenus d'affiliation ici :`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${refText}\n\n${shareLink}`)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="p-1.5 px-3 bg-green-600/15 border border-green-500/20 text-green-400 hover:bg-green-600/30 rounded-full flex items-center justify-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-wider focus:outline-none"
              title="Partager sur WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.451 4.793 1.452 5.518 0 10.006-4.486 10.009-10.002.002-2.673-1.037-5.184-2.931-7.081C16.634 1.626 14.127.585 11.45.585 5.928.585 1.442 5.071 1.439 10.59c-.001 1.785.467 3.53 1.353 5.074l-1.012 3.693 3.795-.995zM18.23 15.65c-.299-.15-1.771-.873-2.046-.974-.275-.101-.476-.15-.676.15-.2.3-.776.974-.951 1.173-.175.2-.35.225-.65.075-.3-.15-1.263-.465-2.403-1.482-.888-.793-1.488-1.771-1.663-2.07-.175-.3-.019-.463.131-.612.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.628-.926-2.228-.243-.585-.491-.507-.676-.516-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8 1.05-.275.975-1.05 3.074-1.05 3.174 0 .1.1.2.25.3.15.1.728 1.112 1.562 1.83 1.01 1.05 1.884 1.1 2.385 1.1l.6.05c1.4.1 2 .2 2.385.1l.6-.35c.34-.15.34-.65.25-.8l-.35-.2z" />
              </svg>
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-xs font-black text-emerald-500">
                {progress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`fixed bottom-6 right-6 z-[10000] flex items-center justify-center transition-all duration-300 ${progress === 100 ? 'scale-110' : ''}`}
      >
        <button 
          onClick={handleScrollToQA}
          className="w-14 h-14 relative flex items-center justify-center bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl group"
        >
          <svg
            viewBox="0 0 36 36"
            className="absolute inset-0 w-full h-full -rotate-90 stroke-emerald-500"
            strokeWidth="3"
            fill="none"
          >
            <circle cx="18" cy="18" r="16" className="stroke-white/5" />
            <path
              strokeDasharray={`${progress}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-white">
               {progress}%
             </span>
             <MessageCircle size={10} className="text-emerald-500 mt-0.5" />
          </div>
        </button>
      </motion.div>

      {/* Content Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pb-40 scroll-smooth"
      >
        <article className="max-w-3xl mx-auto px-6 py-12 md:py-24">
          <div ref={textContainerRef}>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-12 tracking-tight"
            >
              {title}
            </motion.h1>

            {previewUrl && (
              <div className="mb-20">
                <div className="w-full aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative bg-[#050505]">
                  {previewUrl.includes("youtube.com") ||
                  previewUrl.includes("youtu.be") ? (
                    (() => {
                      const regExp =
                        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                      const match = previewUrl.match(regExp);
                      const youtubeId =
                        match && match[2].length === 11 ? match[2] : null;

                      if (youtubeId) {
                        return (
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            className="w-full h-full absolute inset-0 z-10 border-0"
                          />
                        );
                      }

                      return (
                        <div
                          className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                          dangerouslySetInnerHTML={{ __html: previewUrl }}
                        />
                      );
                    })()
                  ) : previewUrl
                      .split("?")[0]
                      .match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) ? (
                    <img
                      src={previewUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                      autoPlay
                    />
                  )}
                </div>
              </div>
            )}

            <div className="w-full select-text selection:bg-[#C9A84C]/30 selection:text-white">
              {content ? (
                <div className="space-y-4">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl md:text-5xl font-extrabold text-[#C9A84C] tracking-tight leading-tight mt-16 mb-10 pb-4 border-b border-white/5 uppercase">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl md:text-3.5xl font-black text-[#E8C96D] mt-20 mb-8 border-l-4 border-[#C9A84C] pl-6 tracking-tight leading-snug">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl md:text-2xl font-bold text-white mt-12 mb-6 tracking-tight">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-[#F0EBE0]/90 text-lg md:text-xl font-light leading-[1.85] mb-10 tracking-wide">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-extrabold text-[#E8C96D]">
                          {children}
                        </strong>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="my-14 p-8 md:p-12 rounded-[2rem] bg-gradient-to-r from-[#161410] to-[#111009] border-l-4 border-[#C9A84C] shadow-2xl italic text-[#E8C96D] text-lg md:text-xl font-medium leading-relaxed">
                          {children}
                        </blockquote>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-none pl-1 my-10 space-y-5">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-8 my-10 space-y-5 text-[#F0EBE0]/90 text-lg md:text-xl font-light leading-[1.8]">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-[#F0EBE0]/90 text-lg md:text-xl font-light leading-[1.8] flex items-start gap-4">
                          <span className="text-[#C9A84C] mt-2 flex-shrink-0 text-sm">✦</span>
                          <span className="flex-1">{children}</span>
                        </li>
                      ),
                      hr: () => (
                        <hr className="border-t border-white/10 my-16 opacity-30" />
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>

                  {/* Elegant Call to Action for Premium Membership with 1-Minute Countdown Gate */}
                  {onUpgrade && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="relative p-8 md:p-14 mt-24 rounded-[2.5rem] bg-gradient-to-br from-[#1a112c] via-[#090510] to-[#140b24] border border-purple-500/35 shadow-[0_0_60px_rgba(168,85,247,0.22)] overflow-hidden"
                    >
                      {/* Decorative ambient glowing point */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-500/15 rounded-full blur-[80px] pointer-events-none" />
                      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#C9A84C]/10 rounded-full blur-[70px] pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="px-5 py-2.5 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-[0.25em] mb-8 flex items-center gap-2">
                          {isCountdownComplete ? (
                            <span className="flex items-center gap-1.5 text-yellow-400">
                              <Sparkles size={12} className="animate-pulse text-yellow-400" /> ÉLIGIBILITÉ CONFIRMÉE — PRÊT
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-stone-400">
                              <Hourglass size={12} className="animate-spin text-purple-400" /> VÉRIFICATION D'APPRENTISSAGE ({countdown}s)
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-3xl md:text-5.5xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
                          PASSER AU NIVEAU SUPÉRIEUR
                        </h3>
                        
                        <p className="text-neutral-300 text-sm md:text-lg leading-relaxed max-w-2xl mb-10 font-light">
                          {isCountdownComplete ? (
                            <>
                              Félicitations ! Tu as accordé tout le sérieux requis à cette leçon. La clé de la réussite réside dans la vitesse d'action. Débloque le protocole complet <span className="text-yellow-400 font-bold">MZ+ Premium</span> et duplique nos tunnels d'affiliation automatisés dès maintenant.
                            </>
                          ) : (
                            <>
                              Pour t'assurer de bien analyser cette masterclass stratégique (en vidéo ou scripts rédigés), ton bouton de passage au niveau supérieur se chargera dans <span className="text-purple-400 font-bold">{countdown} secondes</span>.
                            </>
                          )}
                        </p>

                        {!isCountdownComplete && (
                          <div className="mb-10 w-full max-w-md bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 p-[1px]">
                            <motion.div 
                              initial={{ width: "0%" }}
                              animate={{ width: `${((60 - countdown) / 60) * 100}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-full"
                            />
                          </div>
                        )}

                        <button
                          disabled={!isCountdownComplete}
                          onClick={onUpgrade}
                          className={`group/btn relative px-12 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 w-full sm:w-auto cursor-pointer select-none overflow-hidden ${
                            isCountdownComplete
                              ? "bg-gradient-to-r from-[#C9A84C] via-[#E8C96D] to-[#C9A84C] text-black shadow-[0_0_50px_rgba(201,168,76,0.5)] hover:shadow-[0_0_70px_rgba(201,168,76,0.7)] hover:scale-[1.06] active:scale-[0.98]"
                              : "bg-white/5 border border-white/10 text-stone-600 cursor-not-allowed"
                          }`}
                        >
                          {/* Inner soft glow for active gold state */}
                          {isCountdownComplete && (
                            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                          )}
                          <span className="relative z-10 flex items-center justify-center gap-3">
                            {isCountdownComplete ? (
                              <>
                                <Crown size={16} className="text-black animate-bounce" />
                                <span>🔓 PASSER AU NIVEAU SUPÉRIEUR — ACCÈS PREMIUM</span>
                                <Sparkles size={16} className="text-black animate-pulse" />
                              </>
                            ) : (
                              <>
                                <Lock size={14} className="text-stone-700" />
                                <span>Étude en cours (Déverrouillage {countdown}s)</span>
                              </>
                            )}
                          </span>
                        </button>
                        
                        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-[10px] text-[#C9A84C]/50 font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Zap size={10}/> Mentorat VIP</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Zap size={10}/> Tunnels Automatiques</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Zap size={10}/> Communauté d'Élite</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                    <BookOpen size={30} className="text-white/20" />
                  </div>
                  <p className="text-neutral-500 italic">Contenu en cours de préparation ou non disponible.</p>
                </div>
              )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-40 border-t border-white/5 pt-20 flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-10 border border-emerald-500/20">
               <CheckCircle2 size={40} className="text-emerald-500" />
            </div>

            <h3 className="text-2xl font-black text-white mb-4 text-center uppercase tracking-widest">
              L'Aventure Continue !
            </h3>
            <p className="text-neutral-500 text-center mb-12 max-w-md">
               {type === "bonus"
                ? "Félicitations pour avoir consulté ce bonus exclusif. Ton ascension ne fait que commencer."
                : "Tu as terminé cette leçon avec succès. Es-tu prêt pour la suite ?"}
            </p>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              <button
                onClick={handleComplete}
                disabled={markedAsDone}
                className={`
                  relative py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 shadow-xl overflow-hidden
                  ${
                    markedAsDone
                      ? "bg-emerald-500 text-black translate-y-1"
                      : "bg-white text-black hover:scale-105 active:scale-95"
                  }
                `}
              >
                <div className="flex items-center justify-center gap-3 relative z-10 w-full">
                  {markedAsDone ? (
                    <>
                      <Check size={20} />
                      <span>Progression Validée (+10 XP)</span>
                    </>
                  ) : (
                    <span>
                      {type === "bonus"
                        ? "J'ai tout lu !"
                        : "Marquer comme terminé"}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={handleScrollToQA}
                className="py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
              >
                <MessageCircle size={18} />
                Une question ?
              </button>
            </div>
          </motion.div>

          {/* Section Q&A */}
          {formationId && currentUserId && type !== "bonus" && (
            <div ref={qaSectionRef} className="mt-32">
              <QuestionAnswerSection
                formationId={formationId}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </article>
      </div>
    </div>
  );

  return createPortal(readerContent, document.body);
};
