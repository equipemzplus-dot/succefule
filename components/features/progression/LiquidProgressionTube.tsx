import React, { useEffect, useState, useRef } from 'react';
import { Shield, Star, Flame, Trophy, Crown } from 'lucide-react';

export const PROGRESSION_LEVELS = [
  { id: 'debutant', name: 'Débutant', xp: 0, color: 'from-emerald-400 to-emerald-600', hex: '#34d399', icon: Shield },
  { id: 'expert', name: 'Expert', xp: 120, color: 'from-blue-400 to-blue-600', hex: '#60a5fa', icon: Star },
  { id: 'legende', name: 'Légende', xp: 250, color: 'from-orange-400 to-red-600', hex: '#fb923c', icon: Flame },
  { id: 'pro', name: 'Pro', xp: 700, color: 'from-cyan-400 to-blue-600', hex: '#22d3ee', icon: Trophy },
  { id: 'elite', name: 'Élite', xp: 1500, color: 'from-yellow-400 to-amber-600', hex: '#facc15', icon: Crown },
];

export const getCurrentLevel = (xp: number) => {
  let currentLevelIdx = 0;
  for (let i = 0; i < PROGRESSION_LEVELS.length; i++) {
    if (xp >= PROGRESSION_LEVELS[i].xp) {
      currentLevelIdx = i;
    }
  }
  return PROGRESSION_LEVELS[currentLevelIdx];
};

interface ProgressionTubeProps {
  currentXp: number;
}

