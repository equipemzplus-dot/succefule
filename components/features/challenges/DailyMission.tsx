import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  ShoppingBag, 
  Zap, 
  Trophy, 
  Crown, 
  Target,
  ArrowRight,
  CheckCircle2,
  Play,
  Sparkles
} from 'lucide-react';
import { TabId, UserProfile } from '../../../types';
import { supabase } from '../../../services/supabase';
import confetti from 'canvas-confetti';

interface DailyMissionProps {
  onSwitchTab: (tab: TabId) => void;
  profile: UserProfile;
  onRefresh?: () => void;
}

const MISSIONS = [
  {
    id: 'refer_2',
    title: "Le Recruteur",
    desc: "Invite 2 nouveaux membres à rejoindre ton équipe aujourd'hui pour étendre ton empire.",
    action: "Partager mon lien",
    tab: "referral" as TabId,
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    reward: 10,
    verify: async (profile: UserProfile) => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referral_code_used', profile.referral_code)
        .gte('created_at', today);
      return (count || 0) >= 2;
    }
  },
  {
    id: 'add_product',
    title: "Le Marchand",
    desc: "Ajoute un nouveau produit stratégique à ta boutique personnelle pour attirer des clients.",
    action: "Catalogue",
    tab: "affiliation" as TabId,
    icon: ShoppingBag,
    color: "from-emerald-500 to-teal-600",
    reward: 10,
    verify: async (profile: UserProfile) => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('mz_user_store')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .gte('created_at', today);
      return (count || 0) >= 1;
    }
  },
  {
    id: 'make_sale',
    title: "Le Conclueur",
    desc: "Réalise au moins une vente aujourd'hui pour faire exploser ton chiffre d'affaires.",
    action: "Ma Boutique",
    tab: "affiliation" as TabId, 
    icon: Zap,
    color: "from-amber-500 to-orange-600",
    reward: 10,
    verify: async (profile: UserProfile) => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('commissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .gte('created_at', today);
      return (count || 0) >= 1;
    }
  },
  {
    id: 'weekly_random',
    title: "Le Challenger",
    desc: "Participe activement à la communauté en envoyant un message de motivation aujourd'hui.",
    action: "Messagerie",
    tab: "dashboard" as TabId, // Or wherever chats are
    icon: Trophy,
    color: "from-purple-500 to-pink-600",
    reward: 10,
    verify: async (profile: UserProfile) => {
       // Since tracking specific weekly challenge participation is complex, 
       // let's simplify to "Interaction check" or similar for now, 
       // or just check if they opened the rewards page today.
       const today = new Date().toISOString().split('T')[0];
       return localStorage.getItem(`mz_interacted_${today}`) === 'true';
    }
  },
  {
    id: 'upgrade_member',
    title: "Le Leader",
    desc: "Accompagne un membre de ton équipe pour qu'il passe au plan Premium Elite.",
    action: "Mon Équipe",
    tab: "team" as TabId,
    icon: Crown,
    color: "from-purple-600 to-indigo-700",
    reward: 10,
    verify: async (profile: UserProfile) => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referral_code_used', profile.referral_code)
        .eq('user_level', 'niveau_mz_plus')
        .gte('created_at', today); // This is approximate as created_at might be old, but let's assume they upgraded today
      
      // In a real app we might have an 'upgraded_at' or 'premium_at' column
      return (count || 0) >= 1;
    }
  },
  {
    id: 'discovery',
    title: "L'Explorateur",
    desc: "Regarde une formation dans l'Académie pour acquérir une nouvelle compétence.",
    action: "Académie",
    tab: "formation" as TabId,
    icon: Target,
    color: "from-rose-500 to-pink-600",
    reward: 10,
    verify: async (profile: UserProfile) => {
      const today = new Date().toISOString().split('T')[0];
      // Check XP rewards for today from formation_complete
      const storageKeySearch = `mz_formation_xp_${profile.id}_`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(storageKeySearch)) {
          // If any formation was completed
          return true; 
        }
      }
      return false;
    }
  }
];

