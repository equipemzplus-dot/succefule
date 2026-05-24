import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, Download, CheckCircle, ChevronRight, DownloadCloud, Crown, ChevronLeft, ChevronRight as ChevronRightIcon, Share2 } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { RankReward, UserProfile } from '../../../types';
import confetti from 'canvas-confetti';
import { shareEvolution, getEvolutionMessages, generateWhatsAppLink } from '../../../services/evolutionService';
import { WhatsAppShareModal } from '../community/WhatsAppShareModal';

interface RankCelebrationOverlayProps {
  profile: UserProfile;
  onClose: () => void;
}

export const RankCelebrationOverlay: React.FC<RankCelebrationOverlayProps> = ({ profile, onClose }) => {
  const [rewards, setRewards] = useState<RankReward[]>([]);
  const [step, setStep] = useState<'celebration' | 'selection' | 'claimed'>('celebration');
  const [selectedReward, setSelectedReward] = useState<RankReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Sound effects
  useEffect(() => {
    try {
      const url = step === 'claimed' 
        ? 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
        : 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'; // Celebration sound
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play blocked:', e));
    } catch(e) {}
  }, [step]);
  
  const handleShare = async () => {
    if (isSharing || hasShared) return;
    setIsSharing(true);
    try {
      const messages = getEvolutionMessages(profile.full_name || profile.username, profile.rank_name || 'Élite');
      const message = messages[Math.floor(Math.random() * messages.length)];
      setShareMessage(message);
      
      await shareEvolution({
        user_id: profile.id,
        user_name: profile.full_name || profile.username,
        type: 'level_up',
        old_level: 'Membre',
        new_level: profile.rank_name || 'Élite',
        message: message
      });
      setHasShared(true);
      setShowWhatsAppModal(true);
    } catch (error) {
      console.error("Error sharing evolution:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const executeWhatsAppShare = () => {
    const link = generateWhatsAppLink(shareMessage);
    window.open(link, '_blank');
    setShowWhatsAppModal(false);
  };

  // Fetch Rewards
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        // 1. Fetch already claimed rewards by this user
        const { data: claimedData } = await supabase
          .from('user_rank_rewards')
          .select('reward_id')
          .eq('user_id', profile.id);
        
        const claimedIds = claimedData?.map(c => c.reward_id) || [];

        // 2. Fetch active rewards
        const { data, error } = await supabase
          .from('rank_rewards')
          .select('*')
          .eq('is_active', true);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // 3. Filter out already claimed rewards
          const availableRewards = data.filter(r => !claimedIds.includes(r.id));
          
          if (availableRewards.length === 0) {
              setRewards([]);
              return;
          }

          // 4. Shuffle and pick exactly 3 (if possible)
          const shuffled = availableRewards.sort(() => 0.5 - Math.random());
          setRewards(shuffled.slice(0, 3)); 
        }
      } catch (e) {
        console.error("Error fetching rewards:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, [profile.id]);

  const handleClaim = async (reward: RankReward) => {
    setSelectedReward(reward);
    try {
      const { error } = await supabase.from('user_rank_rewards').insert([{
        user_id: profile.id,
        rank_id: profile.rank_id,
        reward_id: reward.id
      }]);
      if (error) throw error;
      setStep('claimed');
    } catch (e) {
      console.error("Error claiming reward:", e);
      setStep('claimed');
    }
  };

  // Confetti effect
  useEffect(() => {
    if (step === 'celebration') {
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [step]);

  const nextReward = () => {
    setCurrentIndex((prev) => (prev + 1) % rewards.length);
  };
  
  const prevReward = () => {
    setCurrentIndex((prev) => (prev - 1 + rewards.length) % rewards.length);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-neutral-950/95 backdrop-blur-2xl"
        />
        
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/20 blur-[120px]" />
        </div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          className="relative w-full max-w-5xl z-10 h-full max-h-[900px] flex items-center justify-center"
        >
          {step === 'celebration' && (
            <div className="w-full flex flex-col items-center justify-center text-center p-6 space-y-10">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 1.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-amber-400 rounded-full blur-2xl opacity-50 animate-pulse" />
                <div className="w-40 h-40 md:w-56 md:h-56 bg-gradient-to-tr from-purple-600 to-amber-500 rounded-full flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/10">
                  <Crown className="w-20 h-20 md:w-32 md:h-32 text-white drop-shadow-md" />
                </div>
              </motion.div>
              
              <div className="space-y-4 max-w-3xl">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-300 tracking-tight"
                >
                  NIVEAU ATTEINT !
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-xl md:text-3xl text-neutral-300 font-medium leading-relaxed"
                >
                  Félicitations, vous êtes maintenant <strong className="text-white font-black">{profile.rank_name || `Niveau ${profile.rank_id}`}</strong>.
                  <br className="hidden md:block" /> En récompense de vos efforts, vous débloquez un accès exclusif.
                </motion.p>
              </div>
              
              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                onClick={() => setStep('selection')}
                className="group relative px-8 py-5 md:px-12 md:py-6 bg-white rounded-full overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-neutral-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-3 text-xl md:text-2xl font-black text-neutral-950">
                  <Gift className="text-purple-600" />
                  DÉCOUVRIR MA RÉCOMPENSE
                  <ChevronRight />
                </span>
              </motion.button>
            </div>
          )}

          {step === 'selection' && (
            <div className="w-full h-full flex flex-col pt-8 md:pt-12 relative">
              <div className="text-center mb-8 shrink-0 px-4">
                <h3 className="text-3xl md:text-5xl font-black text-white mb-3">Votre Récompense</h3>
                <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">Glissez pour découvrir les kits exclusifs. Vous ne pouvez en choisir qu'un seul.</p>
              </div>
              
              {loading ? (
                <div className="flex-1 flex justify-center items-center">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : rewards.length > 0 ? (
                <div className="flex-1 relative flex items-center justify-center w-full max-w-[100vw] overflow-hidden px-4 md:px-16">
                  
                  {/* Desktop Controls */}
                  <button 
                    onClick={prevReward} 
                    className="hidden md:flex absolute left-0 z-20 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-full items-center justify-center transition-all disabled:opacity-50"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  
                  <div className="relative w-full max-w-[340px] md:max-w-md h-[450px] md:h-[550px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -100, scale: 0.9 }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                          const swipe = Math.abs(offset.x) * velocity.x;
                          if (swipe < -1000) nextReward();
                          else if (swipe > 1000) prevReward();
                        }}
                        className="absolute inset-0 bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl cursor-grab active:cursor-grabbing"
                      >
                        <div className="h-[75%] relative group">
                          {rewards[currentIndex].image_url ? (
                            <img 
                              src={rewards[currentIndex].image_url} 
                              alt={rewards[currentIndex].title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              draggable={false}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gradient-to-tr from-neutral-800 to-neutral-900 text-neutral-600">
                              <Gift size={80} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
                          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                            <span className="text-yellow-400 font-bold text-sm flex items-center gap-1">
                              <Sparkles size={14} /> {rewards[currentIndex].perceived_value || 'Premium'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="relative z-10 flex-1 flex flex-col justify-end p-6 -mt-16 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent">
                          <h4 className="font-black text-white text-2xl md:text-3xl mb-4 text-center">{rewards[currentIndex].title}</h4>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleClaim(rewards[currentIndex]); }}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white rounded-2xl font-black text-lg transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2"
                          >
                            <DownloadCloud size={24} />
                            CHOISIR CE KIT
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Desktop Controls */}
                  <button 
                    onClick={nextReward} 
                    className="hidden md:flex absolute right-0 z-20 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-full items-center justify-center transition-all disabled:opacity-50"
                  >
                    <ChevronRightIcon size={32} />
                  </button>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 px-4">
                  <Gift size={64} className="mb-4 opacity-50" />
                  <p className="text-xl">Aucune récompense disponible pour le moment.</p>
                  <button onClick={onClose} className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold">Fermer</button>
                </div>
              )}
              
              {/* Pagination Dots */}
              {rewards.length > 0 && (
                <div className="flex justify-center gap-3 mt-8 pb-8 shrink-0">
                  {rewards.map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-purple-500' : 'w-2.5 bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'claimed' && selectedReward && (
            <div className="w-full flex flex-col items-center justify-center text-center p-6 h-full max-h-[900px] overflow-y-auto custom-scrollbar">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(16,185,129,0.4)] shrink-0"
              >
                <CheckCircle size={48} className="text-white drop-shadow-lg" />
              </motion.div>
              
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-5xl font-black text-white mb-4"
              >
                C'EST À VOUS !
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg md:text-xl text-neutral-300 max-w-2xl mb-8"
              >
                La récompense <strong className="text-white font-black">{selectedReward.title}</strong> a bien été ajoutée à votre profil.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-4 w-full max-w-lg"
              >
                {!hasShared && (
                  <button 
                    onClick={handleShare}
                    disabled={isSharing}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl font-black text-lg transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                  >
                    {isSharing ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Share2 size={24} /> 
                        PARTAGER MON ÉVOLUTION
                      </>
                    )}
                  </button>
                )}
                
                {hasShared && (
                  <div className="w-full py-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl font-black text-lg flex items-center justify-center gap-2">
                    <CheckCircle size={24} /> ÉVOLUTION PARTAGÉE !
                  </div>
                )}

                {selectedReward.file_url?.startsWith('http') ? (
                  <a 
                    href={selectedReward.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white text-neutral-950 hover:bg-neutral-200 rounded-2xl font-black text-lg transition-all shadow-xl"
                  >
                    <Download size={20} /> 
                    TÉLÉCHARGER LE KIT
                  </a>
                ) : (
                  <button 
                    onClick={() => {
                      if (selectedReward.file_url) {
                        window.dispatchEvent(new CustomEvent('mz-open-reward-content', { 
                          detail: { 
                            title: selectedReward.title, 
                            text: selectedReward.file_url,
                            id: selectedReward.id,
                            imageUrl: selectedReward.image_url
                          } 
                        }));
                      }
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white text-neutral-950 hover:bg-neutral-200 rounded-2xl font-black text-lg transition-all shadow-xl"
                  >
                    <Sparkles size={20} className="text-purple-600" />
                    DÉCOUVRIR MON BONUS MAINTENANT
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-lg transition-all"
                >
                  Aller sur mon profil
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {showWhatsAppModal && (
            <WhatsAppShareModal 
              isOpen={showWhatsAppModal}
              onClose={() => setShowWhatsAppModal(false)}
              onShare={executeWhatsAppShare}
              title="Impacte la Communauté"
              description="Félicitations pour ton nouveau grade ! Partage ton succès sur WhatsApp pour motiver le reste du groupe."
            />
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

