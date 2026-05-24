import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { UserProfile } from '../../../types';
import { Trophy, Globe2, MapPin, Calendar, CalendarDays, History, Crown } from 'lucide-react';
import { PastRewardsView } from './PastRewardsView';

const DEFAULT_FLAG = '🌐';
const getCountryFlag = (countryCode?: string) => {
  if (!countryCode) return <span className="text-xl">🌐</span>;
  const code = countryCode.trim().toLowerCase();
  const flags: Record<string, string> = {
    ci: "🇨🇮",
    sn: "🇸🇳",
    cm: "🇨🇲",
    ml: "🇲🇱",
    bf: "🇧🇫",
    tg: "🇹🇬",
    bj: "🇧🇯",
    ne: "🇳🇪",
    gn: "🇬🇳",
    ga: "🇬🇦",
    cg: "🇨🇬",
    cd: "🇨🇩",
    fr: "🇫🇷",
    dz: "🇩🇿",
    ma: "🇲🇦",
    tn: "🇹🇳",
    mg: "🇲🇬",
    ca: "🇨🇦",
  };
  return <span className="text-xl">{flags[code] || "🌐"}</span>;
};

const getCountryName = (countryCode?: string) => {
   if (!countryCode) return 'Inconnu';
   const map: Record<string, string> = {
      'ci': "Côte d'Ivoire",
      'sn': "Sénégal",
      'cm': "Cameroun",
      'ml': "Mali",
      'bf': "Burkina Faso",
      'tg': "Togo",
      'bj': "Bénin",
      'ne': "Niger",
      'cd': "RDC",
      'cg': "Congo",
      'ga': "Gabon",
      'gf': "Guyane",
      'gp': "Guadeloupe",
      'mq': "Martinique",
      're': "Réunion",
      'yt': "Mayotte",
      'mg': "Madagascar",
      'gn': "Guinée",
      'dz': "Algérie",
      'ma': "Maroc",
      'tn': "Tunisie",
      'fr': "France",
      'ca': "Canada",
   };
   const code = countryCode.toLowerCase();
   return map[code] || code.toUpperCase();
};

type Period = 'week' | 'month' | 'all_time';