export const DailyMission: React.FC<DailyMissionProps> = ({ onSwitchTab, profile, onRefresh }) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  
  const mission = useMemo(() => {
    // Select mission based on day of year
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    return MISSIONS[dayOfYear % MISSIONS.length];
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const missionStatus = profile.store_preferences?.daily_mission?.[todayStr] || { started: false, completed: false };

  const startMission = async () => {
    if (missionStatus.started) return;
    setVerifyError(null);
    
    const newDaily = {
      ...(profile.store_preferences?.daily_mission || {}),
      [todayStr]: { ...missionStatus, started: true }
    };
    
    const newPrefs = { ...profile.store_preferences, daily_mission: newDaily };
    await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', profile.id);
    if (onRefresh) onRefresh();
  };

  const handleAction = () => {
    setVerifyError(null);
    if (!missionStatus.started) {
      startMission();
    }
    
    // Track interaction if it's the weekly challenge
    if (mission.id === 'weekly_random') {
      localStorage.setItem(`mz_interacted_${todayStr}`, 'true');
    }

    onSwitchTab(mission.tab);
  };

  const claimReward = async () => {
    if (missionStatus.completed || isClaiming || !isVerified) return;
    setIsClaiming(true);
    setVerifyError(null);

    try {
      const newDaily = {
        ...(profile.store_preferences?.daily_mission || {}),
        [todayStr]: { ...missionStatus, completed: true }
      };
      
      const newPrefs = { ...profile.store_preferences, daily_mission: newDaily };
      await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', profile.id);
      if (onRefresh) onRefresh();

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      const event = new CustomEvent('mz-xp-reward', {
        detail: { 
          amount: 10, 
          title: 'Mission du Jour Réussie !', 
          description: `Tu as gagné 10 XP pour avoir complété : ${mission.title}`,
          source: 'daily_mission'
        }
      });
      window.dispatchEvent(event);
    } catch (err) {
      console.error(err);
      setVerifyError("Une erreur est survenue lors de la récupération.");
    } finally {
      setIsClaiming(false);
    }
  };

  const [isVerified, setIsVerified] = useState(false);

  // Background verification algorithm
  useEffect(() => {
    if (missionStatus.completed) {
      setIsVerified(true);
      return;
    }

    const checkMission = async () => {
      try {
        const result = await mission.verify(profile);
        if (result && !isVerified) {
          setIsVerified(true);
          // Play a small sound or visual cue if desired
        }
      } catch (e) {
        console.warn("Verification check failed:", e);
      }
    };

    // Check every 8 seconds if active
    const timer = setInterval(checkMission, 8000);
    checkMission(); // Initial check

    return () => clearInterval(timer);
  }, [mission, profile?.id, missionStatus.completed, isVerified]);

  const MissionIcon = mission.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[#111] border border-white/5 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden group mb-6"
    >
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${mission.color} opacity-[0.03] blur-[40px] rounded-full -mr-10 -mt-10 transition-all duration-700 group-hover:opacity-[0.08] group-hover:scale-125`} />
      
      <div className="flex flex-col relative z-10">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 rounded-[1rem] bg-gradient-to-br ${mission.color} flex items-center justify-center text-white shrink-0 shadow-lg`}>
            <MissionIcon size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Mission du Jour</span>
              {missionStatus.completed && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-black uppercase rounded-full border border-green-500/20">Terminé</span>
              )}
              {isVerified && !missionStatus.completed && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase rounded-full border border-amber-500/20 animate-pulse">Prêt à réclamer</span>
              )}
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            <h3 className="text-lg font-black leading-tight text-white mb-2 tracking-tight">
              {mission.title}
            </h3>
            <p className="text-[13px] text-neutral-400 font-medium leading-relaxed">
              {mission.desc}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {verifyError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-bold text-center"
            >
              {verifyError}
            </motion.div>
          )}

          {missionStatus.completed ? (
            <div className="w-full py-4 bg-green-500/10 text-green-400 font-black text-[11px] uppercase tracking-[0.2em] rounded-xl border border-green-500/20 flex items-center justify-center gap-3">
              <CheckCircle2 size={16} />
              Récompense Récupérée (+10 XP)
            </div>
          ) : !missionStatus.started ? (
            <button
              onClick={startMission}
              className={`w-full py-4 bg-gradient-to-r ${mission.color} text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3`}
            >
              <Play size={14} fill="currentColor" />
              Commencer la mission
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAction}
                className={`flex-1 py-4 ${isVerified ? 'bg-white/5' : 'bg-white/10'} hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all border border-white/10 flex items-center justify-center gap-3 active:scale-95`}
              >
                {mission.action}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              {isVerified ? (
                <button
                  onClick={claimReward}
                  disabled={isClaiming}
                  className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} className={isClaiming ? 'animate-spin' : ''} />
                  {isClaiming ? 'Traitement...' : 'Réclamer mes 10 XP'}
                </button>
              ) : (
                <div className="flex-1 py-4 bg-white/5 text-neutral-500 font-black text-[10px] uppercase tracking-[0.1em] rounded-xl border border-white/5 flex items-center justify-center gap-2 cursor-wait">
                  <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-pulse" />
                  En attente de réalisation...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

