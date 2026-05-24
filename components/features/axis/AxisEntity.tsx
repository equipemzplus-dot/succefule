import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAxis, AxisState } from './AxisProvider.tsx';
import { MessageSquare } from 'lucide-react';

// Configuration as per MZ+ Identity
export const AXIS_CONFIG: Record<AxisState, {
  color: string;
  glow: string;
  scale: number[];
  speed: number;
}> = {
  idle: {
    color: "#64748b", // Muted Slate
    glow: "rgba(100, 116, 139, 0.4)",
    scale: [1, 1.05, 1],
    speed: 4,
  },
  guiding: {
    color: "#a855f7", // Royal Purple
    glow: "rgba(168, 85, 247, 0.6)",
    scale: [1, 1.1, 1],
    speed: 3,
  },
  action: {
    color: "#eab308", // Gold Premium
    glow: "rgba(234, 179, 8, 0.6)",
    scale: [1, 1.15, 1],
    speed: 2.5,
  },
  progression: {
    color: "#d946ef", // Purple-Magenta
    glow: "rgba(217, 70, 239, 0.6)",
    scale: [1, 1.2, 1],
    speed: 2,
  },
  success: {
    color: "#fef08a", // Bright Gold
    glow: "rgba(253, 224, 71, 0.8)",
    scale: [1, 1.25, 1],
    speed: 1.5,
  },
  warning: {
    color: "#f97316", // Orange 500
    glow: "rgba(249, 115, 22, 0.6)",
    scale: [1, 1.1, 1],
    speed: 3,
  },
  inactive: {
    color: "#1e293b",
    glow: "rgba(30, 41, 59, 0.2)",
    scale: [0.95, 1, 0.95],
    speed: 6,
  }
};

