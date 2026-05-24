import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../services/supabase.ts';
import { UserProfile } from '../../../types.ts';
import { Users, Copy, Share2, Crown, Activity, CheckCircle2, Rocket, Gift } from 'lucide-react';
import { useCurrency } from '../../../hooks/useCurrency.ts';
import { useAxis } from '../../features/axis/AxisProvider.tsx';

interface Props {
  profile: UserProfile | null;
  teamCount: number; // Will use it for fallback or total
}

const MOTIVATIONAL_PHRASES = [
  "Ton réseau est ta plus grande richesse.",
  "Bâtis ta communauté, multiplie tes revenus.",
  "Les leaders ne suivent pas, ils construisent.",
  "Chaque invitation te rapproche de ton succès.",
  "L'empire que tu construis aujourd'hui paiera demain.",
  "Le succès n'est réel que lorsqu'il est partagé.",
  "Ton influence a une valeur inestimable."
];

export const ReferralDashboard: React.FC<Props> = ({ profile, teamCount }) => {
  const { convertAndFormat } = useCurrency();
  const [motivationalPhrase, setMotivationalPhrase] = useState(MOTIVATIONAL_PHRASES[0]);
  const [team, setTeam] = useState<{id: string, full_name: string, user_level: string, created_at: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { triggerAxisMessage } = useAxis();

  const startTeamAxisGuide = useCallback(() => {
    triggerAxisMessage(
      "Bienvenue dans ton Espace Parrainage ! C'est ici que tu vas parrainer de nouveaux membres pour rejoindre Millionnaire Zone Plus. 👁️⚡",
      "guiding",
      0,
      {
        label: "Montre-moi ➔",
        action: () => {
          triggerAxisMessage("Analyse du réseau...", "progression", 1000);
          
          setTimeout(() => {
            const linkCard = document.getElementById('referral-link-card');
            if (linkCard) linkCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            triggerAxisMessage(
              "Voici ton Lien de Parrainage unique. Partage-le ! Chaque personne qui s'inscrit via ce lien devient ton filleul et te rapporte +10 XP. 💎",
              "action",
              10000,
              {
                label: "Suivant ➔",
                action: () => {
                  const statsCard = document.getElementById('referral-stats-card');
                  if (statsCard) statsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  
                  triggerAxisMessage(
                    "Ici, tu peux suivre tes statistiques en temps réel. La section 'Partenaires' affiche toutes les personnes qui ont rejoint ton équipe. 📊",
                    "guiding",
                    10000,
                    {
                      label: "Et les gains ? 💸",
                      action: () => {
                        const listContainer = document.getElementById('referral-list-container');
                        if (listContainer) listContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        triggerAxisMessage(
                          "Le Journal du Parrainage te permet de voir tes filleuls. Lorsqu'un de tes filleuls devient PREMIUM, tu reçois 2500 FCFA de commission directe ! 💰💸",
                          "success",
                          12000,
                          {
                            label: "C'est compris ! 🔥",
                            action: () => {
                              localStorage.setItem('mz_referral_guide_seen', 'true');
                              triggerAxisMessage("Parfait. C'est le moment de bâtir ton empire. Bonne chance ! 🚀", "success", 5000);
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }, 1200);
        }
      }
    );
  }, [triggerAxisMessage]);

  useEffect(() => {
    const seen = localStorage.getItem('mz_referral_guide_seen');
    if (!seen) {
      const timer = setTimeout(() => {
        startTeamAxisGuide();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startTeamAxisGuide]);

  const fetchTeam = useCallback(async (retryCount = 0) => {
    if (!profile?.referral_code) return;
    if (retryCount === 0) setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, user_level, created_at')
        .eq('referral_code_used', profile.referral_code)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTeam(data || []);
    } catch (e: unknown) {
      console.error("Team Fetch Error:", e);
      const isFetchError = e instanceof Error && (e.message.includes('fetch') || e.name === 'TypeError');
      if (retryCount < 3 && isFetchError) {
        const delay = 1000 * (retryCount + 1);
        setTimeout(() => fetchTeam(retryCount + 1), delay);
        return;
      }
      setError("Impossible de charger votre équipe pour le moment.");
    } finally {
      setLoading(false);
    }
  }, [profile?.referral_code]);

  useEffect(() => {
    fetchTeam();
    setMotivationalPhrase(MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]);
  }, [fetchTeam]);

  const premiumMembers = team.filter(m => m.user_level === 'niveau_mz_plus').length;
  const revenusGeneres = premiumMembers * 2500;
  const displayTeamCount = Math.max(team.length, teamCount);

  const referralLink = `${window.location.origin}/?ref=${profile?.referral_code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins mon équipe sur MZ+',
          text: 'Développe tes revenus et rejoins ma communauté !',
          url: referralLink,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="pb-32 animate-in fade-in duration-700 bg-black min-h-[100dvh]">
      
      {/* Hero Section */}
      <div className="relative pt-12 pb-28 md:pt-16 md:pb-32 px-6 rounded-b-[2.5rem] md:rounded-b-[4rem] bg-gradient-to-b from-[#111009] via-[#0a0a0a] to-[#010101] border-b border-white/[0.02]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center mb-6 md:mb-8 border border-yellow-500/20 shadow-inner">
            <Rocket size={32} className="text-yellow-500 opacity-90 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60 tracking-tight leading-tight max-w-2xl mx-auto drop-shadow-sm">
            {motivationalPhrase}
          </h1>
        </div>
      </div>

      {/* 2. STATS & ACTIONS (Overlapping the hero section) */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-20 relative z-20">
        <div className="bg-[#050505] backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-6 md:p-10">
           
           <div id="referral-stats-card" className="grid grid-cols-2 gap-8 divide-x divide-white/5 mb-8 md:mb-10">
              <div className="flex flex-col items-center justify-center">
                 <p className="text-sm font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2 md:mb-3">Membres</p>
                 <div className="flex items-center gap-3">
                    <Users className="text-white/40 hidden sm:block" size={24} />
                    <p className="text-5xl md:text-6xl font-black text-white tracking-tighter">{displayTeamCount}</p>
                 </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                 <p className="text-sm font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2 md:mb-3">Revenus</p>
                 <div className="flex items-center gap-3">
                    <Crown className="text-yellow-500 hidden sm:block" size={24} />
                    <p className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                       {revenusGeneres > 0 ? convertAndFormat(revenusGeneres).formatted : '0'}
                    </p>
                 </div>
              </div>
           </div>

           <div id="referral-link-card" className="flex flex-col sm:flex-row gap-4 w-full">
              <button 
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 md:py-5 bg-white text-black rounded-[1.25rem] font-black text-lg hover:bg-white/90 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <Share2 size={22} />
                Partager & Gagner
              </button>
              <button 
                onClick={handleCopy}
                className="sm:flex-none flex items-center justify-center gap-3 px-8 py-4 md:py-5 bg-[#111] border border-white/10 text-white rounded-[1.25rem] font-bold text-lg hover:bg-[#1a1a1a] hover:border-white/20 active:scale-95 transition-all"
              >
                {copied ? <CheckCircle2 size={22} className="text-green-400" /> : <Copy size={22} />}
                {copied ? "Copié" : "Copier"}
              </button>
           </div>
           
           {error && (
             <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
               <p className="text-sm font-bold text-red-500">{error}</p>
             </div>
           )}
        </div>
      </div>

      {/* 3. TEAM LIST (Flowing naturally) */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-12 space-y-12">
        <div className="pt-4">
          <div className="flex items-center justify-between mb-8 px-2">
             <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                <Activity className="text-white/40" size={20} />
                Ton Équipe
             </h2>
             <span className="text-sm font-bold text-neutral-500 bg-white/5 px-4 py-1.5 rounded-full">
                {displayTeamCount} membre{displayTeamCount > 1 ? 's' : ''}
             </span>
          </div>

          <div id="referral-list-container" className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-4 md:p-6 shadow-xl">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-white/5 border-t-white/30 rounded-full animate-spin" />
                <p className="text-sm text-neutral-500 font-medium animate-pulse">Chargement...</p>
              </div>
            ) : team.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-white/5 to-white/10 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                  <Gift className="text-white/30" size={32} />
                </div>
                <p className="text-xl font-bold text-white mb-2">Aucun membre pour le moment</p>
                <p className="text-neutral-500 max-w-sm text-sm leading-relaxed mb-6">
                  Partage ton lien à tes contacts et sois récompensé pour chaque nouvelle inscription.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {team.map((member, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={member.id} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-[#111] hover:bg-[#151515] border border-white/5 hover:border-white/10 rounded-2xl transition-all"
                    >
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[1rem] flex items-center justify-center font-black text-lg shrink-0 ${
                            member.user_level === 'niveau_mz_plus' 
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                            : 'bg-gradient-to-br from-[#222] to-[#111] text-white border border-white/10'
                          }`}
                        >
                          {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-base md:text-lg">{member.full_name || 'Membre Anonyme'}</p>
                          <p className="text-xs md:text-sm text-neutral-400 mt-1">
                            {new Date(member.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric'})}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {member.user_level === 'niveau_mz_plus' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg border border-yellow-500/20">
                            <Crown size={14} className="fill-yellow-500" />
                            <span className="text-xs font-black uppercase tracking-wider hidden sm:block">Premium</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-neutral-400 rounded-lg">
                            <Activity size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Actif</span>
                          </div>
                        )}
                        <div className="flex items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-sm font-bold text-white/90">+10 XP</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

