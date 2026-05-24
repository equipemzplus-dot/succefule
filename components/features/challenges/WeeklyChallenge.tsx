import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, Clock, ArrowLeft, Users, CheckCircle2, ShoppingBag, BrainCircuit, Sparkles, PlayCircle, Star, Flame, Crown, X, Share2 } from 'lucide-react';
import { UserProfile } from '../../../types';
import { supabase } from '../../../services/supabase';
import { shareEvolution, generateWhatsAppLink, getRandomMessage } from '../../../services/evolutionService';
import { WhatsAppShareModal } from '../community/WhatsAppShareModal';

const playSound = (type: 'correct' | 'wrong' | 'start' | 'finish') => {
  try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'correct') {
          // Play a nice success chime
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.type = 'sine';
          osc2.type = 'triangle';
          
          osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
          
          // quick arpeggio
          osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
          osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); // E6
          
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          
          osc1.start(ctx.currentTime);
          osc2.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.4);
          osc2.stop(ctx.currentTime + 0.4);
      } else if (type === 'wrong') {
          // Play a soft failure error
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'start') {
          // sweep up
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(200, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'finish') {
          // Ta-da!
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
          
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.8);
      }
  } catch(e) {
      console.error(e);
  }
};

const ImmersiveQuiz = ({ 
  quizQuestions, 
  onFinished,
  onClose,
  initialScore = 0
}: { 
  quizQuestions: any[],
  onFinished: (score: number) => void,
  onClose: () => void,
  initialScore?: number
}) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(initialScore);
  const [key, setKey] = useState(0); // for animation reset

  // Only play start sound when actually starting
  const startQuiz = () => {
    playSound('start');
    setHasStarted(true);
  };

  const handleAnswer = (idx: number) => {
    setSelectedAnswer(idx);
    const correctVal = quizQuestions[currentQuestion].correct;
    const isCorrect = Array.isArray(correctVal) ? correctVal.includes(idx) : idx === correctVal;
    
    if (isCorrect) {
      playSound('correct');
      setQuizScore(s => s + (quizQuestions[currentQuestion].xp || 5));
    } else {
      playSound('wrong');
    }

    setTimeout(() => {
        if (currentQuestion < quizQuestions.length - 1) {
            setCurrentQuestion(c => c + 1);
            setSelectedAnswer(null);
            setKey(prev => prev + 1); // trigger in animation next question
        } else {
            playSound('finish');
            onFinished(isCorrect ? quizScore + (quizQuestions[currentQuestion].xp || 5) : quizScore);
        }
    }, isCorrect ? 1500 : 4000); // 1.5s for dopamine, 4s to read the correct answer
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#030303] text-white flex flex-col justify-center items-center p-4 overflow-hidden"
    >
      {/* Premium minimal background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-[#030303] to-pink-900/10" />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" 
      />

      {/* header */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose} 
        className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/[0.05] rounded-full hover:bg-white/[0.1] transition-colors z-[110] border border-white/10 backdrop-blur-md"
      >
        <X size={20} className="text-white/80" />
      </motion.button>
      
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
         <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-6 md:mb-8"
         >
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)] hidden md:block">
              <BrainCircuit size={20} className="text-purple-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white/90">
               Masterclass MZ+
            </h2>
         </motion.div>

         {!hasStarted ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-full bg-[#0a0a09]/90 border border-white/[0.08] rounded-3xl p-8 md:p-12 backdrop-blur-3xl shadow-2xl relative shadow-purple-900/10 text-center flex flex-col items-center"
           >
             <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 border border-white/5">
                <Target size={40} className="text-purple-400" />
             </div>
             
             <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
               Bienvenue dans le quiz d'aujourd'hui !
             </h3>
             <p className="text-neutral-300 text-base md:text-lg max-w-md mx-auto mb-8 leading-relaxed">
               Prouve tes connaissances sur le système d'affiliation MZ+, réponds aux questions et gagne un maximum de points d'XP pour ton classement.
             </p>
             
             <button
               onClick={startQuiz}
               className="w-full max-w-xs py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
             >
               <PlayCircle size={24} />
               Commencer le Quiz
             </button>
           </motion.div>
         ) : (
           <>
         <div className="w-full bg-[#0a0a09]/90 border border-white/[0.08] rounded-3xl p-5 md:p-8 backdrop-blur-3xl shadow-2xl relative shadow-purple-900/10">
            {/* Elegance top bar indicator */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-white/[0.05] rounded-t-3xl overflow-hidden">
                <motion.div 
                   className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                   initial={{ width: `${(currentQuestion / quizQuestions.length) * 100}%` }}
                   animate={{ width: `${((currentQuestion) / quizQuestions.length) * 100}%` }}
                   transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentQuestion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col w-full"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-purple-400 text-xs font-bold uppercase tracking-[0.1em]">
                    Question {currentQuestion + 1} <span className="opacity-40">/ {quizQuestions.length}</span>
                  </span>
                  <span className="text-purple-300 text-xs font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">+{quizQuestions[currentQuestion].xp || 5} XP</span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-medium text-white/95 leading-snug mb-6 tracking-tight">
                  {quizQuestions[currentQuestion].question}
                </h3>

                <div className="space-y-2.5 w-full">
                   {quizQuestions[currentQuestion].options.map((option: string, idx: number) => {
                      const isSelected = selectedAnswer === idx;
                      const correctVal = quizQuestions[currentQuestion].correct;
                      const isCorrect = Array.isArray(correctVal) ? correctVal.includes(idx) : idx === correctVal;
                      const showResult = selectedAnswer !== null;

                      let bgClass = "bg-white/[0.03] border-white/[0.05] text-white/80 hover:bg-white/[0.08] hover:text-white";
                      let innerCircle = "border-white/[0.15] text-transparent";
                      let shadow = "";

                      if (showResult) {
                        if (isSelected) {
                          bgClass = isCorrect 
                              ? "bg-green-500/10 border-green-500/30 text-green-400" 
                              : "bg-red-500/10 border-red-500/30 text-red-400 opacity-90";
                          innerCircle = isCorrect ? "bg-green-500/20 border-green-500 text-green-400" : "bg-red-500/20 border-red-500 text-red-400";
                          shadow = isCorrect ? "shadow-[0_0_20px_rgba(34,197,94,0.1)]" : "";
                        } else if (isCorrect) {
                          bgClass = "bg-green-500/5 border-green-500/20 text-green-400/80"; 
                          innerCircle = "border-green-500/50 text-green-500/50";
                        } else {
                          bgClass = "opacity-40 bg-transparent border-transparent text-white/40";
                          innerCircle = "border-white/5";
                        }
                      }

                      return (
                        <motion.button
                          whileHover={!showResult ? { scale: 1.005 } : {}}
                          whileTap={!showResult ? { scale: 0.99 } : {}}
                          key={idx}
                          onClick={() => !showResult && handleAnswer(idx)}
                          disabled={showResult}
                          className={`w-full text-left px-5 py-4 rounded-2xl border font-medium text-[0.95rem] md:text-[1rem] transition-all duration-300 flex items-center gap-4 ${bgClass} ${shadow}`}
                        >
                          <div className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-colors duration-300 ${innerCircle}`}>
                            {(showResult && isSelected && isCorrect) || (showResult && !isSelected && isCorrect) ? <CheckCircle2 size={12} strokeWidth={3} /> : null}
                            {showResult && isSelected && !isCorrect && <X size={12} strokeWidth={3} />}
                          </div>
                          {option}
                        </motion.button>
                      );
                   })}
                </div>
              </motion.div>
            </AnimatePresence>
         </div>
         
         <div className="h-14 mt-6 flex items-center justify-center w-full">
         <AnimatePresence>
           {selectedAnswer !== null && (() => {
              const correctVal = quizQuestions[currentQuestion].correct;
              const isCorrectAnswer = Array.isArray(correctVal) ? correctVal.includes(selectedAnswer) : selectedAnswer === correctVal;
              return (
              <motion.div 
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className={`w-full max-w-sm mx-auto px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xl border ${
                  isCorrectAnswer 
                    ? "bg-green-500/10 border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]" 
                    : "bg-red-500/10 border-red-500/20"
                }`}
              >
                 {isCorrectAnswer ? (
                     <>
                      <div className="p-1.5 bg-green-500/20 rounded-full">
                         <CheckCircle2 size={18} className="text-green-400" />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-green-400 font-semibold text-sm">Bonne réponse !</span>
                        <span className="text-green-400/80 text-sm font-bold">+{quizQuestions[currentQuestion].xp || 5} XP</span>
                      </div>
                     </>
                 ) : (() => {
                     const correctVal = quizQuestions[currentQuestion].correct;
                     const correctOptions = Array.isArray(correctVal)
                       ? correctVal.map(idx => quizQuestions[currentQuestion].options[idx])
                       : [quizQuestions[currentQuestion].options[correctVal as number]];

                     return (
                       <>
                        <div className="p-1.5 bg-red-500/20 rounded-full flex-shrink-0 mt-0.5">
                           <X size={18} className="text-red-400" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-red-400 font-medium text-sm">Oups, mauvaise réponse.</span>
                           <span className="text-red-300/80 text-xs mt-1 leading-snug">
                             La bonne réponse était : <span className="font-bold text-red-300">{correctOptions.join(' et ')}</span>
                           </span>
                        </div>
                       </>
                     );
                 })}
              </motion.div>
              );
           })()}
         </AnimatePresence>
         </div>
         </>
         )}
      </div>
    </motion.div>
  )
}

export const WeeklyChallenge: React.FC<{ profile: UserProfile, teamCount: number, onSwitchTab: (t: string) => void }> = ({ profile, teamCount, onSwitchTab }) => {
  const [claiming, setClaiming] = useState(false);
  const [claimingSales, setClaimingSales] = useState(false);
  const [claimingQuiz, setClaimingQuiz] = useState(false);
  const [claimingPremium, setClaimingPremium] = useState(false);
  const [sharingMission, setSharingMission] = useState<{ title: string; message: string } | null>(null);
  const [weeklySales, setWeeklySales] = useState(0);
  const [localTeamCount, setLocalTeamCount] = useState(teamCount);
  const [premiumTeamCount, setPremiumTeamCount] = useState(0);
  
  // Opt-in states
  const [inviteStarted, setInviteStarted] = useState(profile.store_preferences?.weekly_invite_started === true);
  const [salesStarted, setSalesStarted] = useState(profile.store_preferences?.weekly_sales_started === true);
  const [premiumStarted, setPremiumStarted] = useState(profile.store_preferences?.weekly_premium_started === true);
  
  // Quiz states
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const startChallenge = async (type: string) => {
      if (type === 'invite') setInviteStarted(true);
      if (type === 'sales') setSalesStarted(true);
      if (type === 'premium') setPremiumStarted(true);
      
      const newPrefs = { ...(profile.store_preferences || {}), [`weekly_${type}_started`]: true };
      await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', profile.id);
      profile.store_preferences = newPrefs;
  };

  const targetCount = 10;
  const xpReward = 30;
  
  const targetSales = 5;
  const xpRewardSales = 100;
  
  const xpRewardQuiz = 50;

  const targetPremium = 3;
  const xpRewardPremium = 200;

  const questClaimed = profile.store_preferences?.weekly_quest_claimed === true;
  const salesQuestClaimed = profile.store_preferences?.weekly_sales_claimed === true;
  const quizQuestClaimed = profile.store_preferences?.weekly_quiz_claimed === true;
  const premiumQuestClaimed = profile.store_preferences?.weekly_premium_claimed === true;

  const totalChallenges = 4;
  const completedChallenges = (questClaimed ? 1 : 0) + (salesQuestClaimed ? 1 : 0) + (quizQuestClaimed ? 1 : 0) + (premiumQuestClaimed ? 1 : 0);
  const allCompleted = completedChallenges === totalChallenges;

  useEffect(() => {
    setLocalTeamCount(teamCount);
  }, [teamCount]);

  useEffect(() => {
    const fetchSales = async () => {
       const startOfWeek = new Date();
       startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1)); // Lundi de cette semaine
       startOfWeek.setHours(0, 0, 0, 0);

       const { count } = await supabase
          .from('commissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .in('status', ['approved', 'pending'])
          .gte('created_at', startOfWeek.toISOString());
          
       setWeeklySales(count || 0);
    };

    const fetchTeam = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, user_level')
        .eq('referral_code_used', profile.referral_code);
        
      setLocalTeamCount(data?.length || 0);
      setPremiumTeamCount(data?.filter(u => u.user_level === 'niveau_mz_plus').length || 0);
    };

    fetchSales();
    fetchTeam();

    const saleChannel = supabase.channel(`weekly_sales_${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'commissions', filter: `user_id=eq.${profile.id}` },
        () => {
          fetchSales();
        }
      )
      .subscribe();

    const teamChannel = supabase.channel(`weekly_team_${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users', filter: `referral_code_used=eq.${profile.referral_code}` },
        () => {
          fetchTeam();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(saleChannel);
      supabase.removeChannel(teamChannel);
    };
  }, [profile.id, profile.referral_code]);

  const handleShareMission = async (title: string) => {
    if (!profile) return;
    const message = getRandomMessage('mission', { missionTitle: title });
    setSharingMission({ title, message });
  };

  const executeWhatsAppShare = async () => {
    if (!profile || !sharingMission) return;
    const { title, message } = sharingMission;
    
    try {
      await shareEvolution({
        user_id: profile.id,
        user_name: profile.full_name || profile.username,
        user_avatar: profile.avatar_url,
        type: 'achievement_unlocked',
        new_level: title,
        message: message
      });

      const whatsappLink = generateWhatsAppLink(message);
      window.open(whatsappLink, '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setSharingMission(null);
    }
  };

  const handleClaim = async () => {
    if (claiming || questClaimed || localTeamCount < targetCount) return;
    setClaiming(true);

    try {
      const newPrefs = { ...(profile.store_preferences || {}), weekly_quest_claimed: true };
      await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', profile.id);
      profile.store_preferences = newPrefs;
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#06b6d4', '#ffffff'] // blue/cyan colors for recruiter
      });

      const event = new CustomEvent('mz-xp-reward', {
        detail: { amount: xpReward, title: 'Mission Accomplie !', description: 'Quête : Le Recruteur', source: 'weekly_challenge' }
      });
      window.dispatchEvent(event);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la réclamation.");
    } finally {
      setTimeout(() => setClaiming(false), 500);
    }
  };

  const handleClaimSales = async () => {
    if (claimingSales || salesQuestClaimed || weeklySales < targetSales) return;
    setClaimingSales(true);

    try {
      const newPrefs = { ...(profile.store_preferences || {}), weekly_sales_claimed: true };
      await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', profile.id);
      profile.store_preferences = newPrefs;
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#eab308', '#f97316', '#ffffff'] // yellow/orange colors for sales
      });

      const event = new CustomEvent('mz-xp-reward', {
        detail: { amount: xpRewardSales, title: 'Mission Accomplie !', description: 'Quête : Le Vendeur d\'Élite', source: 'weekly_challenge' }
      });
      window.dispatchEvent(event);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la réclamation.");
    } finally {
      setTimeout(() => setClaimingSales(false), 500);
    }
  };

  const handleClaimPremium = async () => {
    if (claimingPremium || premiumQuestClaimed || premiumTeamCount < targetPremium) return;
    setClaimingPremium(true);

    try {
      const newPrefs = { ...(profile.store_preferences || {}), weekly_premium_claimed: true };
      await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', profile.id);
      profile.store_preferences = newPrefs;
      
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#ffffff'] // purple/pink colors for premium
      });

      const event = new CustomEvent('mz-xp-reward', {
        detail: { amount: xpRewardPremium, title: 'Mission Accomplie !', description: 'Quête : Manager Pro', source: 'weekly_challenge' }
      });
      window.dispatchEvent(event);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la réclamation.");
    } finally {
      setTimeout(() => setClaimingPremium(false), 500);
    }
  };

  const quizQuestions = [
    {
      question: "Qu’est-ce que l’affiliation MZ+ ?",
      options: [
        "Acheter des produits",
        "Promouvoir des produits digitaux et gagner une commission sur chaque vente",
        "Créer des jeux vidéo"
      ],
      correct: 1,
      xp: 5
    },
    {
      question: "Quand reçois-tu une commission ?",
      options: [
        "Quand quelqu'un clique sur ton lien",
        "Quand quelqu'un achète ton produit via ton lien",
        "Quand tu partages un produit"
      ],
      correct: 1,
      xp: 5
    },
    {
      question: "Quel est le moyen le plus rapide d’obtenir plus de clients ?",
      options: [
        "Spam partout",
        "Partager ton produit à tes proches",
        "Promouvoir ton produit sur les réseaux sociaux"
      ],
      correct: 2,
      xp: 5
    },
    {
      question: "Penses-tu qu’il faut avoir de grandes compétences pour réussir à vendre sur les réseaux sociaux ?",
      options: [
        "Oui",
        "Non"
      ],
      correct: 1,
      xp: 5
    },
    {
      question: "Qu’est-ce qui empêche certains membres d’obtenir des résultats ?",
      options: [
        "Le manque de stratégie et de passage à l’action",
        "Le manque de chance",
        "L'incompréhension"
      ],
      correct: [0, 1, 2],
      xp: 5
    },
    {
      question: "Si tu avais un accompagnement par des experts et des membres ayant déjà réussi sur MZ+, penses-tu progresser plus vite ?",
      options: [
        "Oui",
        "Non"
      ],
      correct: 0,
      xp: 5
    },
    {
      question: "À quoi sert MZ+ Premium ?",
      options: [
        "À avoir un accompagnement personnalisé par des experts afin de générer des revenus plus rapidement",
        "À gagner de l’argent automatiquement",
        "À remplacer le travail du membre"
      ],
      correct: 0,
      xp: 20
    }
  ];

  const handleClaimQuiz = async (finalScore: number) => {
    if (claimingQuiz || quizQuestClaimed) return;
    setClaimingQuiz(true);

    const earnedXp = finalScore; 
    
    if (earnedXp === 0) {
      alert("Tu n'as eu aucune bonne réponse. Réessaie pour gagner de l'XP !");
      setQuizFinished(false);
      setQuizStarted(false);
      setQuizScore(0);
      setClaimingQuiz(false);
      return;
    }

    try {
      const newPrefs = { ...(profile.store_preferences || {}), weekly_quiz_claimed: true };
      await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', profile.id);
      profile.store_preferences = newPrefs;
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#ffffff'] // purple/pink for masterclass
      });

      const event = new CustomEvent('mz-xp-reward', {
        detail: { amount: earnedXp, title: 'Masterclass MZ+ Terminée !', description: `Score : ${earnedXp} XP gagnés`, source: 'weekly_challenge' }
      });
      window.dispatchEvent(event);
      setQuizScore(finalScore);
      setQuizFinished(true);
      setQuizStarted(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la réclamation.");
    } finally {
      setTimeout(() => setClaimingQuiz(false), 500);
    }
  };

  const progressPercentage = Math.min((localTeamCount / targetCount) * 100, 100);
  const salesProgressPercentage = Math.min((weeklySales / targetSales) * 100, 100);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => onSwitchTab('profile')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
          Défis Hebdomadaires
        </h2>
      </div>

      <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black border border-indigo-500/20 rounded-[2rem] p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-20 transform rotate-12">
          <Trophy size={100} className="text-indigo-400" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-500/30 flex items-center gap-1">
              <Sparkles size={12} />
              Nouveau
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider rounded-full border border-green-500/30 flex items-center gap-1">
              <Clock size={12} />
              Se termine dimanche
            </span>
          </div>
          
          <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight mt-4">
            Explose tes scores <br/> cette semaine !
          </h3>
          <p className="text-neutral-300 text-sm mt-2 max-w-[250px]">
            Participe à ces défis exclusifs pour gagner un maximum d'XP et te positionner au sommet du classement local et mondial.
          </p>

          <div className="mt-6 p-4 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider">État des défis</span>
              <span className="text-sm font-black text-white">{completedChallenges} / {totalChallenges} Terminés</span>
            </div>
            <div className="h-3 w-full bg-black border border-white/10 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                 style={{ width: `${(completedChallenges / totalChallenges) * 100}%` }}
               />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 mt-8 mb-4">
        <Flame className="text-orange-500" size={24} />
        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Les Missions</h3>
      </div>

      <div className="flex flex-col gap-4">
          {/* Challenge 1: Invites */}
          <div className="bg-[#0a0a09] border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Users size={120} className="text-blue-500" />
             </div>
             
             <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-start gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 flex items-center justify-center border border-blue-500/30 shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                     <Users size={28} className="text-blue-400" />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-black text-lg leading-tight uppercase tracking-tight">Le Recruteur</h3>
                        <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase px-2 py-1 rounded-full border border-blue-500/20">+{xpReward} XP</span>
                      </div>
                      <p className="text-neutral-400 text-sm mt-1">Invite {targetCount} amis à rejoindre ton équipe grâce à ton code de parrainage et gagne {xpReward} points de bonus.</p>
                   </div>
                </div>
                
                {(inviteStarted || questClaimed) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-neutral-500">Progression</span>
                      <span className={localTeamCount >= targetCount ? 'text-green-400 font-extrabold' : 'text-blue-400 font-extrabold'}>
                         {localTeamCount} / {targetCount}
                      </span>
                   </div>
                   <div className="h-4 w-full bg-black border border-white/10 rounded-full overflow-hidden">
                     <div 
                       className={`h-full transition-all duration-1000 ${localTeamCount >= targetCount ? 'bg-green-500' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
                       style={{ width: `${progressPercentage}%` }}
                     />
                   </div>
                </div>
                )}
                
                {questClaimed ? (
                   <div className="flex gap-2">
                     <div className="flex-1 py-3 rounded-xl bg-green-500/10 text-green-400 font-black uppercase tracking-wide flex items-center justify-center gap-2 border border-green-500/20">
                        <CheckCircle2 size={18} />
                        Validé
                     </div>
                     <button
                        onClick={() => handleShareMission('Le Recruteur')}
                        disabled={!!sharingMission}
                        className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2"
                     >
                        {sharingMission?.title === 'Le Recruteur' ? (
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Share2 size={16} />
                        )}
                        <span className="text-[10px] font-black uppercase">Partager</span>
                     </button>
                   </div>
                ) : !inviteStarted ? (
                   <button
                      onClick={() => startChallenge('invite')}
                      className="w-full py-4 rounded-xl font-black uppercase tracking-wide transition-all bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-95"
                   >
                      Commencer
                   </button>
                ) : (
                   <button
                      onClick={handleClaim}
                      disabled={localTeamCount < targetCount || claiming}
                      className={`w-full py-4 rounded-xl font-black uppercase tracking-wide transition-all ${
                         localTeamCount >= targetCount && !claiming
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-95'
                            : 'bg-white/5 text-neutral-500 cursor-not-allowed border border-white/5'
                      }`}
                   >
                      {claiming ? 'Récupération...' : (localTeamCount >= targetCount ? 'Récupérer ma récompense' : 'Mission en cours')}
                   </button>
                )}
             </div>
          </div>

          {/* Challenge 2: Sales */}
          <div className="bg-[#0a0a09] border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <ShoppingBag size={120} className="text-yellow-500" />
             </div>
             
             <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-start gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-600/20 to-orange-600/20 flex items-center justify-center border border-yellow-500/30 shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                     <ShoppingBag size={28} className="text-yellow-400" />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-black text-lg leading-tight uppercase tracking-tight">Le Vendeur d'Élite</h3>
                        <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase px-2 py-1 rounded-full border border-yellow-500/20">+{xpRewardSales} XP</span>
                      </div>
                      <p className="text-neutral-400 text-sm mt-1">Génère {targetSales} ventes cette semaine et gagne {xpRewardSales} points de bonus. Fais exploser tes revenus !</p>
                   </div>
                </div>
                
                {(salesStarted || salesQuestClaimed) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-neutral-500">Progression</span>
                      <span className={weeklySales >= targetSales ? 'text-green-400 font-extrabold' : 'text-yellow-400 font-extrabold'}>
                         {weeklySales} / {targetSales}
                      </span>
                   </div>
                   <div className="h-4 w-full bg-black border border-white/10 rounded-full overflow-hidden">
                     <div 
                       className={`h-full transition-all duration-1000 ${weeklySales >= targetSales ? 'bg-green-500' : 'bg-gradient-to-r from-yellow-600 to-orange-400'}`}
                       style={{ width: `${salesProgressPercentage}%` }}
                     />
                   </div>
                </div>
                )}
                
                {salesQuestClaimed ? (
                   <div className="flex gap-2">
                     <div className="flex-1 py-3 rounded-xl bg-green-500/10 text-green-400 font-black uppercase tracking-wide flex items-center justify-center gap-2 border border-green-500/20">
                        <CheckCircle2 size={18} />
                        Validé
                     </div>
                     <button
                        onClick={() => handleShareMission("Vendeur d'Élite")}
                        disabled={!!sharingMission}
                        className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2"
                     >
                        {sharingMission?.title === "Vendeur d'Élite" ? (
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Share2 size={16} />
                        )}
                        <span className="text-[10px] font-black uppercase">Partager</span>
                     </button>
                   </div>
                ) : !salesStarted ? (
                   <button
                      onClick={() => startChallenge('sales')}
                      className="w-full py-4 rounded-xl font-black uppercase tracking-wide transition-all bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-[1.02] active:scale-95"
                   >
                      Commencer
                   </button>
                ) : (
                   <button
                      onClick={handleClaimSales}
                      disabled={weeklySales < targetSales || claimingSales}
                      className={`w-full py-4 rounded-xl font-black uppercase tracking-wide transition-all ${
                         weeklySales >= targetSales && !claimingSales
                            ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-[1.02] active:scale-95'
                            : 'bg-white/5 text-neutral-500 cursor-not-allowed border border-white/5'
                      }`}
                   >
                      {claimingSales ? 'Récupération...' : (weeklySales >= targetSales ? 'Récupérer ma récompense' : 'Mission en cours')}
                   </button>
                )}
             </div>
          </div>

          {/* Challenge 3: Premium */}
          <div className="bg-[#0a0a09] border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Crown size={120} className="text-emerald-500" />
             </div>
             
             <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-start gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                     <Crown size={28} className="text-emerald-400" />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-black text-lg leading-tight uppercase tracking-tight">Le Manager Pro</h3>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded-full border border-emerald-500/20">+{xpRewardPremium} XP</span>
                      </div>
                      <p className="text-neutral-400 text-sm mt-1">Fais passer {targetPremium} membres de ton équipe au statut MZ+ Premium cette semaine et gagne {xpRewardPremium} points de bonus !</p>
                   </div>
                </div>
                
                {(premiumStarted || premiumQuestClaimed) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-neutral-500">Progression</span>
                      <span className={premiumTeamCount >= targetPremium ? 'text-green-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>
                         {premiumTeamCount} / {targetPremium}
                      </span>
                   </div>
                   <div className="h-4 w-full bg-black border border-white/10 rounded-full overflow-hidden">
                     <div 
                       className={`h-full transition-all duration-1000 ${premiumTeamCount >= targetPremium ? 'bg-green-500' : 'bg-gradient-to-r from-emerald-600 to-teal-400'}`}
                       style={{ width: `${Math.min((premiumTeamCount / targetPremium) * 100, 100)}%` }}
                     />
                   </div>
                </div>
                )}
                
                {premiumQuestClaimed ? (
                   <div className="flex gap-2">
                     <div className="flex-1 py-3 rounded-xl bg-green-500/10 text-green-400 font-black uppercase tracking-wide flex items-center justify-center gap-2 border border-green-500/20">
                        <CheckCircle2 size={18} />
                        Validé
                     </div>
                     <button
                        onClick={() => handleShareMission('Manager Pro')}
                        disabled={!!sharingMission}
                        className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2"
                     >
                        {sharingMission?.title === 'Manager Pro' ? (
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Share2 size={16} />
                        )}
                        <span className="text-[10px] font-black uppercase">Partager</span>
                     </button>
                   </div>
                ) : !premiumStarted ? (
                   <button
                      onClick={() => startChallenge('premium')}
                      className="w-full py-4 rounded-xl font-black uppercase tracking-wide transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-95"
                   >
                      Commencer
                   </button>
                ) : (
                   <button
                      onClick={handleClaimPremium}
                      disabled={premiumTeamCount < targetPremium || claimingPremium}
                      className={`w-full py-4 rounded-xl font-black uppercase tracking-wide transition-all ${
                         premiumTeamCount >= targetPremium && !claimingPremium
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-95'
                            : 'bg-white/5 text-neutral-500 cursor-not-allowed border border-white/5'
                      }`}
                   >
                      {claimingPremium ? 'Récupération...' : (premiumTeamCount >= targetPremium ? 'Récupérer ma récompense' : 'Mission en cours')}
                   </button>
                )}
             </div>
          </div>

          {/* Challenge 4: Quiz */}
          <div className="bg-[#0a0a09] border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <BrainCircuit size={120} className="text-purple-500" />
             </div>
             
             <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-start gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center border border-purple-500/30 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                     <SelectIcon quizQuestClaimed={quizQuestClaimed} />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-black text-lg leading-tight uppercase tracking-tight">Le Connaisseur</h3>
                        <span className="bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase px-2 py-1 rounded-full border border-purple-500/20">+{xpRewardQuiz} XP</span>
                      </div>
                      <p className="text-neutral-400 text-sm mt-1">
                        Prouve tes connaissances sur le système d'affiliation MZ+ en répondant correctement à 7 questions.
                      </p>
                   </div>
                </div>

                {quizQuestClaimed ? (
                   <div className="flex gap-2">
                     <div className="flex-1 py-3 rounded-xl bg-green-500/10 text-green-400 font-black uppercase tracking-wide flex items-center justify-center gap-2 border border-green-500/20">
                        <CheckCircle2 size={18} />
                        Validé
                     </div>
                     <button
                        onClick={() => handleShareMission('Expert MZ+')}
                        disabled={!!sharingMission}
                        className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2"
                     >
                        {sharingMission?.title === 'Expert MZ+' ? (
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Share2 size={16} />
                        )}
                        <span className="text-[10px] font-black uppercase">Partager</span>
                     </button>
                   </div>
                ) : quizFinished ? (
                   <div className="animate-in zoom-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center py-8 bg-black/40 rounded-2xl border border-purple-500/30 backdrop-blur-md">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Quiz Terminé</h4>
                      <p className="text-white/60 text-sm mb-6">Ton score : <span className="text-white font-bold">{quizScore} XP</span></p>
                      
                      <div className="flex items-baseline gap-1 mb-8">
                         <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">+{quizScore || 0}</span>
                         <span className="text-purple-400 font-bold uppercase tracking-wider">XP</span>
                      </div>

                      <button
                         onClick={() => handleClaimQuiz(quizScore)}
                         disabled={claimingQuiz}
                         className="w-full max-w-[240px] py-4 rounded-full font-bold uppercase tracking-wide transition-all bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2"
                      >
                         {claimingQuiz ? 'Récupération...' : 'Récupérer mes points'}
                      </button>
                   </div>
                ) : (
                   <button
                      onClick={() => setQuizStarted(true)}
                      className="w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                   >
                      <PlayCircle size={20} className="text-purple-400" />
                      Commencer la Masterclass
                   </button>
                )}
             </div>
          </div>
      </div>
      
      {quizStarted && (
        <ImmersiveQuiz 
          quizQuestions={quizQuestions} 
          initialScore={0}
          onFinished={(score) => {
             setQuizScore(score);
             setQuizFinished(true);
             setQuizStarted(false);
          }}
          onClose={() => setQuizStarted(false)} 
        />
      )}

      <AnimatePresence>
        {sharingMission && (
          <WhatsAppShareModal 
            isOpen={!!sharingMission}
            onClose={() => setSharingMission(null)}
            onShare={executeWhatsAppShare}
            title="Impacte la Communauté"
            description={`Félicitations pour ton succès "${sharingMission.title}" ! Partage ta réussite pour motiver le reste du groupe sur WhatsApp.`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SelectIcon = ({ quizQuestClaimed }: { quizQuestClaimed: boolean }) => {
  if (quizQuestClaimed) return <Star size={28} className="text-purple-400" />;
  return <BrainCircuit size={28} className="text-purple-400" />;
}
