import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Star, Coins } from 'lucide-react';
import { supabase } from '../../../services/supabase.ts';
import { GoldBorderCard, PrimaryButton, GoldText } from '../../UI.tsx';

export const XPRewardModal = ({ isVisible, amount, title, description, onComplete }: { isVisible: boolean, amount: number, title?: string, description?: string, onComplete: () => void }) => {
  const [displayAmount, setDisplayAmount] = useState(0);
  const [isClaimed, setIsClaimed] = useState(false);
  const [showFlyingCoins, setShowFlyingCoins] = useState(false);
  const [customSounds, setCustomSounds] = useState<{ [category: string]: string }>({});

  useEffect(() => {
    const fetchCustomSounds = async () => {
      try {
        const { data, error } = await supabase.from('mz_sound_effects').select('*');
        if (data && !error) {
          const mapping: { [category: string]: string } = {};
          data.forEach(s => {
            if (s.category && s.url) mapping[s.category] = s.url;
          });
          setCustomSounds(mapping);
        }
      } catch (e) {
        console.error('Could not load custom sounds', e);
      }
    };
    fetchCustomSounds();
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isVisible) {
      setIsClaimed(false);
      setShowFlyingCoins(false);
      setShockwave(false);
      
      // Play sounds immediately to sync perfectly with animation start
      playSound('reward_appear');
      playSound('gift');
      
      // Start counting up right after initial appearance starts
      let startTimestamp: number;
      const duration = 1200;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setDisplayAmount(Math.floor(easeProgress * amount));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      
      // A tiny delay before counting so the number doesn't pop in mid-animation
      timeout = setTimeout(() => window.requestAnimationFrame(step), 150);
      
    } else {
      setDisplayAmount(0);
      setIsClaimed(false);
      setShowFlyingCoins(false);
      setShockwave(false);
    }
    return () => clearTimeout(timeout);
  }, [isVisible, amount]);

  const [shockwave, setShockwave] = useState(false);

  const handleClaim = () => {
    playSound('reward_claim');
    setIsClaimed(true);
    setShockwave(true);
    
    // Start coins slightly after the shockwave
    setTimeout(() => {
      setShowFlyingCoins(true);
    }, 100);

    // Badge appears when the first coins reach the profile button
    setTimeout(() => {
      window.dispatchEvent(new Event('mz-profile-badge'));
      playSound('coins');
    }, 1200);

    // Complete the modal flow after coins are confirmed to have landed
    setTimeout(() => {
      onComplete();
    }, 2500);
  };

  const playSound = (type: 'reward_appear' | 'reward_claim' | 'success' | 'gift' | 'coins') => {
    try {
      // First try custom sound mapping by category name
      let searchKey = type;
      if (type === 'coins' || type === 'reward_claim') searchKey = 'reward_claim';
      if (type === 'success' || type === 'reward_appear') searchKey = 'reward_appear';
      
      const customUrl = customSounds[searchKey];
      if (customUrl) {
         const audio = new Audio(customUrl);
         audio.volume = 0.7;
         audio.play().catch(e => console.error("Could not play custom audio", e));
         return; // Skip synthetic sounds if custom URL found
      }

      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'success') {
          const osc1 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.type = 'sine'; // Lighter sound
          osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
          osc1.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
          
          osc1.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.7);
      } else if (type === 'gift') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1000, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.4);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.7);
      } else if (type === 'coins') {
          let delay = 0;
          for (let i = 0; i < 5; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1500 + i * 300, ctx.currentTime + delay);
            osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + delay + 0.1);

            gain.gain.setValueAtTime(0, ctx.currentTime + delay);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.1);
            delay += 0.05;
          }
      }
    } catch (e) {
      console.log('Audio not supported or blocked', e);
    }
  };

  const flyVariants = {
    initial: { scale: 1, filter: "blur(0px)", opacity: 1 },
    claim: {
      scale: 1.2,
      filter: "blur(10px)",
      opacity: 0,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
          <AnimatePresence>
            {!isClaimed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl pointer-events-auto"
              />
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {!isClaimed && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto max-w-[340px] w-full mx-4"
              >
                <GoldBorderCard className="relative flex flex-col items-center overflow-hidden !p-8 shadow-[0_30px_100px_rgba(0,0,0,1)] bg-black/90 backdrop-blur-2xl">
                  {/* Background glowing particles/orbs for pure dopamine */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-[var(--color-gold-main)]/10 blur-[120px] rounded-full mix-blend-screen" />
                    <div className="absolute top-1/3 left-1/3 w-[40vw] h-[40vw] bg-[var(--color-academy-purple)]/10 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow" />
                  </div>

                  {/* Top Right 'SUCCÈS !' Badge */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
                    className="absolute top-6 right-6 bg-[var(--color-gold-main)] text-black px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(201,168,76,0.3)] z-20"
                  >
                    Succès !
                  </motion.div>

                  {/* Glowing background behind icon */}
                  <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-48 h-48 bg-[var(--color-gold-main)]/10 blur-[60px] rounded-full pointer-events-none" />

                  <div className="relative flex flex-col items-center z-10 w-full">
                    {/* Squaricle Icon Container */}
                    <div className="relative mt-10 mb-8">
                      <motion.div
                         animate={{ y: [0, -10, 0] }}
                         transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                         className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 bg-[#111009] border border-[var(--color-border-gold)] rounded-3xl shadow-[0_15px_30px_rgba(201,168,76,0.2),inset_0_2px_3px_rgba(255,255,255,0.1)]"
                      >
                         <Sparkles className="w-12 h-12 text-[var(--color-gold-main)] relative z-10" strokeWidth={1.5} />
                         
                         {/* Orbiting small elements */}
                         <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                           <Star className="w-5 h-5 text-yellow-300 fill-yellow-300 absolute -top-2 -right-2 drop-shadow-md" />
                         </motion.div>
                         <motion.div className="absolute inset-0" animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }}>
                           <Star className="w-4 h-4 text-[#9B6BFF] fill-[#9B6BFF] absolute -bottom-1 -left-1 drop-shadow-md" />
                         </motion.div>
                      </motion.div>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="text-center w-full mb-8">
                      <GoldText className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm mb-2 block">
                        {title || "Félicitations !"}
                      </GoldText>
                      {description ? (
                        <p className="text-[#a19d93] text-sm font-bold mt-2 leading-relaxed px-2 whitespace-pre-wrap">
                          {description}
                        </p>
                      ) : (
                        <p className="text-[#a19d93] text-xs sm:text-sm font-bold italic uppercase tracking-widest px-2">
                          Bonus MZ+
                        </p>
                      )}
                    </div>

                    {/* Points Section */}
                    <div className="flex flex-col items-center justify-center w-full mb-8 relative">
                      <div className="absolute inset-0 bg-[var(--color-gold-main)]/5 blur-2xl rounded-full scale-150" />
                      <span className="relative text-[11px] font-black text-[var(--color-gold-main)] uppercase tracking-[0.2em] mb-1 drop-shadow-md">
                        Points Gagnés
                      </span>
                      <span className="relative text-7xl sm:text-[5.5rem] leading-none font-black text-white drop-shadow-[0_4px_20px_rgba(201,168,76,0.3)] tracking-tighter mb-2">
                        +{displayAmount}
                      </span>
                      <span className="relative text-[#a19d93] text-[11px] font-bold italic tracking-widest uppercase">
                        XP MZ+
                      </span>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="w-full relative z-20">
                    <PrimaryButton
                      fullWidth
                      size="lg"
                      onClick={handleClaim}
                    >
                      RÉCUPÉRER
                    </PrimaryButton>
                  </div>
                </GoldBorderCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flying coins animation upon claim (renders at root level to ignore popup box overflow) */}
          {showFlyingCoins && Array.from({ length: 25 }).map((_, i) => {
            // Default target (bottom-center for mobile, top-left for desktop if not found)
            let xTarget = window.innerWidth > 768 ? -window.innerWidth / 2 + 100 : 0;
            let yTarget = window.innerHeight > 768 ? -window.innerHeight / 2 + 100 : window.innerHeight / 2 - 50;
            
            const profileNavs = document.querySelectorAll('#nav-profile');
            for (const nav of Array.from(profileNavs)) {
              const rect = nav.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                // If visible, compute correct offset relative to center (because coins start at left-1/2 top-1/2)
                xTarget = rect.left + rect.width / 2 - window.innerWidth / 2;
                yTarget = rect.top + rect.height / 2 - window.innerHeight / 2;
                break;
              }
            }
            
            // "Fountain" effect: burst upwards then fly to the target
            const controlPointX = (Math.random() - 0.5) * 200;
            const controlPointY = -(Math.random() * 250) - 100;
            
            return (
              <motion.div
                key={`coin-${i}`}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ 
                  x: [0, controlPointX, xTarget], 
                  y: [0, controlPointY, yTarget],
                  scale: [0, Math.random() * 0.8 + 1.2, 0.3],
                  opacity: [0, 1, 1, 0],
                  rotate: [0, Math.random() * 360, Math.random() * 1080]
                }}
                transition={{ 
                  duration: 0.9 + Math.random() * 0.4, 
                  delay: i * 0.04, 
                  times: [0, 0.4, 0.8, 1],
                  ease: "easeInOut" 
                }}
                className="absolute top-1/2 left-1/2 text-4xl drop-shadow-[0_0_20px_rgba(253,224,71,0.8)] z-[99999] pointer-events-none"
                style={{ position: 'fixed' }}
              >
                <div className="relative">
                  <Coins className="w-10 h-10 text-[var(--color-gold-main)] fill-[var(--color-gold-main)] drop-shadow-[0_0_15px_rgba(201,168,76,1)]" />
                  {/* Small trail behind coin */}
                  <motion.div 
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 0.2 }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                    className="absolute inset-0 bg-yellow-400 blur-md rounded-full -z-10"
                  />
                </div>
              </motion.div>
            );
          })}
          
          {/* Massive Shockwave On Click */}
          {shockwave && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 10, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 w-64 h-64 -mx-32 -my-32 rounded-full border-[10px] border-yellow-400 mix-blend-screen pointer-events-none z-[9999]"
              style={{ position: 'fixed' }}
            />
          )}

        </div>
      )}
    </AnimatePresence>
  );
};
