import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, Rocket, X, CheckCircle2, Flame, Droplets, Crown, Share2 } from 'lucide-react';
import { supabase } from '../../../services/supabase.ts';
import { UserProfile } from '../../../types.ts';
import { shareEvolution, generateWhatsAppLink, getRandomMessage } from '../../../services/evolutionService.ts';
import { WhatsAppShareModal } from '../../features/community/WhatsAppShareModal';

interface ChallengePresentationProps {
  isVisible: boolean;
  onAccept: (action?: string) => void;
  onClose?: () => void;
  mode?: 'intro' | 'celebration' | 'day2_intro' | 'day3_intro' | 'day2_fail_intro';
  completedStep?: number;
  hasFailedDay2?: boolean;
  profile?: UserProfile | null;
}

export const ChallengePresentation: React.FC<ChallengePresentationProps> = ({ isVisible, onAccept, onClose, mode = 'intro', completedStep = 0, hasFailedDay2 = false, profile }) => {
  const [typedText, setTypedText] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [typedText2, setTypedText2] = useState("");
  const fullText = "Hey 🙋‍♂️..j'ai un défi pour toi ";
  const [showContent, setShowContent] = useState(false);
  
  const handleShareChallenge = async () => {
    if (!profile) return;
    setIsSharing(true);
    try {
      const message = getRandomMessage('challenge', { day: completedStep });
      setShareMessage(message);
      
      await shareEvolution({
        user_id: profile.id,
        user_name: profile.full_name || profile.username,
        user_avatar: profile.avatar_url,
        type: 'achievement_unlocked',
        new_level: `Défi J${completedStep}`,
        message: message
      });

      setShowWhatsAppModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  const executeWhatsAppShare = () => {
    const link = generateWhatsAppLink(shareMessage);
    window.open(link, '_blank');
    setShowWhatsAppModal(false);
    onAccept();
  };
  const getInitialStep = () => {
    if (mode === 'celebration') return 'timeline';
    if (mode === 'day2_intro') return 'day2_intro_screen';
    if (mode === 'day3_intro') return 'day3_intro_screen';
    if (mode === 'day2_fail_intro') return 'day2_fail_intro_screen';
    return 'intro';
  };
  const [modalStep, setModalStep] = useState<'intro'|'timeline'|'celebrationText'|'day2challenge'|'day3challenge'|'day2_intro_screen'|'day3_intro_screen'|'prepare_next_day'|'day2_fail_intro_screen'|'day2_fail_upsell'>(getInitialStep());
  
  useEffect(() => {
    console.log("[ChallengePresentation] isVisible:", isVisible, "mode:", mode, "modalStep:", modalStep);
  }, [isVisible, mode, modalStep]);

  // Re-sync modalStep when isVisible changes to ensure modal resets if opened repeatedly
  useEffect(() => {
    if (isVisible) setModalStep(getInitialStep());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, mode]);
  const [surpriseSoundUrl, setSurpriseSoundUrl] = useState<string | null>(null);
  const [levelUpSoundUrl, setLevelUpSoundUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSounds = async () => {
      try {
        const { data, error } = await supabase.from('mz_sound_effects').select('*').in('category', ['surprise', 'level_up']);
        if (!error && data) {
          const surprise = data.find(d => d.category === 'surprise');
          if (surprise) setSurpriseSoundUrl(surprise.url);
          const levelUp = data.find(d => d.category === 'level_up');
          if (levelUp) setLevelUpSoundUrl(levelUp.url);
        }
      } catch {
        // Silent catch
      }
    };
    fetchSounds();
  }, []);

  useEffect(() => {
    if (isVisible) {
      if (mode === 'celebration') {
        setModalStep('timeline');
        // Play level up sound
        try {
          if (levelUpSoundUrl) {
            const audio = new Audio(levelUpSoundUrl);
            audio.volume = 0.6;
            audio.play().catch(() => {});
          } else {
             // Fallback sound if not loaded
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
             audio.volume = 0.5;
             audio.play().catch(() => {});
          }
        } catch {
          // Silent catch
        }
      } else if (mode === 'day2_intro') {
        setModalStep('day2_intro_screen');
        // Play surprise sound for day 2 as well
        try {
          if (surpriseSoundUrl) {
            const audio = new Audio(surpriseSoundUrl);
            audio.volume = 0.5;
            audio.play().catch(() => {});
          }
        } catch {
          // Silent catch
        }
      } else if (mode === 'day3_intro') {
        setModalStep('day3_intro_screen');
        try {
          if (surpriseSoundUrl) {
            const audio = new Audio(surpriseSoundUrl);
            audio.volume = 0.5;
            audio.play().catch(() => {});
          }
        } catch {
          // Silent catch
        }
      } else if (mode === 'day2_fail_intro') {
        setModalStep('day2_fail_intro_screen');
      } else {
        setTypedText("");
        setTypedText2("");
        setShowContent(false);
        setModalStep('intro');
        let currentIndex = 0;
        let timeoutId: NodeJS.Timeout;
        
        const typeNextChar = () => {
          if (currentIndex <= fullText.length) {
            setTypedText(fullText.slice(0, currentIndex));
            currentIndex++;
            // Randomize typing speed for a more natural feel
            const delay = Math.random() * 40 + 30; // 30ms to 70ms
            timeoutId = setTimeout(typeNextChar, delay);
          } else {
            timeoutId = setTimeout(() => {
              setShowContent(true);
              // Play surprise sound
              try {
                if (surpriseSoundUrl) {
                  const audio = new Audio(surpriseSoundUrl);
                  audio.volume = 0.5;
                  audio.play().catch(() => {});
                }
              } catch {
                // Silent catch
              }
              
              timeoutId = setTimeout(() => {
                const part2 = "« T’inquiète 😉, je vais t’aider à le relever »";
                let p2Index = 0;
                setTypedText2(""); // Clear text to start typing part 2
                
                const typeNextCharPart2 = () => {
                   if (p2Index <= part2.length) {
                      setTypedText2(part2.slice(0, p2Index));
                      p2Index++;
                      const delay = Math.random() * 40 + 30;
                      timeoutId = setTimeout(typeNextCharPart2, delay);
                   }
                };
                typeNextCharPart2();
              }, 3000);
              
            }, 3000); // 3s pause before showing the rest
          }
        };

        typeNextChar();

        return () => clearTimeout(timeoutId);
      }
    }
  }, [isVisible, surpriseSoundUrl, levelUpSoundUrl, mode]);

  const handleRelèveDefi = () => {
    try {
      // Play sci-fi start sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // Silent catch
    }
    setModalStep('timeline');
  };

  const challengeSteps = [
    { day: 'J1', title: 'Choisir le bon', subtitle: 'produit', icon: Target },
    { day: 'J2', title: 'Vendre', subtitle: 'ton produit', icon: Zap },
    { day: 'J3', title: 'Faire exploser', subtitle: 'tes ventes', icon: Flame },
  ];

  const getDates = () => {
    const today = new Date();
    return challengeSteps.map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    });
  };

  const dates = getDates();

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4 sm:p-6 overflow-y-auto">
          {/* Intense Dark/Blur Background for maximum contrast */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-[#020202]/95 backdrop-blur-3xl pointer-events-auto"
          >
            {/* Close button that is functional but very subtle, specifically asked by user for top right */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ delay: 2 }}
              whileHover={{ opacity: 0.6 }}
              onClick={onClose || onAccept}
              className="absolute top-4 right-4 p-2 text-white/50 hover:bg-white/5 rounded-full transition-all"
            >
              <X size={16} />
            </motion.button>
          </motion.div>
          
          {/* Subtle slow moving background glows */}
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[var(--color-gold-main)]/5 blur-[120px] rounded-full pointer-events-none"
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.5, 1] }} 
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-red-600/5 blur-[120px] rounded-full pointer-events-none"
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className={`relative pointer-events-auto w-full transition-all duration-500 z-10 ${modalStep === 'timeline' ? 'max-w-3xl' : 'max-w-md'}`}
          >
            <div 
              className="relative p-1 rounded-[2.5rem] bg-gradient-to-br from-white/10 via-[var(--color-gold-main)]/20 to-black/80 shadow-[0_40px_100px_rgba(0,0,0,1)]"
            >
              <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 mix-blend-overlay"></div>
              
              <div className="relative bg-[#080808] rounded-[2.3rem] p-4 sm:p-6 md:p-10 flex flex-col items-center text-center overflow-hidden z-10 min-h-[auto] sm:min-h-[400px] justify-center">
                
                {/* Background scanning line effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-gold-main)]/5 to-transparent h-[10%] w-full pointer-events-none"
                  animate={{ top: ['-10%', '110%'] }}
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                />

                <AnimatePresence mode="wait">
                  {modalStep === 'intro' ? (
                    <motion.div 
                      key="intro"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                      transition={{ duration: 0.4 }}
                      className="w-full flex flex-col items-center"
                    >
                      {/* Axis Indicator */}
                      <div className="relative w-full flex flex-col items-center justify-center min-h-[60px] mb-6">
                        <motion.div 
                          initial={{ scale: 0, opacity: 0, rotate: -20 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          transition={{ type: "spring", delay: 0.1, damping: 15 }}
                          className="flex flex-col items-center gap-3 z-10"
                        >
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="w-14 h-14 rounded-[14px] bg-[#0A0908] border border-[var(--color-gold-main)]/50 shadow-[0_0_20px_rgba(201,168,76,0.2)] flex items-center justify-center overflow-hidden relative"
                          >
                            <motion.div 
                              animate={{ opacity: [0.1, 0.3, 0.1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute inset-0 opacity-20 pointer-events-none"
                              style={{ background: `radial-gradient(circle at 50% 50%, var(--color-gold-main), transparent 70%)` }}
                            />
                            <motion.svg 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              className="w-6 h-6 relative z-10"
                              animate={{ scale: [0.95, 1, 0.95] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <motion.path 
                                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" 
                                stroke="var(--color-gold-main)" 
                                strokeWidth="1.5" 
                                strokeLinejoin="round"
                              />
                            </motion.svg>
                          </motion.div>
                          <div className="flex bg-[#111] rounded-full px-5 py-2 border border-white/10 shadow-inner">
                            <span className="text-[14px] font-mono font-bold text-white/90">
                              {typedText}
                              <span className="animate-pulse inline-block w-1.5 h-3.5 bg-[var(--color-gold-main)] ml-1 align-middle" />
                            </span>
                          </div>
                        </motion.div>
                      </div>

                      <AnimatePresence>
                        {showContent && (
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                              hidden: { opacity: 0 },
                              visible: {
                                opacity: 1,
                                transition: {
                                  staggerChildren: 0.15
                                }
                              }
                            }}
                            className="w-full flex flex-col items-center z-10"
                          >
                            {/* Big Graphic Impact */}
                            <motion.div 
                              variants={{
                                hidden: { opacity: 0, scale: 0.8, y: 20 },
                                visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", bounce: 0.5 } }
                              }}
                              className="relative mb-12 mt-2 w-full"
                            >
                              <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[var(--color-gold-main)]/20 blur-[50px] rounded-full pointer-events-none" 
                              />
                              
                              <h2 className="relative text-[2.5rem] md:text-[3.5rem] font-black text-white uppercase tracking-tighter leading-[1.1] mb-2 drop-shadow-2xl">
                                <span className="opacity-80 block text-2xl md:text-3xl text-gray-300">Ta première</span>
                                <motion.span 
                                  animate={{ textShadow: ["0px 0px 10px rgba(201,168,76,0.5)", "0px 0px 30px rgba(201,168,76,0.8)", "0px 0px 10px rgba(201,168,76,0.5)"] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                  className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-[var(--color-gold-main)] to-red-500 filter drop-shadow-[0_0_15px_rgba(201,168,76,0.4)] block my-1"
                                >
                                  VENTE
                                </motion.span>
                                <span className="opacity-90 block text-2xl md:text-3xl">en 3 Jours</span>
                              </h2>
                            </motion.div>

                            {/* Removing old Emotion & Support text as it's now in Axis box */}
                            
                            {typedText2 && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 text-center mt-2"
                              >
                                <span className="text-[17px] font-medium text-[var(--color-gold-main)] bg-[#111]/80 backdrop-blur-sm px-4 py-2 rounded-xl inline-block border border-white/5 shadow-lg">
                                  {typedText2}
                                </span>
                              </motion.div>
                            )}

                            {/* Power Button */}
                            <motion.div 
                              variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 15 } }
                              }}
                              className="w-full relative group perspective-1000"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-gold-main)] to-red-500 blur-xl opacity-30 rounded-2xl transition-all group-hover:opacity-60 group-hover:blur-2xl" />
                              <button
                                onClick={handleRelèveDefi}
                                className="relative w-full py-5 rounded-2xl bg-gradient-to-b from-white to-gray-200 text-black font-black text-lg md:text-xl uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform-gpu border-b-4 border-gray-400 active:border-b-0 active:translate-y-1"
                              >
                                <span className="relative z-10 drop-shadow-sm flex items-center gap-2">
                                  <Rocket className="w-6 h-6" />
                                  Je relève le défi
                                </span>
                                
                                {/* Gliding shine effect */}
                                <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-25deg] z-20 pointer-events-none mix-blend-overlay" />
                              </button>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : modalStep === 'day2_fail_intro_screen' ? (
                    <motion.div
                      key="day2_fail_intro"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="w-full flex flex-col items-center py-4 relative"
                    >
                      <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter mb-4 text-center mt-2">
                        Rien n'est <span className="text-[var(--color-gold-main)]">perdu !</span>
                      </h2>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                        className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-6 mx-auto shadow-inner"
                      >
                        <Flame size={32} strokeWidth={1.5} />
                      </motion.div>

                      <p className="text-neutral-300 text-sm font-medium mt-2 mb-8 leading-relaxed text-center">
                        Tu n'as pas encore réussi le Jour 2... <br/>
                        <strong className="text-white text-base">Mais ce n'est pas grave !</strong><br/><br/>
                        🔥 Il te reste encore une chance avec le Jour 3 pour faire ta première vente.
                      </p>

                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="w-full max-w-[200px] mx-auto flex flex-col gap-3"
                      >
                        <button
                          onClick={() => setModalStep('timeline')}
                          className="relative w-full py-4 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-[0.98] shadow-lg flex items-center justify-center overflow-hidden"
                        >
                          <span className="relative z-10">OK</span>
                          <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg] z-0 pointer-events-none" />
                        </button>
                      </motion.div>
                    </motion.div>
                  ) : modalStep === 'day2_fail_upsell' ? (
                    <motion.div
                      key="day2_fail_upsell"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="w-full flex flex-col items-center py-4 relative"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-purple-500">
                           <Rocket size={80} />
                        </div>
                        
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", delay: 0.1 }}
                          className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/50 flex flex-col items-center justify-center text-[var(--color-gold-main)] shadow-[0_0_30px_rgba(168,85,247,0.3)] mb-6 z-10"
                        >
                           <Crown size={32} />
                        </motion.div>
                        
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter mb-4 text-center z-10">
                          Passe à la <span className="text-purple-400">vitesse supérieure</span>
                        </h2>
                        
                        <p className="text-neutral-300 text-sm font-medium mb-8 leading-relaxed text-center px-4 z-10">
                          <span className="text-purple-400 mr-2">⚡</span>Ne reste pas bloqué ! Les membres <strong className="text-[var(--color-gold-main)]">MZ+ Premium</strong> obtiennent des résultats beaucoup plus vite grâce à notre accompagnement et nos conseils.
                        </p>
                        
                        <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.3 }}
                           className="w-full flex flex-col"
                        >
                          <button
                             onClick={() => {
                                onAccept('premium');
                             }}
                             className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group border border-purple-400/30"
                          >
                             <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:opacity-100 opacity-60 z-20 pointer-events-none mix-blend-overlay" />
                             <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-sm">
                                👉 Accéder à MZ+ Premium 👑
                             </span>
                          </button>
                          
                          <button
                             onClick={() => {
                                onAccept('pass');
                             }}
                             className="mt-6 text-neutral-500 hover:text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-colors pb-2"
                          >
                             Pas besoin, je continue seul 👉
                          </button>
                        </motion.div>
                    </motion.div>
                  ) : modalStep === 'timeline' ? (
                    <motion.div
                      key="timeline"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                      className="w-full flex flex-col items-center"
                    >
                      {mode === 'celebration' ? (
                        <>
                          <motion.div
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", damping: 10, delay: 0.2 }}
                            className="mb-3"
                          >
                             <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#2A2416] to-[#1A1814] border-2 border-[#10b981] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                               <CheckCircle2 size={36} className="text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             </div>
                          </motion.div>
                          <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-1 sm:mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] text-center">
                            Félicitations !
                          </h3>
                          <p className="text-[var(--color-gold-main)] text-sm sm:text-base mb-6 sm:mb-10 uppercase tracking-widest font-black text-center">Jour {completedStep} validé avec succès 🔥</p>
                        </>
                      ) : mode === 'day2_fail_intro' ? (
                        <>
                          <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter mb-2 sm:mb-4 drop-shadow-lg flex items-center justify-center gap-2 sm:gap-3 text-center">
                            <Target className="text-[var(--color-gold-main)] w-6 h-6 sm:w-8 sm:h-8" />
                            On continue !
                          </h3>
                          <p className="text-neutral-400 text-xs sm:text-sm mb-8 sm:mb-12 uppercase tracking-widest font-bold text-center">Le défi n'est pas terminé</p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter mb-2 sm:mb-4 drop-shadow-lg flex items-center justify-center gap-2 sm:gap-3 text-center">
                            <Target className="text-[var(--color-gold-main)] w-6 h-6 sm:w-8 sm:h-8" />
                            Plan d'Action
                          </h3>
                          <p className="text-neutral-400 text-xs sm:text-sm mb-8 sm:mb-12 uppercase tracking-widest font-bold text-center">Progression du défi 3 Jours</p>
                        </>
                      )}

                      {/* Horizontal Timeline */}
                      <div className="w-full relative px-1 sm:px-6 mt-12 sm:mt-16 mb-10 sm:mb-16">
                        {/* Background Tube Base */}
                        <div className="absolute top-[25px] sm:top-[35px] left-4 sm:left-8 right-4 sm:right-8 h-2 sm:h-3 bg-white/5 border border-white/10 rounded-full shadow-inner overflow-hidden">
                          {/* Dark filler */}
                          <div className="absolute inset-0 bg-black/50" />
                        </div>
                        
                        {/* Liquid Fill / Progress Bar */}
                        <motion.div 
                          initial={{ width: '0%' }}
                          animate={{ width: mode === 'celebration' ? `${completedStep * 50}%` : mode === 'day2_fail_intro' ? '100%' : '12%' }}
                          transition={{ duration: 2, ease: "easeInOut", delay: 0.8 }}
                          className="absolute top-[25px] sm:top-[35px] left-4 sm:left-8 h-2 sm:h-3 bg-gradient-to-r from-red-600 via-amber-500 to-[var(--color-gold-main)] rounded-full shadow-[0_0_20px_rgba(201,168,76,0.6)] z-0 overflow-hidden"
                        >
                          {/* Flowing liquid effect */}
                          <motion.div 
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
                          />
                        </motion.div>

                        <div className="relative z-10 flex justify-between items-start">
                          {challengeSteps.map((stepData, idx) => {
                            const isFirst = idx === 0;
                            const isCompleted = mode === 'day2_fail_intro' ? idx === 0 : idx < completedStep;
                            const isCurrent = mode === 'day2_fail_intro' ? idx === 2 : idx === completedStep;
                            const isActive = isCompleted || isCurrent || (mode === 'intro' && isFirst) || (mode === 'day2_fail_intro' && idx <= 2);
                            
                            return (
                              <div key={idx} className="flex flex-col items-center flex-1 relative group">
                                {/* Date Box */}
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.8 + idx * 0.2 }}
                                  className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono text-neutral-300 font-bold tracking-widest uppercase shadow-lg group-hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                                >
                                  {isCompleted && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", damping: 10, delay: 1.5 + idx * 0.2 }}
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-[var(--color-gold-main)]" />
                                    </motion.div>
                                  )}
                                  {dates[idx]}
                                </motion.div>

                                {/* Connecting Line Glow */}
                                {(isActive && idx < challengeSteps.length - 1) && (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2.5 }}
                                    className="absolute top-[30px] sm:top-[40px] left-1/2 w-full h-[1px] bg-gradient-to-r from-[var(--color-gold-main)]/50 to-transparent z-0 pointer-events-none"
                                  />
                                )}

                                {/* Node / Circle */}
                                <motion.div 
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ delay: 0.3 + idx * 0.2, type: "spring", stiffness: 300, damping: 15 }}
                                  className="relative mt-5 sm:mt-8"
                                >
                                  <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 z-10 relative cursor-default
                                    ${isActive 
                                      ? 'bg-gradient-to-br from-[#2A2416] to-[#1A1814] border-[var(--color-gold-main)] shadow-[0_0_30px_rgba(201,168,76,0.4)]' 
                                      : 'bg-black/60 border-neutral-700/50 backdrop-blur-md transition-all group-hover:border-[var(--color-gold-main)]/30 group-hover:shadow-[0_0_20px_rgba(201,168,76,0.1)]'
                                    }`}
                                  >
                                    {isActive && (
                                      <motion.div 
                                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full bg-[var(--color-gold-main)]/20 blur-md"
                                      />
                                    )}
                                    <div className="flex flex-col items-center justify-center relative z-10">
                                      {isCompleted ? (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ type: "spring", delay: 1 }}
                                        >
                                          <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                        </motion.div>
                                      ) : (
                                        <span className={`font-black text-lg sm:text-2xl ${isActive ? 'text-[var(--color-gold-main)]' : 'text-neutral-500'}`}>
                                          {stepData.day}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Animated drop entering the node */}
                                  {isActive && !isCompleted && (
                                    <motion.div 
                                      initial={{ y: -20, opacity: 0 }}
                                      animate={{ y: 0, opacity: [0, 1, 0] }}
                                      transition={{ delay: 2.2, duration: 1, ease: 'easeIn' }}
                                      className="absolute -top-4 left-1/2 -translate-x-1/2 text-[var(--color-gold-main)]"
                                    >
                                      <Droplets size={14} className="fill-[var(--color-gold-main)]" />
                                    </motion.div>
                                  )}
                                </motion.div>

                                {/* Objective text */}
                                <motion.div 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.6 + idx * 0.2 }}
                                  className="mt-4 sm:mt-6 flex flex-col items-center gap-1 sm:gap-2 max-w-[90px] sm:max-w-[130px] px-1 text-center mx-auto"
                                >
                                  <stepData.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'text-[var(--color-gold-main)]' : 'text-neutral-600'}`} />
                                  <div className="text-center">
                                    <div className={`text-xs sm:text-sm font-black uppercase leading-tight ${isActive ? 'text-white' : 'text-neutral-400'}`}>
                                      {stepData.title}
                                    </div>
                                    <div className={`text-[10px] sm:text-xs font-bold leading-tight ${isActive ? 'text-[var(--color-gold-main)]' : 'text-neutral-600'}`}>
                                      {stepData.subtitle}
                                    </div>
                                  </div>
                                </motion.div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {mode === 'celebration' && (
                        <>
                          <motion.div
                              initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.5 }}
                            className="w-full mt-4 mb-2 text-left bg-[#111] border border-[var(--color-gold-main)]/20 rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold-main)]/5 to-transparent pointer-events-none" />
                            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                              <Target size={60} />
                            </div>
                            <div className="space-y-4 text-xs sm:text-sm text-neutral-200 font-medium relative z-10 px-2">
                              {completedStep === 1 ? (
                                <>
                                  <p className="flex items-start gap-3">
                                    <span className="text-xl sm:text-2xl leading-none">🚀</span> 
                                    <span>Ton business est <strong className="text-white text-base">officiellement lancé.</strong></span>
                                  </p>
                                  <p className="flex items-start gap-3 pt-3 border-t border-[var(--color-gold-main)]/10">
                                    <span className="text-xl sm:text-2xl leading-none mt-1">🔥</span> 
                                    <span className="text-[var(--color-gold-main)] font-black uppercase tracking-tight leading-tight">Continue comme ça ! Chaque action te rapproche de tes premiers revenus.</span>
                                  </p>
                                </>
                              ) : completedStep === 2 ? (
                                <>
                                  <p className="flex items-start gap-3">
                                    <span className="text-xl sm:text-2xl leading-none">💸</span> 
                                    <span>Boom ! Tu as fait ta <strong className="text-white text-base">première vente !</strong></span>
                                  </p>
                                  <p className="flex items-start gap-3 pt-3 border-t border-[var(--color-gold-main)]/10">
                                    <span className="text-xl sm:text-2xl leading-none mt-1">🔥</span> 
                                    <span className="text-[var(--color-gold-main)] font-black uppercase tracking-tight leading-tight">La glace est brisée. Maintenant, l'objectif est d'exploser tes ventes.</span>
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="flex items-center gap-3">
                                    <span className="text-xl sm:text-2xl leading-none">🏆</span> 
                                    <span>Défi accompli avec <strong className="text-[var(--color-gold-main)] text-base">succès !</strong></span>
                                  </p>
                                  <p className="flex items-start gap-3 pt-3 border-t border-[var(--color-gold-main)]/10">
                                    <span className="text-xl sm:text-2xl leading-none mt-1">👑</span> 
                                    <span className="text-white font-black uppercase tracking-tight leading-tight">Tu es maintenant un vrai membre de la MZ+. Visite et admire tes résultats !</span>
                                  </p>
                                </>
                              )}
                            </div>
                          </motion.div>
                          
                          <button
                            onClick={handleShareChallenge}
                            disabled={isSharing}
                            className="w-full mt-4 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                          >
                            {isSharing ? (
                              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Share2 size={16} />
                            )}
                            {isSharing ? 'PARTAGE EN COURS...' : 'PARTAGER SUR WHATSAPP'}
                          </button>
                        </>
                      )}

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mode === 'celebration' ? 3.5 : 1.5, type: "spring", stiffness: 400, damping: 15 }}
                        className="w-full max-w-sm mx-auto relative group perspective-1000 mt-4"
                      >
                        <div className="absolute inset-0 bg-[var(--color-gold-main)] blur-xl opacity-20 rounded-2xl transition-all group-hover:opacity-40 group-hover:blur-2xl" />
                        <button
                          onClick={() => {
                            if (mode === 'intro') {
                              window.dispatchEvent(new Event('mz-challenge-3j-started'));
                              onAccept();
                            } else if (mode === 'celebration') {
                              if (completedStep < 3) {
                                setModalStep('prepare_next_day');
                              } else {
                                onAccept();
                                setTimeout(() => {
                                   window.dispatchEvent(new CustomEvent('mz-axis-message', { 
                                     detail: { 
                                       text: "🎉 Tu déchires ! Bravo pour avoir complété ce défi des 3 jours !",
                                       type: "success",
                                       duration: 10000
                                     } 
                                   }));
                                }, 500);
                              }
                            } else if (mode === 'day2_fail_intro') {
                               setModalStep('day2_fail_upsell');
                            }
                          }}
                          className="relative w-full py-5 rounded-2xl bg-[var(--color-gold-main)] text-black font-black text-lg md:text-xl uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform-gpu hover:shadow-[0_0_30px_rgba(201,168,76,0.6)]"
                        >
                          <span className="relative z-10 drop-shadow-sm flex items-center gap-2">
                            {mode === 'celebration' ? 'Passer à la suite 👉' : mode === 'day2_fail_intro' ? 'Passer à la suite 👉' : '👉 Commencer le défi'}
                          </span>
                          
                          {/* Gliding shine effect */}
                          <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-25deg] z-20 pointer-events-none mix-blend-overlay" />
                        </button>
                      </motion.div>

                    </motion.div>
                  ) : modalStep === 'prepare_next_day' ? (
                    <motion.div
                      key="prepare_next_day"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                      className="w-full flex flex-col items-center py-4 relative"
                    >
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter mb-6 text-center mt-2">
                        Prépare-toi pour <span className="text-[var(--color-gold-main)]">demain !</span>
                      </h2>

                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-full mb-8 text-left bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                          <Zap size={60} />
                        </div>
                        <div className="space-y-4 text-xs sm:text-sm text-neutral-300 font-medium relative z-10">
                          <p className="flex items-start gap-3">
                            <span className="text-lg leading-none">⏳</span> 
                            <span>Le Jour {completedStep + 1} sera débloqué <strong className="text-white">demain.</strong></span>
                          </p>
                          <p className="flex items-start gap-3 pt-3 border-t border-[var(--color-gold-main)]/10">
                            <span className="text-lg leading-none">🎯</span> 
                            <span className="text-[var(--color-gold-main)] font-black uppercase tracking-tight leading-tight">
                              {completedStep === 1 
                                ? "La mission sera de faire ta première vente !"
                                : "Prépare-toi pour la suite, on va faire exploser tes résultats !"}
                            </span>
                          </p>
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full max-w-[200px] mx-auto flex flex-col gap-3"
                      >
                        <button
                          onClick={() => {
                            onAccept();
                            setTimeout(() => {
                               const msg = completedStep === 1 
                                 ? "T'inquiète je vais aussi t'aider pour le jour 2 😎" 
                                 : "🔥 C'est le moment d'allumer le feu ! Je suis fier de toi.";
                                 
                               window.dispatchEvent(new CustomEvent('mz-axis-message', { 
                                 detail: { 
                                   text: msg,
                                   type: "progression",
                                   duration: 10000
                                 } 
                               }));
                            }, 500);
                          }}
                          className="w-full py-3 sm:py-4 rounded-xl bg-[var(--color-gold-main)] text-black font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shadow-[0_5px_15px_rgba(201,168,76,0.3)] hover:shadow-[0_0_20px_rgba(201,168,76,0.5)]"
                        >
                          Compris 👉
                        </button>
                      </motion.div>
                    </motion.div>
                  ) : modalStep === 'day2_intro_screen' ? (
                    <motion.div
                      key="day2_intro_screen"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                      className="w-full flex flex-col items-center py-4 relative"
                    >
                      {onClose && (
                        <button 
                          onClick={onClose}
                          className="absolute -top-2 right-0 p-2 text-neutral-500 hover:text-white transition-colors z-50 bg-white/5 rounded-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      )}
                      
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter mb-6 text-center mt-6">
                        👋 Jour 2 — <span className="text-[var(--color-gold-main)]">on continue !</span>
                      </h2>

                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-full mb-8 text-left bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                          <Rocket size={60} />
                        </div>
                        <div className="space-y-4 text-xs sm:text-sm text-neutral-300 font-medium relative z-10">
                          <p className="flex items-start gap-3">
                            <span className="text-lg leading-none">🔥</span> 
                            <span>Aujourd'hui, tu vas découvrir <strong className="text-white">comment faire ta première vente.</strong></span>
                          </p>
                          <p className="flex items-start gap-3 pt-3 border-t border-[var(--color-gold-main)]/10">
                            <span className="text-lg leading-none">🎯</span> 
                            <span className="text-[var(--color-gold-main)] font-black uppercase tracking-tight leading-tight">Une étape clé pour transformer tes actions en résultats.</span>
                          </p>
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full max-w-[200px] mx-auto flex flex-col gap-3"
                      >
                        <button
                          onClick={onAccept}
                          className="w-full py-3 sm:py-4 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shadow-md"
                        >
                          Voir le Jour 2
                        </button>
                        {onClose && (
                          <button
                            onClick={onClose}
                            className="w-full py-2 rounded-xl text-neutral-500 font-bold text-xs uppercase tracking-wider transition-colors hover:text-white"
                          >
                            Plus tard
                          </button>
                        )}
                      </motion.div>
                    </motion.div>
                  ) : modalStep === 'day3_intro_screen' ? (
                    <motion.div
                      key="day3_intro_screen"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                      className="w-full flex flex-col items-center py-4 relative"
                    >
                      {onClose && (
                        <button 
                          onClick={onClose}
                          className="absolute -top-2 right-0 p-2 text-neutral-500 hover:text-white transition-colors z-50 bg-white/5 rounded-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      )}
                      
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter mb-6 text-center mt-6">
                        👋 Jour 3 — <span className="text-emerald-400">On explose !</span>
                      </h2>

                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-full mb-8 text-left bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                          <Rocket size={60} />
                        </div>
                        <div className="space-y-4 text-xs sm:text-sm text-neutral-300 font-medium relative z-10">
                          {hasFailedDay2 ? (
                            <p className="flex items-start gap-3">
                              <span className="text-lg leading-none">🎯</span> 
                              <span>Pas de panique pour hier, on passe à <strong className="text-white">la vitesse superieure !</strong></span>
                            </p>
                          ) : (
                            <p className="flex items-start gap-3">
                              <span className="text-lg leading-none">🔥</span> 
                              <span>Incroyable, tu as fait ta <strong className="text-white">première vente !</strong></span>
                            </p>
                          )}
                          <p className="flex items-start gap-3 pt-3 border-t border-emerald-400/10">
                            <span className="text-lg leading-none">💰</span> 
                            <span className="text-emerald-400 font-black uppercase tracking-tight leading-tight">Ta mission : {hasFailedDay2 ? "appliquer les méthodes premium pour exploser" : "répéter l'opération pour exploser"} tes résultats !</span>
                          </p>
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full max-w-[200px] mx-auto flex flex-col gap-3"
                      >
                        <button
                          onClick={onAccept}
                          className="w-full py-3 sm:py-4 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shadow-md"
                        >
                          C'est parti !
                        </button>
                        {onClose && (
                          <button
                            onClick={onClose}
                            className="w-full py-2 rounded-xl text-neutral-500 font-bold text-xs uppercase tracking-wider transition-colors hover:text-white"
                          >
                            Plus tard
                          </button>
                        )}
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {showWhatsAppModal && (
                <WhatsAppShareModal 
                  isOpen={showWhatsAppModal}
                  onClose={() => {
                    setShowWhatsAppModal(false);
                    onAccept();
                  }}
                  onShare={executeWhatsAppShare}
                  title="Force à la Communauté"
                  description="Félicitations pour cette étape ! Partage ton succès pour motiver le reste du groupe sur WhatsApp."
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
