import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../../services/supabase.ts';
import { GoldBorderCard, SectionTitle } from '../../UI.tsx';
import { RefreshCw, CheckCircle2, UserX, Search, Flame, Target, AlertTriangle, FastForward, PowerOff, ShieldAlert, Award, Clock, Zap } from 'lucide-react';

interface Challenge3JAdminProps {
  users: any[];
  onRefresh: () => void;
}

export const Challenge3JAdmin: React.FC<Challenge3JAdminProps> = ({ users, onRefresh }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState<string>("all_active");
  const [localUsers, setLocalUsers] = useState<any[]>(users);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const getChallengeStatus = (c: any) => {
    if (!c || (!c.presented && !c.startedAt)) return { day: 0, state: 'not_started', label: 'Non initié', progress: 0, color: 'text-neutral-500', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20' };
    if (c.cancelled) return { day: 0, state: 'cancelled', label: 'Abandonné', progress: 0, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    if (c.j3Completed) return { day: 3, state: 'completed', label: 'Totalement Terminé 👑', progress: 100, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' };
    
    // Fail checks (simplification based on dates, if J1 -> next day, etc)
    const today = new Date().toISOString().split('T')[0];
    
    if (c.j3Presented && !c.j3Completed) return { day: 3, state: 'active', label: 'Jour 3 en cours', progress: 66, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    if (c.j2Completed && !c.j3Presented) return { day: 2, state: 'waiting_next', label: 'J2 Fini, Attente J3', progress: 66, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (c.j2StartedAt && !c.j2Completed) {
       const j2Date = new Date(c.j2StartedAt).toISOString().split('T')[0];
       if (today > j2Date && !c.j3Presented) return { day: 2, state: 'failed', label: 'Échec J2', progress: 33, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
       return { day: 2, state: 'active', label: 'Jour 2 en cours', progress: 33, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    }
    if (c.j1Completed && !c.j2Presented) return { day: 1, state: 'waiting_next', label: 'J1 Fini, Attente J2', progress: 33, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (c.startedAt && !c.j1Completed) return { day: 1, state: 'active', label: 'Jour 1 en cours', progress: 0, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    if (c.presented && !c.startedAt) return { day: 1, state: 'active', label: 'Popup Vue, non démarré', progress: 0, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    
    return { day: 0, state: 'unknown', label: 'Inconnu', progress: 0, color: 'text-neutral-400', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20' };
  };

  const handleCommand = async (userId: string, action: string) => {
    // Les fonctions de type confirm() sont parfois bloquées par la sandbox iframe,
    // on désactive donc cette vérification pour que le bouton fonctionne vraiment.
    setLoadingId(userId);
    try {
      const user = localUsers.find(u => u.id === userId);
      const newPrefs = { ...(user?.store_preferences || {}) };
      const c = { ...(newPrefs.challenge_3j || {}) };
      const now = new Date().toISOString();

      if (action === 'reset') {
         c.presented = false;
         c.startedAt = null;
         c.j1Completed = false;
         c.j2Presented = false;
         c.j2StartedAt = null;
         c.j2Completed = false;
         c.j2CompletedAtStr = null;
         c.j3Presented = false;
         c.j3StartedAt = null;
         c.j3Completed = false;
         c.cancelled = false;
      } else if (action === 'set_j1') {
         c.presented = true;
         c.startedAt = c.startedAt || now;
         c.j1Completed = false;
         c.j2Presented = false;
         c.j2StartedAt = null;
         c.j2Completed = false;
         c.j2CompletedAtStr = null;
         c.j3Presented = false;
         c.j3StartedAt = null;
         c.j3Completed = false;
         c.cancelled = false;
      } else if (action === 'set_j2') {
         c.presented = true;
         c.startedAt = c.startedAt || now;
         c.j1Completed = true;
         c.j2Presented = true;
         c.j2StartedAt = now; // Force resync to today to be active
         c.j2Completed = false;
         c.j2CompletedAtStr = null;
         c.j3Presented = false;
         c.j3StartedAt = null;
         c.j3Completed = false;
         c.cancelled = false;
      } else if (action === 'set_j2_failed') {
         c.presented = true;
         c.startedAt = c.startedAt || now;
         c.j1Completed = true;
         c.j2Presented = true;
         c.j2StartedAt = new Date(Date.now() - 86400000 * 2).toISOString(); // 2 jours dans le passé pour forcer l'échec
         c.j2Completed = false;
         c.j2CompletedAtStr = null;
         c.j3Presented = false;
         c.j3StartedAt = null;
         c.j3Completed = false;
         c.cancelled = false;
      } else if (action === 'set_j3') {
         c.presented = true;
         c.startedAt = c.startedAt || now;
         c.j1Completed = true;
         c.j2Presented = true;
         c.j2StartedAt = c.j2StartedAt || now;
         c.j2Completed = true;
         c.j2CompletedAtStr = c.j2CompletedAtStr || now;
         c.j3Presented = true;
         c.j3StartedAt = now;
         c.j3Completed = false;
         c.cancelled = false;
      } else if (action === 'complete_all') {
         c.presented = true;
         c.startedAt = c.startedAt || now;
         c.j1Completed = true;
         c.j2Presented = true;
         c.j2Completed = true;
         c.j3Presented = true;
         c.j3Completed = true;
         c.cancelled = false;
      } else if (action === 'cancel') {
         c.cancelled = true;
      }
      
      newPrefs.challenge_3j = c;
      
      // Update UI Optimistically
      setLocalUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return { ...u, store_preferences: newPrefs };
        }
        return u;
      }));

      const { error } = await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userId);
      if (error) {
         console.warn("DB Update users failed (RLS?). Relying entirely on realtime broadcast.", error);
      }
      
      const dbPayload = {
        user_id: userId,
        presented: c.presented || false,
        started_at: c.startedAt || null,
        j1_completed: c.j1Completed || false,
        j2_presented: c.j2Presented || false,
        j2_started_at: c.j2StartedAt || null,
        j2_completed: c.j2Completed || false,
        j2_completed_at: c.j2CompletedAtStr || null,
        j3_presented: c.j3Presented || false,
        j3_started_at: c.j3StartedAt || null,
        j3_completed: c.j3Completed || false,
        cancelled: c.cancelled || false,
        updated_at: new Date().toISOString()
      };
      
      const { error: dbError } = await supabase.from('mz_challenge_3j_state').upsert(dbPayload, { onConflict: 'user_id' });
      if (dbError) {
         console.warn("mz_challenge_3j_state upsert failed:", dbError);
      }
      onRefresh();
      
      // Real-time broadcast to the target user's local instance
      const channel = supabase.channel('mz_admin_challenge_controls_' + userId);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'force_update',
            payload: { userId, challengeData: c, action }
          }).then(() => {
             supabase.removeChannel(channel);
          });
        }
      });
      
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la modification");
    } finally {
      setLoadingId(null);
    }
  };

  const processedUsers = useMemo(() => {
    let filtered = localUsers.filter((u: any) => {
       const status = getChallengeStatus(u.store_preferences?.challenge_3j);
       if (filterState === 'all_active') return status.state !== 'not_started';
       if (filterState === 'active') return status.state === 'active';
       if (filterState === 'completed') return status.state === 'completed';
       if (filterState === 'failed') return status.state === 'failed';
       if(filterState === 'cancelled') return status.state === 'cancelled';
       return true;
    });

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        (u.email || '').toLowerCase().includes(lowerSearch) || 
        (u.full_name || '').toLowerCase().includes(lowerSearch)
      );
    }
    
    // Sort : active first, then waiting_next, then failed, then completed, then cancelled
    const sortOrder: Record<string, number> = {
      'active': 0,
      'waiting_next': 1,
      'failed': 2,
      'completed': 3,
      'cancelled': 4,
      'not_started': 5,
      'unknown': 6
    };
    
    return filtered.sort((a, b) => {
       const sA = getChallengeStatus(a.store_preferences?.challenge_3j);
       const sB = getChallengeStatus(b.store_preferences?.challenge_3j);
       if(sortOrder[sA.state] !== sortOrder[sB.state]) {
          return sortOrder[sA.state] - sortOrder[sB.state];
       }
       return sB.day - sA.day;
    });
  }, [localUsers, filterState, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SectionTitle title="Administration Avancée - Défi 3 Jours" />
        
        {/* Testing Tools */}
        <div className="flex gap-2">
          <button 
            title="Déclenche le popup d'échec J2 sur votre propre session pour tester."
            onClick={() => {
              window.dispatchEvent(new CustomEvent('mz-test-day2-fail'));
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-colors"
          >
            <AlertTriangle size={14} /> Tester Popups
          </button>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-20">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[var(--color-gold-main)] transition-colors"
          />
        </div>
         <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white/30 w-full md:w-auto min-w-[200px]"
        >
          <option value="all_active">Tous les initiés</option>
          <option value="all">Tout le monde</option>
          <option value="active">En cours</option>
          <option value="completed">Terminés</option>
          <option value="failed">En Échec</option>
          <option value="cancelled">Abandonnés</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {processedUsers.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-400 bg-neutral-900/40 rounded-3xl border border-neutral-800">
            Aucun utilisateur ne correspond à votre recherche.
          </div>
        )}
        
        {processedUsers.map((u: any) => {
          const c = u.store_preferences?.challenge_3j || {};
          const status = getChallengeStatus(c);
          
          return (
            <GoldBorderCard key={u.id} className="relative overflow-hidden group">
              {/* Progress Bar Background */}
              <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                <div className="h-full bg-[var(--color-gold-main)] transition-all duration-500" style={{ width: `${status.progress}%` }} />
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-lg leading-tight">{u.full_name}</h4>
                    <p className="text-xs text-neutral-400 truncate mt-1">{u.email}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${status.bg} ${status.color} ${status.border}`}>
                    {status.label}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-center">
                    <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1 flex items-center gap-1">
                      <Target size={12} /> Jour Actuel
                    </div>
                    <div className="text-xl font-black text-white">J{status.day > 0 ? status.day : '-'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-center">
                    <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1 flex items-center gap-1">
                      <Clock size={12} /> Temps Écoulé
                    </div>
                    <div className="text-xs font-medium text-neutral-300">
                      {c.startedAt ? (
                        Math.max(0, Math.floor((new Date().getTime() - new Date(c.startedAt).getTime()) / (1000 * 3600 * 24))) + " jours"
                      ) : '---'}
                    </div>
                  </div>
                </div>

                {/* SUPER ADMIN CONTROLS */}
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                     <ShieldAlert size={12} /> Actions Rapides
                  </div>
                  
                  {/* Sets the user directly to a specific day */}
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <button 
                      onClick={() => handleCommand(u.id, 'set_j1')}
                      disabled={loadingId === u.id}
                      className="flex-1 min-w-[70px] py-1.5 text-xs font-bold rounded-lg border border-white/10 bg-white/5 hover:bg-[var(--color-gold-main)] hover:text-black hover:border-transparent transition-all disabled:opacity-50"
                    >
                      Forcer J1
                    </button>
                    <button 
                      onClick={() => handleCommand(u.id, 'set_j2')}
                      disabled={loadingId === u.id}
                      className="flex-1 min-w-[70px] py-1.5 text-xs font-bold rounded-lg border border-white/10 bg-white/5 hover:bg-[var(--color-gold-main)] hover:text-black hover:border-transparent transition-all disabled:opacity-50"
                    >
                      Forcer J2
                    </button>
                    <button 
                      onClick={() => handleCommand(u.id, 'set_j3')}
                      disabled={loadingId === u.id}
                      className="flex-1 min-w-[70px] py-1.5 text-xs font-bold rounded-lg border border-white/10 bg-white/5 hover:bg-[var(--color-gold-main)] hover:text-black hover:border-transparent transition-all disabled:opacity-50"
                    >
                      Forcer J3
                    </button>
                    <button 
                      onClick={() => handleCommand(u.id, 'set_j2_failed')}
                      disabled={loadingId === u.id}
                      className="flex-1 min-w-[70px] py-1.5 text-xs font-bold rounded-lg border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all disabled:opacity-50"
                    >
                      Échec J2
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCommand(u.id, 'complete_all')}
                      disabled={loadingId === u.id || status.state === 'completed'}
                      className="flex-1 py-2 flex items-center justify-center gap-2 text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                    >
                      <Award size={14} /> Valider M.
                    </button>
                    <button 
                      onClick={() => handleCommand(u.id, 'reset')}
                      disabled={loadingId === u.id || status.state === 'not_started'}
                      className="flex-1 py-2 flex items-center justify-center gap-2 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                    >
                      <PowerOff size={14} /> Reset
                    </button>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest flex items-center gap-2">
                       <Zap size={10} /> Simulator: Test Inactivité
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                       <button 
                         onClick={async () => {
                           const pastTime = new Date(Date.now() - (24.1 * 3600 * 1000)).toISOString();
                           const today = new Date().toISOString().split('T')[0];
                           await supabase.from('mz_rewards_time_tracking').upsert({ user_id: u.id, last_ping: pastTime, tracking_date: today }, { onConflict: 'user_id,tracking_date' });
                           await supabase.from('mz_background_notifications_log').delete().eq('user_id', u.id);
                           alert("Simulé: 24h d'absence. Attendez ~30s.");
                         }}
                         className="py-1 text-[10px] bg-white/5 border border-white/10 rounded hover:bg-white/10"
                       >
                         24h
                       </button>
                       <button 
                         onClick={async () => {
                           const pastTime = new Date(Date.now() - (48.1 * 3600 * 1000)).toISOString();
                           const today = new Date().toISOString().split('T')[0];
                           await supabase.from('mz_rewards_time_tracking').upsert({ user_id: u.id, last_ping: pastTime, tracking_date: today }, { onConflict: 'user_id,tracking_date' });
                           await supabase.from('mz_background_notifications_log').delete().eq('user_id', u.id);
                           alert("Simulé: 48h (Preuve Sociale). Attendez ~30s.");
                         }}
                         className="py-1 text-[10px] bg-white/5 border border-white/10 rounded hover:bg-white/10"
                       >
                         48h
                       </button>
                       <button 
                         onClick={async () => {
                           const pastTime = new Date(Date.now() - (72.1 * 3600 * 1000)).toISOString();
                           const today = new Date().toISOString().split('T')[0];
                           await supabase.from('mz_rewards_time_tracking').upsert({ user_id: u.id, last_ping: pastTime, tracking_date: today }, { onConflict: 'user_id,tracking_date' });
                           await supabase.from('mz_background_notifications_log').delete().eq('user_id', u.id);
                           alert("Simulé: 72h (Reality Check). Attendez ~30s.");
                         }}
                         className="py-1 text-[10px] bg-white/5 border border-white/10 rounded hover:bg-white/10"
                       >
                         72h
                       </button>
                    </div>
                  </div>
                  
                </div>
              </div>
            </GoldBorderCard>
          );
        })}
      </div>
    </div>
  );
};