export const LeaderboardTab: React.FC<{ profile: UserProfile | null; mode?: 'global' | 'local' }> = ({ profile, mode = 'global' }) => {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('week');
  const [showPastRewards, setShowPastRewards] = useState(false);

  const [prevRank, setPrevRank] = useState<number | null>(() => {
    const saved = localStorage.getItem(`mz_prev_rank_${mode}_${period}`);
    return saved ? parseInt(saved) : null;
  });
  const [hasRankChanged, setHasRankChanged] = useState(false);
  const [rankTrend, setRankTrend] = useState<'up' | 'down' | 'stable' | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [mode, profile?.country_code, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let query = supabase.from('users').select('*');

      if (period === 'week') {
        query = query.order('weekly_xp', { ascending: false, nullsFirst: false })
                     .order('xp', { ascending: false }); 
      } else if (period === 'month') {
        query = query.order('monthly_xp', { ascending: false, nullsFirst: false })
                     .order('xp', { ascending: false }); 
      } else {
        query = query.order('xp', { ascending: false, nullsFirst: false });
      }

      query = query.limit(100);

      if (mode === 'local') {
        if (!profile?.country_code) {
          setLeaders([]);
          setLoading(false);
          return;
        }
        query = query.eq('country_code', profile.country_code);
      }

      const { data, error } = await query;
      if (error) throw error;
      const results = data || [];
      setLeaders(results);

      // Check for rank change
      if (profile) {
        const myRank = results.findIndex(u => u.id === profile.id) + 1;
        if (myRank > 0) {
          if (prevRank !== null && myRank !== prevRank) {
            setHasRankChanged(true);
            setRankTrend(myRank < prevRank ? 'up' : 'down');
            setTimeout(() => {
              setHasRankChanged(false);
              setRankTrend(null);
            }, 8000);
          }
          setPrevRank(myRank);
          localStorage.setItem(`mz_prev_rank_${mode}_${period}`, myRank.toString());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_15px_rgba(250,204,21,0.5)] border-yellow-400 text-yellow-900";
    if (index === 1) return "bg-gradient-to-br from-gray-300 to-gray-500 shadow-[0_0_10px_rgba(156,163,175,0.4)] border-gray-400 text-gray-900";
    if (index === 2) return "bg-gradient-to-br from-amber-600 to-amber-800 shadow-[0_0_10px_rgba(180,83,9,0.4)] border-amber-600 text-amber-50";
    return "bg-white/5 border-white/10 text-neutral-400";
  };
  
  const getPeriodLabel = () => {
    if(period === 'week') return 'Cette Semaine';
    if(period === 'month') return 'Ce Mois-ci';
    return 'Historique';
  };
  
  const getPoints = (user: UserProfile) => {
    const now = new Date();
    const lastUpdate = user.last_xp_update ? new Date(user.last_xp_update) : new Date(0);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    if (period === 'week') {
      if (!user.weekly_xp || lastUpdate < startOfWeek) return user.xp || 0;
      return user.weekly_xp;
    }
    if (period === 'month') {
      if (!user.monthly_xp || lastUpdate < startOfMonth) return user.xp || 0;
      return user.monthly_xp;
    }
    return user.xp || 0;
  };

  if (showPastRewards) {
    return <PastRewardsView onClose={() => setShowPastRewards(false)} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 pt-4 pb-4 px-4 bg-[#0a0a09]/90 backdrop-blur-xl border-b border-white/10 rounded-b-[2rem] -mx-4 sm:mx-0 flex flex-col gap-4 shadow-2xl">
        
        {/* Monthly Reward Banner */}
        {mode === 'global' && (
          <div className="w-full bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_4px_20px_rgba(168,85,247,0.15)]">
            <div className="flex-1 text-center sm:text-left text-[11px] sm:text-xs">
              <p className="text-white font-semibold mb-0.5">
                🏆 Chaque fin de mois, MZ+ récompense ses membres les plus actifs.
              </p>
              <p className="text-purple-300/80 font-medium">
                🔥 Entre dans le Top 10 et décroche ta prochaine récompense mensuelle.
              </p>
            </div>
            <button 
              onClick={() => setShowPastRewards(true)}
              className="flex-shrink-0 w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 border border-white/10 hover:opacity-90 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-md"
            >
              Voir les résultats du mois passé 📈
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Title & Icon */}
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center justify-center relative">
               {mode === 'global' ? (
                 <Trophy size={20} className="text-[var(--color-gold-main)]" />
               ) : (
                 <MapPin size={20} className="text-purple-400" />
               )}
             </div>
             <div>
               <h1 className="text-xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-gold-main)] to-purple-400">
                 {mode === 'global' ? 'Top Mondial' : 'Classement Local'}
               </h1>
               <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  MZ+ Elite Ranking
               </p>
             </div>
          </div>

          {/* Period Filters */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto w-full sm:w-auto">
            <button 
              onClick={() => setPeriod('week')}
              className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${period === 'week' ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <Calendar size={14} /> Semaine
            </button>
            <button 
              onClick={() => setPeriod('month')}
              className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${period === 'month' ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <CalendarDays size={14} /> Mois
            </button>
            <button 
              onClick={() => setPeriod('all_time')}
              className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${period === 'all_time' ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <History size={14} /> Historique
            </button>
          </div>
          
        </div>
      </div>

      {mode === 'local' && !profile?.country_code ? (
        <div className="w-full text-center py-20 bg-[#0a0a09] border border-white/5 rounded-[2rem] shadow-xl px-6">
          <p className="text-white text-lg font-bold mb-4">Pays non défini</p>
          <p className="text-neutral-400 text-sm">Veuillez définir votre pays dans les paramètres de votre profil pour accéder au classement de votre pays.</p>
        </div>
      ) : (
        <div className="bg-[#0a0a09] border border-white/5 rounded-[2rem] p-4 shadow-xl">
          {loading ? (
             <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 rounded-full border-t-2 border-[var(--color-gold-main)] animate-spin"></div>
             </div>
          ) : (
             <div className="flex flex-col gap-2">
               {leaders.map((user, index) => {
                 const isMe = profile?.id === user.id;

                 return (
                   <div 
                     key={user.id} 
                     className={`flex items-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 hover:bg-white/5
                       ${isMe ? 'bg-purple-900/20 border-purple-500/30' : 'bg-[#111] border-white/5'}
                       ${isMe && hasRankChanged ? 'animate-pulse ring-2 ring-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)]' : isMe ? 'shadow-[0_0_15px_rgba(168,85,247,0.1)]' : ''}
                     `}
                   >
                     {/* Rank */}
                     <div className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg flex items-center justify-center border font-black text-xs sm:text-sm relative ${getRankStyle(index)}`}>
                        {index < 3 ? <Crown size={16} /> : index + 1}
                        {isMe && hasRankChanged && (
                           <>
                             <div className="absolute inset-0 bg-white rounded-full blur-xl animate-ping opacity-30" />
                             <div className={`absolute -top-1 -right-1 px-1 rounded-sm text-[8px] font-black uppercase flex items-center gap-0.5 shadow-lg z-10 ${
                               rankTrend === 'up' ? 'bg-emerald-500 text-white animate-bounce' : 'bg-red-500 text-white animate-pulse'
                             }`}>
                               {rankTrend === 'up' ? '▲ UP' : '▼ DOWN'}
                             </div>
                           </>
                        )}
                     </div>

                     {/* Flag & Name */}
                     <div className="flex items-center gap-3 ml-4 flex-1 min-w-0">
                        <div className="flex flex-col items-center justify-center w-12 sm:w-16 shrink-0 bg-white/5 py-2 rounded-xl border border-white/5">
                           <div className="h-5 sm:h-6 flex items-center justify-center mb-1">
                             {getCountryFlag(user.country_code)}
                           </div>
                           <span className="text-[7px] sm:text-[9px] font-black text-[var(--color-gold-main)] uppercase tracking-tight text-center leading-tight max-w-full truncate px-1">
                              {getCountryName(user.country_code)}
                           </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                             <span className="truncate">{user.full_name || 'Utilisateur Anonyme'}</span>
                             {isMe && <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full uppercase tracking-widest border border-purple-500/30 flex-shrink-0">Moi</span>}
                           </span>
                           <span className="text-[9px] text-neutral-500 font-medium tracking-widest uppercase">Elite Business</span>
                        </div>
                     </div>

                     {/* Points */}
                     <div className="text-right pl-4 flex-shrink-0">
                        <span className="text-[9px] text-[var(--color-gold-main)] font-black uppercase tracking-widest block mb-1">XP {getPeriodLabel()}</span>
                        <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-main)] to-yellow-200">
                          {getPoints(user)}
                        </span>
                     </div>
                   </div>
                 );
               })}
               
               {!loading && leaders.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-16 text-center">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                     <Trophy className="text-neutral-500" size={24} />
                   </div>
                   <p className="text-lg font-bold text-white mb-2">Classement vide</p>
                   <p className="text-sm text-neutral-400">Personne n'a de points sur cette période.</p>
                 </div>
               )}
             </div>
          )}
        </div>
      )}
    </div>
  );
};
