import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, TrendingUp, Share2, Sparkles, Coins } from 'lucide-react';
import { MemberEvolution, subscribeToEvolutions, shareEvolution, checkIfLevelShared, generateWhatsAppLink, checkIfAchievementShared, getRandomMessage } from '../../../services/evolutionService';
import { EvolutionCard } from './EvolutionCard';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { UserProfile } from '../../../types';
import { supabase } from '../../../services/supabase';

export const EvolutionFeed: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const [evolutions, setEvolutions] = useState<MemberEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'level_up' | 'formation'>('all');
  const [isSharing, setIsSharing] = useState(false);
  const [canShareLevel, setCanShareLevel] = useState(false);
  const [unsharedChallengeDays, setUnsharedChallengeDays] = useState<number[]>([]);
  const [pendingSaleToShare, setPendingSaleToShare] = useState<{ id: string; amount: number } | null>(null);
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  useEffect(() => {
    const unsubscribe = subscribeToEvolutions((newEvolutions) => {
      setEvolutions(newEvolutions);
      setLoading(false);
    });

    const checkPendingShares = async () => {
      if (profile) {
        // Check Level
        const levelShared = await checkIfLevelShared(profile.id, profile.rank_name || 'Élite');
        setCanShareLevel(!levelShared);

        // Check Challenge Days
        const pendingDays: number[] = [];
        const challenge = profile.store_preferences?.challenge_3j;
        
        if (challenge) {
          if (challenge.j1Completed || challenge.j1_completed) {
            const shared = await checkIfAchievementShared(profile.id, 'Défi J1');
            if (!shared) pendingDays.push(1);
          }
          if (challenge.j2Completed || challenge.j2_completed) {
            const shared = await checkIfAchievementShared(profile.id, 'Défi J2');
            if (!shared) pendingDays.push(2);
          }
          if (challenge.j3Completed || challenge.j3_completed) {
            const shared = await checkIfAchievementShared(profile.id, 'Défi J3');
            if (!shared) pendingDays.push(3);
          }
        }
        setUnsharedChallengeDays(pendingDays);

        // Check for approved commissions that are not shared yet
        try {
          const { data: approvedComms } = await supabase
            .from('commissions')
            .select('id, amount, created_at')
            .eq('user_id', profile.id)
            .eq('status', 'approved');

          const { data: sharedSales } = await supabase
            .from('member_evolutions')
            .select('id, achievement_title')
            .eq('user_id', profile.id)
            .eq('type', 'achievement_unlocked');

          const sharedSaleTitles = (sharedSales || []).map(s => s.achievement_title || '');
          const sharedCommCount = sharedSaleTitles.filter(title => 
            title.toLowerCase().includes('commission') || 
            title.toLowerCase().includes('fcfa') || 
            title.toLowerCase().includes('vente')
          ).length;

          const totalApprovedCommsCount = approvedComms ? approvedComms.length : 0;
          
          if (totalApprovedCommsCount > sharedCommCount && approvedComms && approvedComms.length > 0) {
            const unshared = approvedComms.find(c => {
              const searchStr = `${c.amount.toLocaleString()}`;
              return !sharedSaleTitles.some(title => title.includes(searchStr));
            });

            if (unshared) {
              setPendingSaleToShare({ id: unshared.id, amount: unshared.amount });
            } else {
              setPendingSaleToShare(null);
            }
          } else {
            setPendingSaleToShare(null);
          }
        } catch (err) {
          console.error("Error verifying unshared sales:", err);
        }
      }
    };
    
    checkPendingShares();
 
    return () => unsubscribe();
  }, [profile?.id, profile?.rank_name, JSON.stringify(profile?.store_preferences?.challenge_3j)]);
 
  // Handling redirection scroll and golden highlighted target from notifications
  useEffect(() => {
    if (loading || evolutions.length === 0) return;

    const performScrollToPost = (postId: string) => {
      // Small timeout to allow the DOM node to be rendered
      setTimeout(() => {
        const element = document.getElementById(`evolution-card-${postId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight animation ring and glow
          element.classList.add('ring-2', 'ring-[var(--color-gold-main)]', 'shadow-[0_0_30px_rgba(201,168,76,0.55)]', 'scale-[1.02]');
          
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-[var(--color-gold-main)]', 'shadow-[0_0_30px_rgba(201,168,76,0.55)]', 'scale-[1.02]');
          }, 4500);

          localStorage.removeItem('mz_scroll_to_post');
          (window as any).mz_scroll_to_post = null;
        }
      }, 350);
    };

    // Check on tab load / mount
    const initialTargetId = localStorage.getItem('mz_scroll_to_post') || (window as any).mz_scroll_to_post;
    if (initialTargetId) {
      performScrollToPost(initialTargetId);
    }

    // Subscribe to immediate clicks if tab is already open/mounted
    const handleScrollEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const postId = customEvent.detail?.postId;
      if (postId) {
        performScrollToPost(postId);
      }
    };

    window.addEventListener('mz-scroll-to-post', handleScrollEvent as EventListener);
    return () => {
      window.removeEventListener('mz-scroll-to-post', handleScrollEvent as EventListener);
    };
  }, [loading, evolutions]);

  const handleShareCurrentRank = async () => {
    if (!profile || isSharing || !canShareLevel) return;
    setIsSharing(true);
    try {
      const message = getRandomMessage('level_up', { levelName: profile.rank_name || 'Élite' });
      
      const shareData = {
        user_id: profile.id,
        user_name: profile.full_name || profile.username,
        user_avatar: profile.avatar_url,
        type: 'level_up' as const,
        old_level: 'Membre',
        new_level: profile.rank_name || 'Élite',
        message: message
      };

      await shareEvolution(shareData);
      setCanShareLevel(false);

      setShareModal({ isOpen: true, message });
    } catch (err: any) {
      console.error(err);
      alert("Une erreur est survenue lors du partage.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareChallenge = async (day: number) => {
    if (!profile || isSharing) return;
    setIsSharing(true);
    try {
      const message = getRandomMessage('challenge', { day });
      
      const shareData = {
        user_id: profile.id,
        user_name: profile.full_name || profile.username,
        user_avatar: profile.avatar_url,
        type: 'achievement_unlocked' as const,
        new_level: `Défi J${day}`,
        message: message
      };

      await shareEvolution(shareData);
      setUnsharedChallengeDays(prev => prev.filter(d => d !== day));

      setShareModal({ isOpen: true, message });
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors du partage.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareSale = async () => {
    if (!profile || isSharing || !pendingSaleToShare) return;
    setIsSharing(true);
    try {
      const amountStr = `${pendingSaleToShare.amount.toLocaleString()} FCFA`;
      const messages = [
        `💰 BOOM ! Je viens de valider une nouvelle vente et d'encaisser ${amountStr} de commission sur MZ+ ! L'affiliation paye ! 💸`,
        `🚀 Et de une ! Nouvelle vente enregistrée et ${amountStr} de commission sécurisée sur mon compte MZ+ ! La méthode fonctionne ! 💎`,
        `🔥 Les efforts payent ! Je viens de générer ${amountStr} de commission d'affiliation sur MZ+. Le système est lancé ! 💸`,
        `⚡️ Argent encaissé ! Je viens de valider une commission de ${amountStr} sur MZ+. Merci pour l'accompagnement ! 💰`
      ];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      const shareData = {
        user_id: profile.id,
        user_name: profile.full_name || profile.username,
        user_avatar: profile.avatar_url,
        type: 'achievement_unlocked' as const,
        achievement_title: `Commission de ${amountStr}`,
        new_level: `Commission de ${amountStr}`,
        message: message
      };

      await shareEvolution(shareData);
      setPendingSaleToShare(null);

      setShareModal({ isOpen: true, message });
    } catch (err) {
      console.error("Error sharing sale achievement:", err);
      alert("Une erreur est survenue lors du partage.");
    } finally {
      setIsSharing(false);
    }
  };

  const filteredEvolutions = evolutions.filter(ev => {
    if (filter === 'all') return true;
    if (filter === 'level_up') return ev.type === 'level_up';
    if (filter === 'formation') return ev.type === 'formation_completed';
    return true;
  });

  return (
    <div className="relative">
      {/* Header Section */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              Évolutions
            </h2>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1 ring-1 ring-white/5 inline-block px-2 py-0.5 rounded">
              Activités de la communauté
            </p>
          </div>
        </div>

        {/* Share Sale/Commission Achievement Banner */}
        {profile && pendingSaleToShare && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-[2rem] bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-500/30 relative overflow-hidden group shadow-[0_0_30px_rgba(245,158,11,0.05)]"
          >
            <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:scale-125 transition-transform">
              <Coins size={44} className="text-amber-400 animate-bounce" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Commission en attente de publication 💸</span>
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight pt-1">
                  Tu as encaissé <span className="text-amber-400 font-black">{pendingSaleToShare.amount.toLocaleString()} FCFA</span> ! 🎉
                </h3>
                <p className="text-[10px] text-neutral-400 font-medium">Ne garde pas ce succès secret ! Partage ta commission maintenant pour inspirer tes partenaires et prouver que la méthode fonctionne.</p>
              </div>
              
              <button
                onClick={handleShareSale}
                disabled={isSharing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-neutral-950 text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSharing ? 'Publication...' : <><Share2 size={12} /> Partager ma Commission</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* Share Achievement CTA */}
        {profile && (canShareLevel || unsharedChallengeDays.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[2rem] bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <Sparkles size={40} className="text-blue-400" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight">Partage tes victoires !</h3>
                <p className="text-[10px] text-neutral-400 font-medium">Inspirer la communauté te permet de marquer ton territoire.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {canShareLevel && (
                  <button
                    onClick={handleShareCurrentRank}
                    disabled={isSharing}
                    className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isSharing ? 'Envoi...' : <><Share2 size={12} /> Partager mon Grade</>}
                  </button>
                )}

                {unsharedChallengeDays.map(day => (
                  <button
                    key={day}
                    onClick={() => handleShareChallenge(day)}
                    disabled={isSharing}
                    className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isSharing ? 'Envoi...' : <><Share2 size={12} /> Défi J{day} Validé</>}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredEvolutions.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-neutral-600">
            <TrendingUp size={32} />
          </div>
          <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Aucune évolution pour le moment</h3>
          <p className="text-sm text-neutral-500 max-w-xs mx-auto mt-2 font-medium">Soyez le premier à partager votre progression et inspirez les autres !</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredEvolutions.map((ev) => (
              <EvolutionCard 
                key={ev.id} 
                evolution={ev} 
                profile={profile} 
                onExternalShare={(msg) => setShareModal({ isOpen: true, message: msg })}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {shareModal.isOpen && (
          <WhatsAppShareModal 
            isOpen={shareModal.isOpen}
            onClose={() => setShareModal(prev => ({ ...prev, isOpen: false }))}
            onShare={() => {
              console.log("Sharing to WhatsApp:", shareModal.message);
              window.open(generateWhatsAppLink(shareModal.message), '_blank');
              setShareModal(prev => ({ ...prev, isOpen: false }));
            }}
            title="Impacte la Communauté"
            description="Félicitations ! Partage maintenant ton succès dans le groupe WhatsApp pour inspirer tout le monde."
          />
        )}
      </AnimatePresence>
    </div>
  );
};