export const LiquidProgressionTube: React.FC<ProgressionTubeProps> = ({ currentXp }) => {
  const [fillWidth, setFillWidth] = useState(0);
  const [displayXp, setDisplayXp] = useState(0);
  const [showRankSparkle, setShowRankSparkle] = useState(false);
  const prevXpRef = useRef(currentXp);
  const prevLevelIdRef = useRef(getCurrentLevel(currentXp).id);

  const startXpRef = useRef(currentXp);
  const endXpRef = useRef(currentXp);

  useEffect(() => {
    const handleOverride = (e: any) => {
      const { oldXp, newXp } = e.detail;
      startXpRef.current = oldXp;
      endXpRef.current = newXp;
      runAnimation();
    };
    window.addEventListener('mz-trigger-tube-animation', handleOverride);
    return () => window.removeEventListener('mz-trigger-tube-animation', handleOverride);
  }, []);

  const updateFillWidth = (val: number) => {
    let pct = 0;
    if (val <= 0) {
      pct = 0;
    } else if (val >= 1500) {
      pct = 100;
    } else {
      for (let i = 0; i < PROGRESSION_LEVELS.length - 1; i++) {
        if (val >= PROGRESSION_LEVELS[i].xp && val < PROGRESSION_LEVELS[i + 1].xp) {
          const stepSize = 100 / (PROGRESSION_LEVELS.length - 1);
          const ratio = (val - PROGRESSION_LEVELS[i].xp) / (PROGRESSION_LEVELS[i + 1].xp - PROGRESSION_LEVELS[i].xp);
          pct = (i * stepSize) + (ratio * stepSize);
          break;
        }
      }
    }
    setFillWidth(pct);
  };

  const runAnimation = () => {
    const startXp = startXpRef.current;
    const endXp = endXpRef.current;

    const startLevel = getCurrentLevel(startXp);
    const endLevel = getCurrentLevel(endXp);
    const isRankUp = startLevel.id !== endLevel.id && endXp > startXp;

    if (startXp === endXp) {
        setDisplayXp(endXp);
        updateFillWidth(endXp);
        return;
    }

    let startTimestamp: number | null = null;
    const duration = 2500; 
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Math.floor(startXp + (endXp - startXp) * easeProgress);
      
      setDisplayXp(currentVal);
      updateFillWidth(currentVal);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        prevXpRef.current = endXp;
        setDisplayXp(endXp);
        updateFillWidth(endXp);

        if (isRankUp) {
          // Play sound immediately at the start of rank up animation
          try { window.dispatchEvent(new CustomEvent('mz-play-sound', { detail: { sound: 'surprise' } })); } catch(e) {}
          
          const element = document.getElementById('progression-section');
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          setTimeout(() => {
            setShowRankSparkle(true);
            
            setTimeout(() => {
              setShowRankSparkle(false);
              window.dispatchEvent(new CustomEvent('mz-rank-up-celebration', { 
                detail: { rankId: endLevel.id, rankName: endLevel.name } 
              }));
            }, 2500);
          }, 500);
        }
      }
    };
    
    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  };

  useEffect(() => {
    startXpRef.current = prevXpRef.current;
    endXpRef.current = currentXp;

    const cancel = runAnimation();
    return () => {
      if (cancel) cancel();
    }
  }, [currentXp]);

  let currentLevelIdx = 0;
  for (let i = 0; i < PROGRESSION_LEVELS.length; i++) {
    if (displayXp >= PROGRESSION_LEVELS[i].xp) {
      currentLevelIdx = i;
    }
  }
  const currentLvlConfig = PROGRESSION_LEVELS[currentLevelIdx];
  const nextLvlConfig = PROGRESSION_LEVELS[currentLevelIdx + 1] || currentLvlConfig;
  const isMaxLevel = currentLevelIdx === PROGRESSION_LEVELS.length - 1;

  return (
    <div id="progression-section" className="w-full bg-[#0a0a09] border border-white/5 rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden group shadow-2xl">
      {/* Dynamic environmental glow */}
      <div 
         className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] opacity-10 pointer-events-none transition-all duration-[3000ms] animate-spin-slow"
         style={{ background: `conic-gradient(from 0deg, transparent, ${currentLvlConfig.hex}40, transparent 40%)` }}
      />
      <div 
         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br opacity-20 blur-[100px] pointer-events-none transition-all duration-1000"
         style={{ backgroundImage: `linear-gradient(to right, transparent, ${currentLvlConfig.hex}, transparent)` }}
      />

      {/* Rank Up Sparkle Overlay */}
      {showRankSparkle && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-white/20 animate-pulse backdrop-blur-sm" />
          <div className="relative group/sparkle">
             {[...Array(24)].map((_, i) => (
               <div 
                 key={i}
                 className="absolute w-1 h-3 rounded-full animate-ping"
                 style={{ 
                   backgroundColor: currentLvlConfig.hex,
                   left: `${Math.cos(i * 15 * Math.PI / 180) * 150}px`,
                   top: `${Math.sin(i * 15 * Math.PI / 180) * 150}px`,
                   animationDelay: `${i * 0.05}s`,
                   transform: `rotate(${i * 15}deg)`,
                   boxShadow: `0 0 20px ${currentLvlConfig.hex}`
                 }}
               />
             ))}
             <div className="scale-[5] opacity-50 animate-bounce">
                <currentLvlConfig.icon size={48} color={currentLvlConfig.hex} className="drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-2 border-dashed rounded-full animate-spin-slow opacity-20" style={{ borderColor: currentLvlConfig.hex }} />
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col flex-wrap sm:flex-row justify-between sm:items-end gap-3 mb-16 relative z-10">
        <div>
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2" style={{ color: currentLvlConfig.hex }}>
            Grade Actuel
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: currentLvlConfig.hex }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: currentLvlConfig.hex }}></span>
            </span>
          </p>
          <div className="flex items-baseline gap-3">
             <div 
                 className="p-2 rounded-xl flex items-center justify-center bg-black/40 border border-white/10"
                 style={{ boxShadow: `0 0 20px ${currentLvlConfig.hex}30` }}
             >
                <currentLvlConfig.icon size={24} color={currentLvlConfig.hex} style={{ filter: `drop-shadow(0 0 8px ${currentLvlConfig.hex})` }} />
             </div>
            <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white drop-shadow-md">
              {currentLvlConfig.name}
            </h3>
          </div>
        </div>

        <div className="sm:text-right mt-4 sm:mt-0 bg-black/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
          <p className="text-[10px] sm:text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2 sm:justify-end">
             {isMaxLevel ? 'Niveau Élite Atteint !' : (
                <>Objectif <span style={{ color: nextLvlConfig.hex }}>{nextLvlConfig.name}</span></>
             )}
          </p>
          <div className="flex items-baseline sm:justify-end gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{displayXp}</h3>
            {!isMaxLevel && (
              <span className="text-xs sm:text-sm font-bold text-neutral-600 uppercase tracking-widest">
                / {nextLvlConfig.xp} XP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Track Section */}
      <div className="relative z-10 mx-4 sm:mx-8 mb-12 sm:mb-8 mt-10">
        
        {/* Empty Track Setup */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 sm:h-4 bg-black rounded-full border border-white/10 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] overflow-hidden">
           {/* Inner pattern */}
           <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
        </div>

        {/* Outer glowing track base */}
        <div className="relative w-full h-3 sm:h-4">
          
          {/* Active Fill Line */}
          <div 
             className="absolute top-1/2 -translate-y-1/2 left-0 h-3 sm:h-4 rounded-full transition-all ease-out z-10 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
             style={{ width: `${fillWidth}%`, transitionDuration: '50ms', background: `linear-gradient(90deg, ${PROGRESSION_LEVELS[0].hex}, ${currentLvlConfig.hex})` }}
          >
             {/* Liquid highlights on the bar */}
             <div className="absolute inset-x-0 top-0 h-[2px] bg-white/50 rounded-full mx-1"></div>
             <div className="absolute inset-x-0 bottom-0 h-[1px] bg-black/40 rounded-full mx-1"></div>
             
             {/* Energy pulses on the bar */}
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full animate-[shimmer_2s_infinite] -skew-x-12" />
             
             {/* Glow tip */}
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full blur-[8px] opacity-100 mix-blend-screen" style={{ backgroundColor: currentLvlConfig.hex }}></div>
             <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white opacity-80 shadow-[0_0_10px_white]"></div>
          </div>
        </div>

        {/* Waypoints */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-full pointer-events-none z-20">
          {PROGRESSION_LEVELS.map((lvl, index) => {
             const isUnlocked = displayXp >= lvl.xp;
             const isCurrent = currentLevelIdx === index;
             const pct = index * (100 / (PROGRESSION_LEVELS.length - 1));
             
             return (
               <div 
                 key={lvl.id} 
                 className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                 style={{ left: `${pct}%` }}
               >
                 {isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-16 h-16 rounded-full border border-current animate-[spin_4s_linear_infinite] opacity-50" style={{ borderColor: lvl.hex, borderStyle: 'dashed' }}></div>
                       <div className="absolute w-20 h-20 rounded-full bg-current opacity-20 blur-[15px] animate-pulse" style={{ backgroundColor: lvl.hex }}></div>
                    </div>
                 )}
                 
                 <div className={`relative flex items-center justify-center rounded-2xl border-[3px] transition-all duration-700
                   ${isUnlocked ? 'bg-[#0d0d0c] shadow-[0_0_20px_rgba(0,0,0,0.8)]' : 'bg-[#1a1a1a] border-white/5 opacity-50 scale-75'}
                   ${isCurrent ? 'w-12 h-12 sm:w-14 sm:h-14 scale-125 z-30' : 'w-8 h-8 sm:w-10 sm:h-10 z-10'}
                 `} style={{ 
                    borderColor: isUnlocked ? lvl.hex : 'rgba(255,255,255,0.05)',
                    boxShadow: isCurrent ? `0 0 30px ${lvl.hex}90, inset 0 0 15px ${lvl.hex}40` : (isUnlocked ? `0 0 10px ${lvl.hex}40` : '') 
                 }}>
                    {isUnlocked ? (
                       <lvl.icon size={isCurrent ? 24 : 14} className="relative z-10" color={lvl.hex} style={{ filter: `drop-shadow(0 0 8px ${lvl.hex})` }} />
                    ) : (
                       <div className="w-2 h-2 rounded-full bg-white/20"></div>
                    )}
                 </div>
                 
                 {/* Text Label beneath */}
                 <div className={`absolute top-12 sm:top-14 flex flex-col items-center transition-all ${isCurrent ? 'translate-y-2 scale-110' : ''}`}>
                   <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-500 whitespace-nowrap drop-shadow-md
                     ${isCurrent ? 'text-white' : (isUnlocked ? 'text-neutral-300' : 'text-neutral-700')}
                   `} style={{ color: isCurrent ? lvl.hex : undefined }}>
                     {lvl.name}
                   </span>
                   <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 whitespace-nowrap mt-1 bg-black/50 px-2 py-0.5 rounded border
                     ${isCurrent ? 'text-white border-white/20' : (isUnlocked ? 'text-neutral-500 border-transparent' : 'text-neutral-800 border-transparent')}
                   `}>
                     {lvl.xp} XP
                   </span>
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};