export const AxisLogo = ({ state, size = "w-12 h-12" }: { state: AxisState, size?: string }) => {
  const config = AXIS_CONFIG[state];

  return (
    <motion.div 
      className={`relative ${size} rounded-[14px] bg-[#0A0908] border border-white/10 shadow-xl flex items-center justify-center overflow-hidden`}
      animate={{ 
        boxShadow: [`0 0 0px ${config.glow}`, `0 0 20px ${config.glow}`, `0 0 0px ${config.glow}`],
        borderColor: state !== 'inactive' ? config.color : 'rgba(255,255,255,0.1)'
      }}
      transition={{ duration: config.speed, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Background ambient glow inside the box */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        style={{ background: `radial-gradient(circle at 50% 50%, ${config.color}, transparent 70%)` }}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: config.speed, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Abstract geometric AI shape (4-pointed sharp star / diamond) */}
      <motion.svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="w-5 h-5 relative z-10"
        animate={{ scale: config.scale }}
        transition={{ duration: config.speed / 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.path 
          d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" 
          stroke={config.color} 
          strokeWidth="1.5" 
          strokeLinejoin="round"
          animate={{ 
            rotate: state === 'progression' ? 90 : 0
          }}
          transition={{ 
            duration: state === 'progression' ? 2 : config.speed, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.circle 
          cx="12" cy="12" r="2" 
          fill={config.color}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: config.speed, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </motion.div>
  );
};

export const AxisEntity = () => {
  const { axisState, axisMessage, axisAction, axisPosition, isVisible, hideAxis, isChatOpen, isChatUnlocked, isDisabled, setIsDisabled } = useAxis();
  
  const [smartPosition, setSmartPosition] = useState<'top-right' | 'bottom-right'>('bottom-right');

  useEffect(() => {
    if (axisPosition === 'smart' && isVisible) {
      const checkPosition = () => {
        // Look for any highlighted element
        const highlighted = document.querySelector('.mz-highlighted-btn') || 
                            document.querySelector('.animate-\\[pulse_1\\.5s_ease-in-out_infinite\\]') || 
                            document.querySelector('.ring-4.ring-\\[\\#10b981\\]\\/30');
        if (highlighted) {
          const rect = highlighted.getBoundingClientRect();
          // If the element is in the bottom half of the screen, put Axis at the top.
          if (rect.top > window.innerHeight / 2) {
            setSmartPosition('top-right');
          } else {
            setSmartPosition('bottom-right');
          }
        }
      };
      checkPosition();
      const interval = setInterval(checkPosition, 500);
      return () => clearInterval(interval);
    }
  }, [axisPosition, isVisible]);

  const config = AXIS_CONFIG[axisState];

  const showMessage = isVisible && axisMessage !== null;

  // The orb is always there as an ambient companion, unless it's disabled or chat is open.
  const showOrb = !isDisabled && !isChatOpen;

  const effectivePosition = axisPosition === 'smart' ? smartPosition : axisPosition;

  let positionClasses = "fixed bottom-20 right-4 sm:bottom-12 sm:right-10 flex-col items-end";
  let messageOriginClass = "origin-bottom-right";
  let triangleClass = "absolute -bottom-2.5 right-6 w-5 h-5 bg-[#0a0908] border-r-2 border-b-2 transform rotate-45 z-[-1]";
  const triangleStyle = { borderColor: config.color };

  if (effectivePosition === 'top-right') {
    positionClasses = "fixed top-20 right-4 sm:top-24 sm:right-10 flex-col-reverse items-end";
    messageOriginClass = "origin-top-right";
    triangleClass = "absolute -top-2.5 right-6 w-5 h-5 bg-[#0a0908] border-l-2 border-t-2 transform rotate-45 z-[-1]";
  } else if (effectivePosition === 'top-left') {
    positionClasses = "fixed top-20 left-4 sm:top-24 sm:left-10 flex-col-reverse items-start";
    messageOriginClass = "origin-top-left";
    triangleClass = "absolute -top-2.5 left-6 w-5 h-5 bg-[#0a0908] border-l-2 border-t-2 transform rotate-45 z-[-1]";
  } else if (effectivePosition === 'bottom-left') {
    positionClasses = "fixed bottom-20 left-4 sm:bottom-12 sm:left-10 flex-col items-start";
    messageOriginClass = "origin-bottom-left";
    triangleClass = "absolute -bottom-2.5 left-6 w-5 h-5 bg-[#0a0908] border-r-2 border-b-2 transform rotate-45 z-[-1]";
  } else if (effectivePosition === 'top-center' || effectivePosition === 'center-modal') {
    positionClasses = "fixed top-[10%] left-1/2 -translate-x-1/2 flex-col-reverse items-center z-[9999]"; // high z for modal
    messageOriginClass = "origin-top";
    triangleClass = "absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#0a0908] border-l-2 border-t-2 transform rotate-45 z-[-1]";
  }

  return (
    <>
      <motion.div 
        layout 
        className={`${positionClasses} z-[99999] flex gap-5 pointer-events-none`}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {showMessage && (
            <motion.div
              key="axis-message"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`pointer-events-auto bg-[#0a0908]/95 backdrop-blur-3xl border-2 p-4 sm:p-5 rounded-2xl max-w-[280px] sx:max-w-[300px] sm:max-w-[340px] relative ${messageOriginClass}`}
              style={{ borderColor: config.color, boxShadow: `0 15px 40px ${config.glow}` }}
            >
               <button 
                  onClick={hideAxis}
                  className="absolute top-1 right-1 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors"
                  title="Masquer le message"
               >
                  <span className="text-sm">✕</span>
               </button>

               {/* Small triangle pointing to the orb */}
               <div 
                  className={triangleClass}
                  style={triangleStyle}
               ></div>
               
               <div className="text-white text-[14px] sm:text-[15px] font-semibold tracking-wide leading-relaxed whitespace-pre-wrap">
                 {axisMessage}
               </div>

               {axisAction && (
                 <div className="mt-5 flex flex-col gap-3">
                   <motion.button
                      onClick={() => {
                        hideAxis();
                        setTimeout(() => {
                          if (axisAction?.action) {
                            axisAction.action();
                          }
                        }, 600);
                      }}
                      className={`w-full py-3 font-extrabold text-[13px] rounded-xl uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all overflow-hidden relative group ${
                        axisAction.isPremium 
                          ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white border border-purple-400/30' 
                          : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black border border-yellow-300/50'
                      }`}
                      animate={{ 
                        scale: [1, 1.02, 1],
                        boxShadow: axisAction.isPremium 
                          ? [
                              "0 0 20px rgba(168,85,247,0.4)",
                              "0 0 35px rgba(168,85,247,0.7)",
                              "0 0 20px rgba(168,85,247,0.4)"
                            ]
                          : [
                              "0 0 20px rgba(250,204,21,0.5)",
                              "0 0 35px rgba(250,204,21,0.8)",
                              "0 0 20px rgba(250,204,21,0.5)"
                            ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                   >
                     {axisAction.isPremium && <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:opacity-100 opacity-60 z-20 pointer-events-none mix-blend-overlay" />}
                     <span className="relative z-10 flex items-center gap-2">{axisAction.label} {!axisAction.isPremium && <span className="text-[16px]">⚡</span>}</span>
                   </motion.button>

                   {axisAction.secondaryLabel && axisAction.secondaryAction && (
                     <button
                        onClick={() => {
                          hideAxis();
                          setTimeout(() => {
                            if (axisAction?.secondaryAction) {
                              axisAction.secondaryAction();
                            }
                          }, 600);
                        }}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 font-bold text-[11px] rounded-xl uppercase tracking-widest transition-all border border-white/5"
                     >
                       {axisAction.secondaryLabel}
                     </button>
                   )}
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showOrb && (
            <motion.div
              key="axis-orb"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="pointer-events-auto cursor-pointer relative group"
              onClick={() => {
                if (showMessage) hideAxis();
                else {
                  window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'axis' }));
                }
              }}
            >
              <AxisLogo state={axisState} />
              
              <motion.div 
                 className="absolute -top-3 -left-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#0a0908] opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 cursor-pointer shadow-lg"
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsDisabled(true);
                 }}
                 title="Désactiver l'assistant Axis"
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.9 }}
              >
                 <span className="text-[12px] text-white font-black">✕</span>
              </motion.div>

              {isChatUnlocked && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0a0908] opacity-0 group-hover:opacity-100 transition-opacity">
                   <MessageSquare size={10} className="text-black" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
