import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Gift, 
  ChevronRight, 
  BookOpen, 
  Download, 
  ArrowLeft, 
  Sparkles, 
  Search,
  Lock,
  Star,
  Crown
} from "lucide-react";
import { supabase } from "../../../services/supabase.ts";
import { UserProfile, TabId } from "../../../types.ts";
import { getBonusContent } from "../formation/bonusContentData.ts";

interface BonusHubProps {
  profile: UserProfile | null;
  onSwitchTab: (tab: TabId) => void;
}

export const BonusHub: React.FC<BonusHubProps> = ({ profile, onSwitchTab }) => {
  const [rewards, setRewards] = useState<{reward: any, id: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isMzPlus = profile?.user_level === "niveau_mz_plus";

  useEffect(() => {
    // Force scroll to top on arrival with a small delay to ensure content is measured
    const scrollTimer = setTimeout(() => {
      window.scrollTo(0, 0);
      const mainElement = document.querySelector('main');
      if (mainElement) mainElement.scrollTop = 0;
    }, 100);
    return () => clearTimeout(scrollTimer);
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchMyRewards = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("user_rank_rewards")
          .select("*, reward:rank_rewards(*)")
          .eq("user_id", profile.id);

        if (error) throw error;

        setRewards((data || []).map((item: any) => ({
          ...item,
          reward: item.reward || item.rank_rewards
        })));
      } catch (err) {
        console.error("Error fetching rewards:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyRewards();
  }, [profile?.id]);

  useEffect(() => {
    // Mark as read when opening page
    if (rewards.length > 0) {
      const rewardIds = rewards.filter(r => r && r.id).map(r => r.id);
      const readRewards = JSON.parse(localStorage.getItem("mz_read_rewards") || "[]");
      const newRead = Array.from(new Set([...readRewards, ...rewardIds]));
      localStorage.setItem("mz_read_rewards", JSON.stringify(newRead));
    }
  }, [rewards]);

  const filteredRewards = rewards.filter(r => {
    const title = (r.reward?.title || "").toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-full bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-amber-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Initialisation de l'espace Elite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#050505] text-white pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-32">
      {/* Background Enhancements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-5 relative z-10">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => onSwitchTab('dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-neutral-400 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Retour</span>
          </button>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-amber-500">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Elite Access</span>
            </div>
            <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">MZ+ V7.4.2</p>
          </div>
        </div>

        <div className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none mb-4"
          >
            VOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 drop-shadow-sm">BONUS</span> ELITE
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-500 text-sm md:text-base max-w-xl leading-relaxed"
          >
            Découvrez vos ressources exclusives, stratégies avancées et outils de croissance débloqués lors de votre ascension.
          </motion.p>
        </div>

        {/* Stats & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-neutral-500">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder="Rechercher par titre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-white/5 focus:border-amber-500/30 rounded-3xl py-4 pl-14 pr-6 text-sm outline-none transition-all focus:ring-4 ring-amber-500/5"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="px-6 py-4 bg-[#111] border border-white/5 rounded-3xl flex flex-col items-center justify-center shrink-0 min-w-[100px]">
              <span className="text-xs font-black text-amber-500 leading-none">{rewards.length}</span>
              <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Total</span>
            </div>
            <div className="px-6 py-4 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex flex-col items-center justify-center shrink-0 min-w-[100px]">
              <span className="text-xs font-black text-emerald-500 leading-none">{rewards.filter(r => !localStorage.getItem(`mz_bonus_viewed_${r.id}`)).length}</span>
              <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Nouveaux</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredRewards.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-24 px-8 bg-[#0d0d0d] border border-white/5 rounded-[3rem] flex flex-col items-center text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500/40">
                <Gift size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-widest">Contenu Indisponible</h3>
                <p className="text-neutral-500 text-sm max-w-xs mx-auto leading-relaxed">
                  {searchQuery ? "Aucun bonus ne correspond à votre recherche." : "Continuez votre ascension pour débloquer vos premières récompenses Elite."}
                </p>
              </div>
              {!searchQuery && (
                <button 
                  onClick={() => onSwitchTab('formation')}
                  className="px-8 py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all active:scale-95"
                >
                  Suivre la progression
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRewards.map((userReward, index) => {
                const rw = userReward.reward;
                const title = rw?.title || rw?.rank_name || `Bonus Débloqué`;
                const description = rw?.description || "Clique pour découvrir ton bonus exclusif MZ+.";
                const fileUrl = rw?.file_url || "";
                const imageUrl = rw?.image_url;
                const id = rw?.id || userReward.reward_id || userReward.id;
                const isUrl = fileUrl?.startsWith("http") && !fileUrl.includes(" ");
                const isViewed = localStorage.getItem(`mz_bonus_viewed_${id}`) === "true";

                return (
                  <motion.div
                    key={userReward.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-[#0d0d0d] border border-white/5 hover:border-amber-500/30 rounded-[2.5rem] p-6 transition-all cursor-pointer overflow-hidden flex flex-col space-y-6 shadow-2xl active:scale-[0.98]"
                    onClick={() => {
                      const bonusFallback = getBonusContent(id, title);
                      const textContent = bonusFallback || 
                                         (!isUrl && fileUrl && fileUrl.length > 10 ? fileUrl : null) || 
                                         (description && description.length > 10 ? description : null) || 
                                         "Bienvenue dans ton espace Elite ! Ce bonus contient des stratégies exclusives pour transformer tes réseaux sociaux en machine à cash.";
                      
                      if (textContent.length > 50 || !isUrl) {
                        window.dispatchEvent(new CustomEvent('mz-open-reward-content', {
                          detail: {
                            title: title,
                            text: textContent,
                            id: id,
                            imageUrl: imageUrl
                          }
                        }));
                      } else if (isUrl) {
                        window.open(fileUrl, "_blank");
                      }
                    }}
                  >
                    {/* Background Shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border border-white/10 group-hover:border-amber-500/30 transition-all flex-shrink-0 bg-neutral-900">
                        {imageUrl ? (
                          <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-500">
                            {isUrl ? <Download size={24} /> : <BookOpen size={24} />}
                          </div>
                        )}
                      </div>
                      
                      {!isViewed && (
                        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-500">Nouveau</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest opacity-60">Elite Strategy</span>
                        {isMzPlus && <Star size={10} className="text-amber-500 fill-amber-500 opacity-60" />}
                      </div>
                      <h4 className="text-xl font-black uppercase tracking-tight group-hover:text-amber-500 transition-colors line-clamp-2">
                        {title}
                      </h4>
                      <p className="text-xs text-neutral-500 font-medium leading-relaxed line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {description}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-neutral-600">
                           {isUrl ? <Download size={12} /> : <BookOpen size={12} />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">
                          {isUrl ? "Téléchargement" : "Contenu Privé"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-amber-500/40 group-hover:text-amber-500 transition-colors">
                        <span className="text-[9px] font-black uppercase tracking-widest">Ouvrir</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Premium Banner */}
        {!isMzPlus && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 p-8 rounded-[3rem] bg-gradient-to-br from-purple-900/40 via-[#111] to-[#0d0d0d] border border-purple-500/20 relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 text-purple-500 group-hover:scale-110 transition-transform duration-1000">
              <Lock size={120} />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Crown size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Débloquez l'Arsenal Elite</h3>
                <p className="text-neutral-400 text-sm max-w-sm leading-relaxed mx-auto">
                  Les membres Premium accèdent à x5 plus de bonus exclusifs et de stratégies à haut rendement.
                </p>
              </div>
              <button 
                onClick={() => onSwitchTab('upgrade')}
                className="px-10 py-5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-purple-600/20 transition-all hover:scale-105 active:scale-95"
              >
                Passer Premium 👉
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation Shortcut */}
      <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center pointer-events-none z-50">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 flex items-center gap-2 pointer-events-auto shadow-2xl">
          <button 
            onClick={() => onSwitchTab('dashboard')}
            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <div className="w-px h-8 bg-white/10" />
          <button 
            disabled
            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 rounded-2xl border border-amber-500/20"
          >
            Espace Bonus
          </button>
        </div>
      </div>
    </div>
  );
};
