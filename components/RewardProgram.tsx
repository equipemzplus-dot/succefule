
import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Star, Activity, ShieldCheck, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '../services/supabase.ts';
import { UserProfile } from '../types.ts';
import { GoldBorderCard, GoldText } from './UI.tsx';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  user_level: string;
  engagement_score: number;
  rank: number;
}

export const RewardProgram: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mz_reward_leaderboard')
        .select('*')
        .limit(50);

      if (error) throw error;

      if (data) {
        const ranked = data.map((item: any, index: number) => ({
          ...item,
          rank: index + 1
        }));
        setLeaderboard(ranked);
        
        const me = ranked.find(r => r.user_id === profile?.id);
        if (me) {
          setMyRank(me);
        } else if (profile?.id) {
          const { data: ind } = await supabase.from('mz_reward_leaderboard').select('*').eq('user_id', profile.id).single();
          if (ind) setMyRank({ ...ind, rank: 0 }); // 0 signifie non classé dans le top
        }
      }
    } catch (e) {
      console.error("Reward System Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [profile?.id]);

  return (
    <div className="space-y-12 animate-fade-in pb-24 max-w-5xl mx-auto">
      {/* En-tête Prestige */}
      <div className="text-center space-y-4 px-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-yellow-600/10 border border-yellow-600/20 rounded-full mb-2">
          <Sparkles size={16} className="text-yellow-500 animate-pulse" />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-yellow-500">Exclusivité Élite MZ+</span>
        </div>
        <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
          PROGRAMME <br/><GoldText>DE RÉCOMPENSE</GoldText>
        </h2>
        <p className="text-[8px] md:text-[10px] text-neutral-500 font-black uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-50">
          L'excellence au service de votre fortune
        </p>
      </div>

      {/* Barre de Status Personnel */}
      <div className="sticky top-20 z-40 py-2 px-4">
        <GoldBorderCard className="p-4 md:p-6 bg-black/90 backdrop-blur-2xl border-yellow-600/30 shadow-2xl">
           <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-yellow-600 rounded-xl md:rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] shrink-0">
                  <Activity size={24} md:size={28} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-0.5">Votre Status Ambassadeur</p>
                  <p className="text-base md:text-lg font-black text-white uppercase tracking-tight truncate">{profile?.full_name}</p>
                </div>
              </div>

              <div className="flex items-center justify-around md:justify-end gap-8 md:gap-20 w-full md:w-auto pt-4 md:pt-0 border-t border-white/5 md:border-none">
                <div className="text-center">
                  <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1">Rang Global</p>
                  <p className="text-2xl md:text-3xl font-black text-yellow-500 font-mono">
                    {myRank?.rank ? `#${myRank.rank}` : '--'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1">Engagement</p>
                  <p className="text-2xl md:text-3xl font-black text-white font-mono">{myRank?.engagement_score || 0}</p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
                 <ShieldCheck size={14} className="text-yellow-600" />
                 <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none">Algorithme <br/>MZ+ Core</span>
              </div>
           </div>
        </GoldBorderCard>
      </div>

      {/* Podium Top 3 */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-8 px-4">
          {/* 1ère Place - En haut sur mobile */}
          <div className="order-1 md:order-2 transform md:scale-110">
            <PodiumCard entry={leaderboard[0]} icon={Crown} color="text-yellow-500" isFirst />
          </div>
          {/* 2ème Place */}
          <div className="order-2 md:order-1 pt-0 md:pt-12">
            <PodiumCard entry={leaderboard[1]} icon={Medal} color="text-neutral-400" />
          </div>
          {/* 3ème Place */}
          <div className="order-3 md:order-3 pt-0 md:pt-20">
            <PodiumCard entry={leaderboard[2]} icon={Medal} color="text-orange-700" />
          </div>
        </div>
      )}

      {/* Liste des Ambassadeurs (Top 20) */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl mt-8 md:mt-16 mx-4">
        <div className="p-5 md:p-8 border-b border-white/5 bg-black/40 flex items-center justify-between gap-4">
           <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-neutral-400 flex items-center gap-3">
             <TrendingUp size={18} className="text-yellow-600 shrink-0" /> <span className="truncate">Ambassadeurs Elite</span>
           </h3>
           <div className="text-[7px] md:text-[8px] font-black uppercase text-neutral-600 tracking-widest text-right shrink-0">Temps Réel</div>
        </div>

        {loading ? (
          <div className="p-20 md:p-32 flex flex-col items-center justify-center gap-4 opacity-50 text-center">
            <Loader2 className="animate-spin text-yellow-500" size={32} md:size={40} />
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Analyse du réseau...</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {leaderboard.slice(3).map((user) => (
              <div key={user.user_id} className={`flex items-center justify-between p-4 md:p-8 hover:bg-white/[0.02] transition-colors ${user.user_id === profile?.id ? 'bg-yellow-600/5' : ''}`}>
                 <div className="flex items-center gap-4 md:gap-8 min-w-0">
                    <span className="font-mono text-[10px] md:text-xs font-black text-neutral-800 w-6 md:w-8 shrink-0">#{user.rank}</span>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-600 font-black uppercase text-sm shrink-0">
                      {user.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                       <p className="text-xs md:text-sm font-black uppercase text-white tracking-wide truncate">{user.full_name}</p>
                       <p className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest ${user.user_level === 'niveau_mz_plus' ? 'text-blue-400' : 'text-neutral-600'} truncate`}>
                         {user.user_level === 'niveau_mz_plus' ? 'Niveau MZ+' : 'Standard'}
                       </p>
                    </div>
                 </div>
                 <div className="text-right shrink-0">
                    <p className="text-xs md:text-sm font-mono font-black text-white">{user.engagement_score}</p>
                    <p className="text-[7px] md:text-[8px] font-black uppercase text-neutral-700 tracking-widest mt-1">Score</p>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mentions de Prestige */}
      <div className="p-10 md:p-16 text-center space-y-6 opacity-30">
        <ShieldCheck size={32} md:size={40} className="mx-auto text-neutral-500" />
        <p className="text-[8px] md:text-[9px] text-neutral-500 font-medium italic max-w-sm md:max-w-md mx-auto leading-relaxed px-4">
          "Le Programme de Récompense MZ+ utilise un algorithme d'IA propriétaire pour évaluer l'engagement. Les récompenses financières sont distribuées mensuellement aux ambassadeurs atteignant le cercle d'excellence."
        </p>
      </div>
    </div>
  );
};

const PodiumCard = ({ entry, icon: Icon, color, isFirst }: { entry: LeaderboardEntry, icon: any, color: string, isFirst?: boolean }) => (
  <div className={`p-6 md:p-10 bg-[#0c0c0c] border ${isFirst ? 'border-yellow-600/40 shadow-[0_0_60px_rgba(234,179,8,0.1)]' : 'border-white/5'} rounded-[2.5rem] md:rounded-[3.5rem] text-center flex flex-col items-center gap-4 md:gap-6 relative transition-all duration-700 hover:-translate-y-2`}>
    <div className={`p-4 md:p-5 bg-neutral-900 rounded-2xl md:rounded-3xl ${color} shadow-inner shrink-0`}>
      <Icon size={isFirst ? 36 : 28} md:size={isFirst ? 48 : 36} />
    </div>
    <div className="space-y-1 min-w-0">
      <p className="text-[8px] md:text-[10px] font-black uppercase text-neutral-600 tracking-widest">Rang #{entry.rank}</p>
      <h3 className="text-sm md:text-md font-black uppercase text-white tracking-tighter truncate max-w-[150px]">{entry.full_name}</h3>
    </div>
    <div className="w-full pt-4 md:pt-6 border-t border-white/5">
      <p className="text-xl md:text-2xl font-black text-white font-mono leading-none">{entry.engagement_score}</p>
      <p className="text-[7px] md:text-[8px] font-black uppercase text-neutral-500 tracking-widest mt-2 px-2">Score Global</p>
    </div>
    {isFirst && <div className="absolute -top-3 inset-x-0 flex justify-center"><Star className="text-yellow-500 animate-bounce" size={20} md:size={24} fill="currentColor" /></div>}
  </div>
);
