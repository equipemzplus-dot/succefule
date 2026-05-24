import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus,
  Lock,
  Target,
  Crown,
  ChevronRight,
  Video,
  BookOpen,
  ArrowLeft,
  Mail,
  Facebook,
  Share2,
  Store,
  ArrowRight,
  Eye,
  EyeOff,
  Trophy,
  LogOut,
  Rocket,
  MapPin,
  FileText,
  Sparkles,
  Calendar,
} from "lucide-react";
import {
  UserProfile,
  TabId,
} from "../types.ts";
import {
  SectionTitle,
  GoldBorderCard,
  GoldText,
  PrimaryButton,
} from "./UI.tsx";
import { useAxis } from "./features/axis/AxisProvider.tsx";
import { supabase } from "../services/supabase.ts";
import { AcademieMain } from "./features/formation/AcademieMain.tsx";
import { RpaDashboard } from "./features/rpa/RpaDashboard.tsx";
import { CoachingDashboard } from "./features/coaching/CoachingDashboard.tsx";
import { ReferralDashboard } from "./features/referral/ReferralDashboard.tsx";
import { GuidesTab as GuidesTabComponent } from "./GuidesTab.tsx";
import { WithdrawalSystem } from "./features/withdrawals/WithdrawalSystem.tsx";
import { WithdrawalForm as WithdrawalFormView } from "./features/withdrawals/WithdrawalForm.tsx";
import { useCurrency } from "../hooks/useCurrency.ts";
import {
  LiquidProgressionTube,
  getCurrentLevel,
} from "./features/progression/LiquidProgressionTube.tsx";
import { Gift, Share2 as ShareIcon, TrendingUp as TrendingIcon } from "lucide-react";
import { DailyMission } from "./features/challenges/DailyMission.tsx";
import { EvolutionFeed } from "./features/community/EvolutionFeed.tsx";
import { WhatsAppShareModal } from "./features/community/WhatsAppShareModal.tsx";
import { shareEvolution, generateWhatsAppLink, getRandomMessage, checkIfAchievementShared } from "../services/evolutionService.ts";
import { ChariowTestConsole } from "./ChariowTestConsole.tsx";



const UserRewardsSection: React.FC<{ profile: UserProfile | null }> = ({
  profile,
}) => {
  const [rewards, setRewards] = useState<{reward: any, id: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const lastViewedRewards: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("mz_read_rewards") || "[]");
    } catch { return []; }
  })();

  const unreadCount = rewards.filter(r => r && r.id && (r.reward || r.rank_rewards) && !lastViewedRewards.includes(r.id)).length;

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

  const handleNavigate = () => {
    window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'bonuses' }));
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0e0e0d] border border-white/5 opacity-60">
        <div className="w-11 h-11 rounded-full bg-neutral-900 border border-white/5 animate-pulse flex items-center justify-center mb-2"></div>
        <div className="h-2.5 w-12 bg-neutral-900 rounded animate-pulse mb-1.5"></div>
        <div className="h-2 w-10 bg-neutral-950 rounded animate-pulse"></div>
      </div>
    );

  return (
    <button
      onClick={handleNavigate}
      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0e0e0d] border transition-all duration-300 group relative active:scale-95 ${
        unreadCount > 0
          ? "border-amber-500/30 bg-amber-500/[0.02] hover:border-amber-500/50 hover:bg-amber-500/[0.06]"
          : "border-white/5 hover:border-amber-500/25 hover:bg-amber-500/[0.02]"
      }`}
    >
      {unreadCount > 0 && (
        <div className="absolute top-1.5 right-1.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
        </div>
      )}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-all duration-300 shadow-md ${
        unreadCount > 0 
          ? "bg-amber-500/20 border border-amber-500/40 text-amber-400" 
          : "bg-amber-500/10 border border-amber-500/20 text-amber-500/70"
      }`}>
        <Gift size={18} className={unreadCount > 0 ? "drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]" : ""} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-tight text-neutral-200">
        Bonus
      </span>
      <span className="text-[8px] font-bold uppercase tracking-widest text-amber-500/70 mt-0.5">
        ({rewards.length}) Obtenus
      </span>
    </button>
  );
};

type HubCategory = "main" | "business" | "referral" | "academy" | "community";

export const GlobalView: React.FC<any> = ({
  profile,
  onSwitchTab,
  onStartGuide,
  activeCategory,
  setActiveCategory,
  wallet,
  onRefresh,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [isShopHighlighted, setIsShopHighlighted] = useState(false);
  const { convertAndFormat } = useCurrency();
  const { triggerAxisMessage } = useAxis();
  const isMzPlus = profile?.user_level === "niveau_mz_plus";

  const [loginCount, setLoginCount] = useState(1);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [sharedChallengeDays, setSharedChallengeDays] = useState<number[]>([]);
  const [shareModalData, setShareModalData] = useState<{ 
    isOpen: boolean; 
    day: number | null;
    platform?: "whatsapp" | "facebook" | "gmail";
    type: 'challenge' | 'referral'
  }>({
    isOpen: false,
    day: null,
    type: 'challenge'
  });

  const handleExecuteShare = async () => {
    if (!profile) return;
    
    if (shareModalData.type === 'challenge' && shareModalData.day !== null) {
      const day = shareModalData.day;
      const message = getRandomMessage('challenge', { day });
      
      await shareEvolution({
        user_id: profile.id,
        user_name: profile.full_name || profile.username,
        user_avatar: profile.avatar_url,
        type: 'achievement_unlocked',
        new_level: `Défi J${day}`,
        message: message
      });

      setSharedChallengeDays(prev => [...prev, day]);
      setShareModalData(prev => ({ ...prev, isOpen: false }));

      // Auto open WhatsApp
      const whatsappLink = generateWhatsAppLink(message);
      window.open(whatsappLink, '_blank');
    } else if (shareModalData.type === 'referral') {
      setShareModalData(prev => ({ ...prev, isOpen: false }));
      executeReferralShare(shareModalData.platform);
    }
  };

  useEffect(() => {
    const savedCount = parseInt(localStorage.getItem("mz_login_count") || "0");
    if (!sessionStorage.getItem("mz_session_counted_gv")) {
      const newCount = savedCount + 1;
      localStorage.setItem("mz_login_count", newCount.toString());
      sessionStorage.setItem("mz_session_counted_gv", "true");
      setLoginCount(newCount);
    } else {
      setLoginCount(savedCount);
    }
    setIsChallengeActive(
      profile?.store_preferences?.challenge_3j?.presented === true,
    );

    // Listen to custom event for challenge start
    const handleChallengeChange = () => setIsChallengeActive(true);
    const handleAction = () => setForceRender((prev) => prev + 1);

    window.addEventListener("mz-challenge-3j-started", handleChallengeChange);
    window.addEventListener("mz-product-added-to-store", handleAction);
    window.addEventListener("mz-new-sale", handleAction);

    return () => {
      window.removeEventListener(
        "mz-challenge-3j-started",
        handleChallengeChange,
      );
      window.removeEventListener("mz-product-added-to-store", handleAction);
      window.removeEventListener("mz-new-sale", handleAction);
    };
  }, []);

  const challengeDb = profile?.store_preferences?.challenge_3j || {};
  const j1Completed = challengeDb.j1Completed === true || challengeDb.j1_completed === true;
  const j2Completed = challengeDb.j2Completed === true || challengeDb.j2_completed === true;
  const j3Completed = challengeDb.j3Completed === true || challengeDb.j3_completed === true;

  useEffect(() => {
    if (!profile) return;
    const checkShares = async () => {
      try {
        const shares = [];
        if (j1Completed && await checkIfAchievementShared(profile.id, 'Défi J1')) shares.push(1);
        if (j2Completed && await checkIfAchievementShared(profile.id, 'Défi J2')) shares.push(2);
        if (j3Completed && await checkIfAchievementShared(profile.id, 'Défi J3')) shares.push(3);
        setSharedChallengeDays(shares);
      } catch (err) {
        console.error("Error checking shared days:", err);
      }
    };
    checkShares();
  }, [profile?.id, j1Completed, j2Completed, j3Completed]);

  useEffect(() => {
    const handleHighlight = () => {
      setIsShopHighlighted(true);
      setTimeout(() => setIsShopHighlighted(false), 9000);
    };

    const handleScroll = () => {
      const shopBtn = document.getElementById("shop-category-btn");
      const targetY = shopBtn
        ? shopBtn.getBoundingClientRect().top +
          window.scrollY -
          window.innerHeight / 2 +
          50
        : 300;

      const startY = window.scrollY;
      const difference = targetY - startY;
      let startTime: number | null = null;
      const duration = 1500; // 1.5 seconds

      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const step = (now: number) => {
        if (!startTime) startTime = now;
        const time = now - startTime;
        const fraction = easeInOutCubic(Math.min(time / duration, 1));
        window.scrollTo(0, startY + difference * fraction);
        if (time < duration) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    window.addEventListener("mz-highlight-shop", handleHighlight);
    window.addEventListener("mz-scroll-to-shop", handleScroll);
    return () => {
      window.removeEventListener("mz-highlight-shop", handleHighlight);
      window.removeEventListener("mz-scroll-to-shop", handleScroll);
    };
  }, []);

  const currentBalance = wallet?.balance || 0;
  const todayGain = wallet?.today_gain || 0;
  const totalCash = (wallet?.balance || 0) + (profile?.rpa_balance || 0);

  const { formatted, originalFormatted, isXAF } =
    convertAndFormat(currentBalance);
  const todayGainFormatted = convertAndFormat(todayGain).formatted;

  // Calcul de la progression (simulée selon le niveau)
  const progressPercent = 62;
  const currentLevel = "Argent";
  const nextLevel = "Or";

  const categories = [
    {
      id: "business",
      title: "Ma Boutique",
      desc: "Mon Empire",
      emoji: "🏪",
      badge: "ACTIF",
      color: "bg-red-500/20 text-red-500 border-red-500/10",
    },
    {
      id: "referral",
      title: "Inviter & Gagner",
      desc: "Gains passifs",
      emoji: "🔗",
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/10",
    },
    {
      id: "academy",
      title: "Académie",
      desc: "Formations",
      emoji: "🎓",
      color: "bg-purple-500/20 text-purple-400 border-purple-500/10",
    },
  ];

  const handleReferralShare = (platform?: "whatsapp" | "facebook" | "gmail") => {
    if (platform === "whatsapp") {
      setShareModalData({ isOpen: true, day: null, platform: "whatsapp", type: 'referral' });
    } else {
      executeReferralShare(platform);
    }
  };

  const executeReferralShare = (platform?: "whatsapp" | "facebook" | "gmail") => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/register?ref=${profile?.referral_code || "elite"}`;
    const shareText = `Je viens de tomber sur MZ+.\nC’est un système en ligne qui permettrait de générer des revenus en ligne assez simplement.\nJ'ai deja commnecz et franchement ça a l’air intéressant.\nSi tu veux jeter un œil 👇\n\n${shareUrl}`;

    if (platform === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        "_blank",
      );
    } else if (platform === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
        "_blank",
      );
    } else if (platform === "gmail") {
      window.open(
        `mailto:?subject=Découvre MZ+ Elite&body=${encodeURIComponent(shareText)}`,
        "_blank",
      );
    } else if (navigator.share) {
      try {
        navigator.share({
          title: "MZ+ Elite Business",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Message de parrainage copié !");
    }
  };

  const copyToClipboard = () => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/register?ref=${profile?.referral_code || "elite"}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Lien de parrainage copié !");
  };

  const renderCategoryDetails = () => {
    switch (activeCategory) {
      case "business":
        return (
          <div className="grid grid-cols-2 gap-3 animate-fade-in text-left">
            <SubServiceCard
              title="Ma Boutique"
              desc="Gérer mes liens"
              icon={Store}
              onClick={() => onSwitchTab("affiliation")}
            />
            <SubServiceCard
              title="Vidéo"
              desc="TikTok/Reels"
              icon={Video}
              locked={!isMzPlus}
              onClick={() => onSwitchTab("rpa")}
            />
            <SubServiceCard
              title="Mon Équipe"
              desc="Communauté"
              icon={UserPlus}
              onClick={() => onSwitchTab("team")}
            />
          </div>
        );
      case "referral":
        return (
          <div className="grid grid-cols-1 gap-3 animate-fade-in text-left">
            <div className="grid grid-cols-2 gap-3 pb-2">
              <button
                onClick={() => handleReferralShare("whatsapp")}
                className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.548 0 10.058-4.51 10.06-10.059.002-2.689-1.047-5.215-2.951-7.121-1.905-1.905-4.432-2.954-7.122-2.956-5.549 0-10.06 4.511-10.063 10.06-.001 2.032.547 3.513 1.488 5.13l-.999 3.648 3.731-.979zm11.367-7.393c-.31-.154-1.829-.903-2.11-.1.282-.102-.338-.204-.984-1.392-.506-.21-.422-.224-.744-.095-.547-.223-2.01-.739-3.344-1.928-1.037-.926-1.74-2.069-1.942-2.422-.204-.353-.021-.544.155-.72.158-.159.352-.412.529-.617.175-.206.234-.352.352-.588.117-.235.059-.441-.03-.617-.089-.176-.744-1.792-1.018-2.454-.267-.643-.538-.556-.744-.567-.19-.009-.41-.01-.63-.01-.22 0-.58.083-.884.412-.303.33-1.157 1.132-1.157 2.76 0 1.629 1.186 3.203 1.353 3.424.167.221 2.335 3.563 5.656 4.996.79.341 1.405.544 1.886.696.791.248 1.512.213 2.081.127.635-.095 1.829-.747 2.086-1.468.257-.721.257-1.341.18-1.468-.077-.127-.282-.204-.593-.352z" />
                  </svg>
                </div>
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                  WhatsApp
                </p>
              </button>

              <button
                onClick={() => executeReferralShare("facebook")}
                className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Facebook size={22} />
                </div>
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                  Facebook
                </p>
              </button>

              <button
                onClick={() => executeReferralShare("gmail")}
                className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                  <Mail size={22} />
                </div>
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                  Gmail
                </p>
              </button>

              <button
                onClick={() => executeReferralShare()}
                className="flex flex-col items-center gap-2 p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <Share2 size={22} />
                </div>
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                  Autres
                </p>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
                  Presse-papier
                </p>
                <p className="text-[12px] font-black text-[var(--color-gold-main)] tracking-tight">
                  Code : {profile?.referral_code?.toUpperCase() || "ELITE"}
                </p>
              </div>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 rounded-xl bg-[var(--color-gold-main)] text-black text-[10px] font-black uppercase shadow-lg shadow-yellow-600/20"
              >
                COPIER LE LIEN
              </button>
            </div>
          </div>
        );
      case "academy":
        return (
          <div className="grid grid-cols-1 gap-3 animate-fade-in">
            <SubServiceCard
              title="Formations MZ+"
              desc="Cours vidéo"
              icon={BookOpen}
              locked={!isMzPlus}
              onClick={() => onSwitchTab("formation")}
            />
            <SubServiceCard
              title="Coaching"
              desc="Expert"
              icon={Target}
              locked={!isMzPlus}
              onClick={() => onSwitchTab("coaching")}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (activeCategory !== "main") {
    return (
      <div className="max-w-md mx-auto px-6 py-8 space-y-8 animate-fade-in min-h-screen">
        <button
          onClick={() => setActiveCategory("main")}
          className="flex items-center gap-2 text-[var(--color-text-gray)] hover:text-white transition-colors text-[9px] font-bold uppercase tracking-widest opacity-60"
        >
          <ArrowLeft size={14} /> Retour
        </button>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-black uppercase tracking-tighter text-white">
              {activeCategory === "business"
                ? "Ma Boutique"
                : activeCategory === "referral"
                  ? "Inviter"
                  : activeCategory === "academy"
                    ? "Académie"
                    : activeCategory}
            </h3>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-gold-main)]/20 to-transparent"></div>
          </div>
          {renderCategoryDetails()}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 pt-10 px-4 md:px-5 relative min-h-screen font-sans overflow-x-hidden">
      {/* GREETING */}
      <div className="flex items-end justify-between mb-8 mt-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic leading-tight">
              Salut{" "}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold-main)] drop-shadow-[0_4px_8px_rgba(201,168,76,0.3)]">
                  {profile?.full_name?.split(" ")[0] || "Élite"}
                </span>
                <span className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-gradient-to-r from-[var(--color-gold-main)]/60 to-transparent rounded-full shadow-[0_0_8px_var(--color-gold-main)]"></span>
              </span>
              , <br />
              <span className="text-[14px] font-bold text-white/90 normal-case tracking-tight not-italic">
                Ravi de te revoir !
              </span>
            </h2>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {shareModalData.isOpen && (
          <WhatsAppShareModal 
            isOpen={shareModalData.isOpen} 
            onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
            onShare={handleExecuteShare}
          />
        )}
      </AnimatePresence>

      {(() => {
        const is3JFinished = challengeDb.j3Completed === true || challengeDb.j3_completed === true;
        const is3JCancelled = challengeDb.cancelled === true;
        
        if (loginCount >= 3 && (is3JCancelled || is3JFinished)) {
          return <DailyMission onSwitchTab={onSwitchTab} profile={profile} onRefresh={onRefresh} />;
        }
        
        // If not enough logins or hasn't even seen the challenge yet, show nothing (normal dashboard)
        // This avoids confusing the user at the very beginning.
        if (loginCount < 3 || !challengeDb.presented) {
          return null;
        }

        const j2Presented = challengeDb.j2Presented === true || challengeDb.j2_presented === true;
        const j3Presented = challengeDb.j3Presented === true || challengeDb.j3_presented === true;

        // Check if Day 2 is overdue (it was started on a previous day)
        const isJ2Overdue = challengeDb.j2StartedAt && (() => {
          const startDate = new Date(challengeDb.j2StartedAt);
          const now = new Date();
          // Overdue if it's not the same day AND now is after startDate
          return startDate.toDateString() !== now.toDateString() && now > startDate;
        })();

        let mission = null;
        let isWaiting = false;

        const handleShare = (day: number) => {
          setShareModalData({ isOpen: true, day });
        };

        // Priority 1: Day 3 (either naturally unlocked or J2 missed)
        if ((j3Presented || (j2Presented && !j2Completed && isJ2Overdue)) && !j3Completed) {
          mission = {
            day: 3,
            title: "Faire exploser tes ventes",
            desc: isJ2Overdue && !j2Completed 
              ? "Tu as manqué le défi d'hier, mais rien n'est perdu ! Termine par ta mission finale." 
              : "Partage ta boutique pour faire une nouvelle vente et confirmer ton succès !",
            action: "Voir ma boutique",
            tab: "my_store",
          };
        } else if (j2Completed && !j3Presented) {
          isWaiting = true;
          mission = {
            day: 2,
            title: "Mission Accomplie !",
            desc: "Parfait ! Reviens demain pour ton dernier défi.",
            action: "Patienter",
            tab: "dashboard",
          };
        } else if (j2Presented && !j2Completed && !isJ2Overdue) {
          mission = {
            day: 2,
            title: "Vendre ton produit",
            desc: "Maintenant que tu as ton produit, c'est l'heure de ta première vente ! Suis la formation.",
            action: "Suivre la formation",
            tab: "formation",
            event: "open-formation",
            detail: { id: "default-free-video" },
          };
        } else if (j1Completed && !j2Presented) {
          isWaiting = true;
          mission = {
            day: 1,
            title: "Mission Accomplie !",
            desc: "Bravo ! Reviens demain pour la prochaine mission.",
            action: "Patienter",
            tab: "dashboard",
          };
        } else if (!j1Completed) {
          mission = {
            day: 1,
            title: "Choisir le bon produit",
            desc: "Prends le temps d'explorer le catalogue et ajoute un produit à ta boutique.",
            action: "Ouvrir le catalogue",
            tab: "affiliation",
          };
        }

        if (!mission) return null;

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#111] border border-emerald-500/30 rounded-2xl p-4 shadow-[0_8px_20px_rgba(16,185,129,0.1)] relative overflow-hidden group mb-4"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-500 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300 pointer-events-none">
              <Rocket size={40} />
            </div>

            <div className="flex flex-col relative z-10">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-black text-xs shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                  J{mission.day}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
                    {isWaiting ? "Objectif Atteint" : "Ta mission aujourd'hui"}
                  </p>
                  <h3 className="text-[14px] font-black leading-tight text-white mb-1.5">
                    {mission.title}
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    {mission.desc}
                  </p>
                </div>
              </div>

              {!isWaiting && (
                <button
                  onClick={() => {
                    if (mission?.tab) onSwitchTab(mission.tab as TabId);
                    if (mission?.event) {
                      // Small delay to allow tab switch
                      setTimeout(() => {
                        window.dispatchEvent(
                          new CustomEvent(mission.event as string, {
                            detail: mission.detail,
                          }),
                        );
                      }, 100);
                    }
                  }}
                  className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all border border-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {mission.action} 👉
                </button>
              )}
              {isWaiting && !sharedChallengeDays.includes(mission.day) && (
                <button
                  onClick={() => {
                    handleShare(mission.day);
                    setSharedChallengeDays(prev => [...prev, mission.day]);
                  }}
                  className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <ShareIcon size={14} />
                  Partager mon succès
                </button>
              )}
              
              <button
                onClick={async () => {
                  if (
                    !window.confirm(
                      "Êtes-vous sûr de vouloir abandonner le défi des 3 Jours ? Cette action est définitive.",
                    )
                  )
                    return;
                  const newPrefs = { ...(profile.store_preferences || {}) };
                  if (!newPrefs.challenge_3j) newPrefs.challenge_3j = {};
                  newPrefs.challenge_3j.cancelled = true;
                  
                  // Update both tables to keep states perfectly synchronized
                  await supabase
                    .from("users")
                    .update({ store_preferences: newPrefs })
                    .eq("id", profile?.id);
                  
                  await supabase
                    .from("mz_challenge_3j_state")
                    .update({ cancelled: true })
                    .eq("user_id", profile?.id);
                    
                  window.location.reload();
                }}
                className="w-full mt-2 py-2 text-[10px] font-bold text-neutral-500 hover:text-red-400 uppercase tracking-widest transition-colors"
              >
                Renoncer au défi
              </button>
            </div>
          </motion.div>
        );
      })()}

      {/* CHARIOW API TEST PORTAL */}
      <ChariowTestConsole />

      {/* 1. CARTE SOLDE (ELITE BUSINESS HUB) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full bg-gradient-to-br from-[#111009] via-[#161410] to-[#0A0908] rounded-[3rem] p-7 border relative overflow-hidden group shadow-[0_30px_60px_rgba(0,0,0,0.6)] ${
          isMzPlus
            ? "border-[var(--color-gold-main)]/40 shadow-[0_0_40px_rgba(201,168,76,0.1)]"
            : "border-[var(--color-border-gold)]"
        }`}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-gold-main)]/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-[var(--color-gold-main)]/20 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--color-academy-purple)]/5 blur-[60px] rounded-full -ml-10 -mb-10"></div>

        <div className="flex justify-between items-start relative z-10 mb-6">
          <div className="space-y-1.5">
            {/* Status Badge (REPOSITIONED & HIGH IMPACT) */}
            <div
              onClick={() => !isMzPlus && onSwitchTab("upgrade")}
              className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border backdrop-blur-3xl transition-all duration-700 shadow-2xl relative overflow-hidden group/badge ${
                !isMzPlus
                  ? "cursor-pointer hover:border-[#F9D074]/50 hover:bg-[#C9A84C]/20 hover:scale-105 active:scale-95"
                  : "hover:scale-[1.05]"
              } ${
                isMzPlus
                  ? "bg-gradient-to-br from-[#2D1B69] via-[#7C3AED] to-[#4F46E5] border-purple-300/50 text-white shadow-[0_10px_40px_rgba(124,58,237,0.4),0_0_20px_rgba(168,85,247,0.2)_inset] ring-1 ring-white/30"
                  : "bg-white/5 border-white/10 text-[#6B6050]"
              }`}
            >
              {isMzPlus && (
                <>
                  <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-full group-hover/badge:animate-[shimmer_2.5s_infinite] pointer-events-none" />
                  <div className="absolute -top-1 -right-1 opacity-40 group-hover/badge:opacity-100 transition-opacity">
                    <Sparkles size={8} className="text-white animate-pulse" />
                  </div>
                </>
              )}
              {isMzPlus ? (
                <Crown
                  size={12}
                  className="text-yellow-300 fill-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-bounce-subtle"
                />
              ) : (
                <Crown size={12} className="opacity-40" />
              )}
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] select-none ${isMzPlus ? 'italic drop-shadow-sm' : ''}`}>
                {isMzPlus ? "Membre Premium" : "Membre Standard"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-baseline">
              <motion.div
                key={showBalance ? "visible" : "hidden"}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col"
              >
                {showBalance ? (
                  <>
                    <h2 className="text-4xl md:text-5xl font-display text-[var(--color-gold-main)] tracking-tight leading-none drop-shadow-[0_10px_20px_rgba(201,168,76,0.3)] bg-gradient-to-b from-[var(--color-gold-light)] to-[var(--color-gold-main)] bg-clip-text text-transparent">
                      {formatted}
                    </h2>
                    {!isXAF && (
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">
                        ≈ {originalFormatted}
                      </span>
                    )}
                  </>
                ) : (
                  <h2 className="text-5xl font-display text-[var(--color-gold-main)] tracking-tight leading-none drop-shadow-[0_10px_20px_rgba(201,168,76,0.3)] bg-gradient-to-b from-[var(--color-gold-light)] to-[var(--color-gold-main)] bg-clip-text text-transparent">
                    •••••••
                  </h2>
                )}
              </motion.div>
            </div>

            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2.5 bg-white/5 rounded-xl text-[var(--color-text-gray)] hover:text-[var(--color-gold-main)] transition-all border border-white/5 active:scale-95 shadow-lg flex items-center justify-center translate-y-[-4px]"
            >
              {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                Gains Aujourd'hui :{" "}
                <span className="text-white">+{todayGainFormatted}</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. BOUTON RETIRER (SLEEK) */}
      <motion.button
        whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(201,168,76,0.1)" }}
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          setShowWithdrawForm(true);
        }}
        className="w-full py-3 bg-[var(--color-gold-main)] text-black rounded-xl font-black uppercase text-[9px] tracking-[0.3em] shadow-lg flex items-center justify-center gap-2 transition-all hover:bg-[var(--color-gold-light)]"
      >
        <span className="text-base">💸</span> Retirer mes gains
      </motion.button>

      {showWithdrawForm && (
        <WithdrawalFormView
          profile={profile}
          balance={totalCash}
          onClose={() => setShowWithdrawForm(false)}
          onSuccess={() => setShowWithdrawForm(false)}
        />
      )}

      {/* 4. ACTIONS (NEW CIRCULAR ALIGNMENT) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[9px] font-black uppercase text-[var(--color-text-gray)] tracking-[0.4em]">
            Que veux-tu faire ?
          </h3>
          <div className="h-[1px] flex-1 ml-4 bg-[var(--color-border-gold)] opacity-20"></div>
        </div>

        <div className="flex items-center justify-around md:justify-center gap-2 md:gap-8 px-0 md:px-2 py-4">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx, type: "spring" }}
              className="flex flex-col items-center gap-3 active:scale-95 transition-transform min-w-0"
            >
              <button
                id={cat.id === "business" ? "shop-category-btn" : undefined}
                onClick={() => {
                  if (cat.id === "business") {
                    onSwitchTab("affiliation");
                    setIsShopHighlighted(false); // remove highlight on click
                    window.dispatchEvent(new CustomEvent("mz-shop-opened"));
                  } else {
                    setActiveCategory(cat.id as any);
                  }
                }}
                className={`w-16 h-16 xs:w-20 xs:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl xs:text-3xl md:text-4xl relative group transition-all duration-700 ease-out
                  ${
                    cat.id === "business" && isShopHighlighted
                      ? "bg-gradient-to-br from-[#1A1814] to-[#C9A84C]/30 border-[3px] border-[#C9A84C] shadow-[0_0_60px_rgba(201,168,76,0.8)] scale-110 z-50 ring-4 ring-[#C9A84C]/50 ring-offset-4 ring-offset-[#0A0908]"
                      : "bg-gradient-to-br from-[#1A1814] to-[#0A0908] border border-[var(--color-border-gold)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-[var(--color-gold-main)]/50 hover:shadow-[0_0_30px_rgba(201,168,76,0.1)]"
                  }
                `}
              >
                {/* Ping effect when highlighted */}
                {cat.id === "business" && isShopHighlighted && (
                  <>
                    <div className="absolute inset-0 rounded-full border-[2px] border-[#C9A84C] animate-[ping_2s_ease-in-out_infinite] opacity-100"></div>
                    <motion.div
                      className="absolute -top-14 flex flex-col items-center pointer-events-none"
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: [0, 8, 0], opacity: 1 }}
                      transition={{
                        y: {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                        opacity: { duration: 0.3 },
                      }}
                    >
                      <div className="bg-[#C9A84C] text-black font-black text-[9px] uppercase tracking-wider px-2 py-1 rounded-full shadow-[0_0_20px_rgba(201,168,76,0.6)] whitespace-nowrap">
                        Clique ici
                      </div>
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#C9A84C] mt-0.5"></div>
                    </motion.div>
                  </>
                )}
                <div className="absolute inset-0 rounded-full bg-[var(--color-gold-main)]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="shrink-0">{cat.emoji}</span>
                {cat.badge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-[var(--color-gold-main)] text-black text-[6px] md:text-[7px] font-black rounded-full shadow-lg border border-black/10">
                    {cat.badge}
                  </span>
                )}
              </button>
              <div className="text-center space-y-0.5">
                <span className="text-[9px] xs:text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[var(--color-text-main)] drop-shadow-sm whitespace-nowrap">
                  {cat.title.split(' ')[0]}
                </span>
                <p className="text-[6px] xs:text-[7px] md:text-[8px] font-bold text-[var(--color-text-gray)] opacity-40 uppercase tracking-tighter truncate max-w-[60px] xs:max-w-[70px] md:max-w-none mx-auto">
                  {cat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 5. NOTIFICATION SYSTEM (RETRAITS EN TEMPS RÉEL) */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]"></span>
            <h3 className="text-[12px] font-black uppercase text-white tracking-[0.2em]">
              Retraits en temps réel
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
              <span className="text-[7px] font-bold text-[var(--color-text-gray)] uppercase tracking-widest">
                Connecté
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-transparent via-purple-500/5 to-transparent py-1 text-center mb-4">
          <p className="text-[8px] font-bold text-purple-400/60 uppercase tracking-[0.2em]">
            Les utilisateurs qui génèrent le plus de revenus sont des membres
            PREMIUM.
          </p>
        </div>

        <button
          onClick={() => onSwitchTab('live_withdrawals')}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <FileText className="text-emerald-400" size={20} />
             </div>
             <div className="text-left">
                <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Consulter le registre public</p>
                <p className="text-[10px] text-neutral-400">Voir les retraits validés en temps réel</p>
             </div>
          </div>
          <ChevronRight className="text-neutral-500 group-hover:text-emerald-400 transition-colors" size={20} />
        </button>
      </div>
    </div>
  );
};

const PillarCard = ({ title, desc, icon: Icon, color, onClick }: any) => {
  const isGold = color === "gold";
  const isPurple = color === "purple";
  return (
    <button
      onClick={onClick}
      className="group relative h-64 md:h-[400px] w-full rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#0a0a08] transition-all hover:scale-[1.01] active:scale-98 duration-500 shadow-xl"
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${isGold ? "bg-[var(--color-gold-main)]" : isPurple ? "bg-[var(--color-academy-purple)]" : "bg-emerald-600"}`}
      ></div>
      <div className="absolute top-0 right-0 p-8 opacity-[0.01] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
        <Icon
          size={240}
          className={
            isGold
              ? "text-[var(--color-gold-main)]"
              : isPurple
                ? "text-[var(--color-academy-purple)]"
                : "text-emerald-600"
          }
        />
      </div>
      <div className="relative h-full p-8 flex flex-col justify-between items-start text-left z-10">
        <div
          className={`p-4 rounded-2xl border transition-all duration-500 ${isGold ? "bg-[var(--color-gold-main)]/10 border-[var(--color-gold-main)]/20 text-[var(--color-gold-main)] group-hover:bg-[var(--color-gold-main)] group-hover:text-black" : isPurple ? "bg-[var(--color-academy-purple)]/10 border-[var(--color-academy-purple)]/20 text-purple-400 group-hover:bg-[var(--color-academy-purple)] group-hover:text-white" : "bg-emerald-600/10 border-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white"}`}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white italic group-hover:translate-x-1 transition-transform duration-500">
              {title}
            </h3>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#6B6050] mt-1 leading-relaxed max-w-[160px] opacity-80">
              {desc}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 ${isGold ? "text-[var(--color-gold-main)]" : isPurple ? "text-purple-400" : "text-emerald-400"}`}
          >
            Ouvrir <ArrowRight size={10} />
          </div>
        </div>
      </div>
    </button>
  );
};

const SubServiceCard = ({ title, desc, icon: Icon, onClick, locked }: any) => (
  <button
    onClick={onClick}
    className="group relative w-full p-5 rounded-2xl bg-[#0d0d0c] border border-[var(--color-border-gold)] transition-all hover:border-[var(--color-gold-main)]/20 active:scale-98 flex items-center justify-between shadow-lg"
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-white/5 rounded-xl text-[#6B6050] group-hover:text-[var(--color-gold-main)] group-hover:bg-[var(--color-gold-main)]/10 transition-all border border-transparent group-hover:border-[var(--color-gold-main)]/10">
        <Icon size={20} />
      </div>
      <div className="text-left">
        <h4 className="text-xs font-black uppercase text-white tracking-tight group-hover:text-[var(--color-gold-main)] transition-colors">
          {title}
        </h4>
        <p className="text-[8px] font-bold text-[#6B6050] uppercase mt-0.5 tracking-wider opacity-70">
          {desc}
        </p>
      </div>
    </div>
    {locked ? (
      <div className="p-1.5 bg-black/40 rounded-lg text-[#6B6050] border border-white/5 opacity-50">
        <Lock size={12} />
      </div>
    ) : (
      <div className="p-1.5 text-[#6B6050]/40 group-hover:text-[var(--color-gold-main)] group-hover:translate-x-1 transition-all">
        <ChevronRight size={16} />
      </div>
    )}
  </button>
);

export const EvolutionTab: React.FC<{ profile: UserProfile | null; onBack: () => void }> = ({ profile, onBack }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="pb-24"
  >
    <div className="flex items-center gap-4 mb-8 px-2">
      <button 
        onClick={onBack}
        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"
      >
        <ArrowLeft size={20} />
      </button>
      <div>
        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Fil d'Évolutions</h2>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Le succès de la communauté en direct</p>
      </div>
    </div>
    
    <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl">
      <EvolutionFeed profile={profile} />
    </div>
  </motion.div>
);

export const ProfileTab: React.FC<any> = ({
  profile,
  onLogout,
  isAdmin,
  onSwitchTab,
  onRefresh,
  onStartAxisGuide,
}) => {
  const isMzPlus = profile?.user_level === "niveau_mz_plus";
  const challengeState = profile?.store_preferences?.challenge_3j || {};
  // Considere the challenge active if it has been presented, not cancelled, and not completely finished
  const isChallengeActive =
    challengeState.presented &&
    !challengeState.cancelled &&
    !challengeState.j3Completed;

  const isAnyDayCompleted = challengeState.j1Completed || challengeState.j2Completed || challengeState.j1_completed || challengeState.j2_completed;
  const lastCompletedDay = (challengeState.j2Completed || challengeState.j2_completed) ? 2 : (challengeState.j1Completed || challengeState.j1_completed) ? 1 : 0;
  
  const [isAlreadyShared, setIsAlreadyShared] = useState(false);
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  useEffect(() => {
    if (!profile?.id || !lastCompletedDay) return;
    checkIfAchievementShared(profile.id, `Défi J${lastCompletedDay}`)
      .then(shared => setIsAlreadyShared(shared));
  }, [profile?.id, lastCompletedDay]);

  const handleShare = async () => {
    if (!profile || !lastCompletedDay) return;
    const message = getRandomMessage('challenge', { day: lastCompletedDay });
    
    setShareModal({ isOpen: true, message });
  };

  const handleExecuteShare = async () => {
    if (!profile || !lastCompletedDay || !shareModal.message) return;
    
    await shareEvolution({
      user_id: profile.id,
      user_name: profile.full_name || profile.username,
      user_avatar: profile.avatar_url,
      type: 'achievement_unlocked',
      new_level: `Défi J${lastCompletedDay}`,
      message: shareModal.message
    });

    setIsAlreadyShared(true);
    setShareModal(prev => ({ ...prev, isOpen: false }));
    const whatsappLink = generateWhatsAppLink(shareModal.message);
    window.open(whatsappLink, '_blank');
  };

  const handleCancelChallenge = async () => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir abandonner le défi des 3 Jours ? Cette action est définitive.",
      )
    )
      return;
    const newPrefs = { ...(profile.store_preferences || {}) };
    if (!newPrefs.challenge_3j) newPrefs.challenge_3j = {};
    newPrefs.challenge_3j.cancelled = true;
    
    // Update both tables to keep states perfectly synchronized
    await supabase
      .from("users")
      .update({ store_preferences: newPrefs })
      .eq("id", profile.id);

    await supabase
      .from("mz_challenge_3j_state")
      .update({ cancelled: true })
      .eq("user_id", profile.id);

    if (onRefresh) onRefresh();
    window.location.reload();
  };

  const userLevel = getCurrentLevel(profile?.xp || 0);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24 pt-10 px-5 animate-fade-in font-sans">
      <SectionTitle
        title="Mon Espace Élite"
        subtitle="Gérez votre identité et vos paramètres de compte."
      />

      {/* Admin Panel Quick Access */}
      {isAdmin && (
        <button
          onClick={() => onSwitchTab("admin")}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all border-dashed"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500">
            <Lock size={20} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
              Accès Prioritaire
            </p>
            <h4 className="text-sm font-black text-white uppercase tracking-tighter">
              Panel Administration
            </h4>
          </div>
          <ChevronRight size={18} className="ml-auto text-amber-500" />
        </button>
      )}

      {/* Main Glassmorphism Identity Card */}
      <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0d0d0c]/80 backdrop-blur-xl p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold-main)]/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col items-center text-center gap-6">
          {/* Avatar Area */}
          <div className="relative">
            {(() => {
              const ProfileIcon = userLevel.icon;
              return (
                <div
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1A1814] to-[#0A0908] border-2 flex items-center justify-center shadow-2xl relative z-10"
                  style={{
                    borderColor: `${userLevel.hex}50`,
                    boxShadow: `0 0 35px ${userLevel.hex}30`,
                  }}
                >
                  <ProfileIcon
                    size={40}
                    color={userLevel.hex}
                    style={{
                      filter: `drop-shadow(0 0 10px ${userLevel.hex}80)`,
                    }}
                  />
                </div>
              );
            })()}
            {isMzPlus && (
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 z-20">
                <Crown size={14} fill="currentColor" />
              </div>
            )}
          </div>

          {/* User Names & Level Badges */}
          <div className="space-y-3">
            <h3 className="text-2xl font-black uppercase tracking-tight text-white italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {profile?.full_name || "Utilisateur Élite"}
            </h3>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div
                className="px-3 py-1 flex items-center gap-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
                style={{
                  borderColor: `${userLevel.hex}40`,
                  color: userLevel.hex,
                  backgroundColor: `${userLevel.hex}15`,
                }}
              >
                <userLevel.icon size={11} strokeWidth={3} />
                {userLevel.name}
              </div>
              
              <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-neutral-400 select-all tracking-wider">
                {profile?.email}
              </span>
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/5 my-2"></div>

          {/* New Structured Details Grid */}
          <div className="w-full text-left">
            {/* Inscription Display */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-1">
                  Membre Depuis
                </p>
                <h5 className="font-black uppercase tracking-wider text-[11px] text-white">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "---"}
                </h5>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 w-full gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-[#141412] border border-white/5 text-center">
              <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1 leading-none">
                Cumul des Points
              </p>
              <p className="text-base font-black text-[var(--color-gold-main)] uppercase tracking-tight">
                {profile?.xp || 0} XP
              </p>
            </div>
            
            <div className="p-4 rounded-2xl bg-[#141412] border border-white/5 text-center flex flex-col justify-center">
              <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1 leading-none font-sans">
                Statut Élite
              </p>
              <p className={`text-xs font-black uppercase tracking-widest ${isMzPlus ? 'text-purple-400' : 'text-neutral-400'}`}>
                {isMzPlus ? 'Premium' : 'Standard'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New Dedicated Axis Companion Direct Access Section */}
      <div className="relative group overflow-hidden rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-6 shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Eye size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1.5 font-sans">Assistant de réussite</div>
              <h4 className="text-sm font-black text-white uppercase tracking-tighter leading-none mb-1">
                L'oeil Intelligent d'Axis
              </h4>
              <p className="text-[11px] text-neutral-400 font-medium max-w-sm">
                Besoin d'aide pour importer tes produits, configurer ta boutique ou lancer tes ventes ? Clique ici !
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              if (onStartAxisGuide) {
                onStartAxisGuide();
              } else {
                // fallback
                localStorage.removeItem('mz_axis_welcomed');
                sessionStorage.setItem('mz_axis_guide_active', 'true');
                onSwitchTab('dashboard');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('mz-force-welcome-guide'));
                }, 300);
              }
            }}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-amber-500 text-black hover:bg-amber-400 active:scale-95 transition-all text-xs font-black uppercase tracking-widest whitespace-nowrap shadow-lg shadow-amber-500/10 text-center"
          >
            Lancer Axis
          </button>
        </div>
      </div>

      {/* Evolution Trigger Icon - Improved Placement & Responsiveness */}
      <div className="px-1">
         <motion.button
           whileHover={{ scale: 1.01 }}
           whileTap={{ scale: 0.99 }}
           onClick={() => onSwitchTab('evolution')}
           className="w-full relative group p-5 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/5 flex items-center justify-between shadow-2xl hover:border-purple-500/40 transition-all duration-300"
         >
           <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]"></div>
           
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:rotate-6 transition-transform shrink-0">
               <TrendingIcon size={22} />
             </div>
             <div className="text-left">
               <div className="text-xs font-black text-white uppercase tracking-tighter italic leading-none mb-1.5">Fil d'Évolutions Élite</div>
               <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Découvrez le succès en direct de vos pairs</div>
             </div>
           </div>

           <div className="flex items-center gap-3">
             <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75"></div>
             </div>
             <ChevronRight size={18} className="text-neutral-600 group-hover:text-white transition-colors" />
           </div>
         </motion.button>
      </div>

      {/* Progression Section (Umtampered Progression Tube) */}
      <div className="space-y-3 px-1 border-t border-white/5 pt-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase text-neutral-500 tracking-[0.2em]">Votre progression élite</span>
          <span className="text-[10px] font-bold text-[var(--color-gold-main)] uppercase tracking-widest">{profile?.xp || 0} XP TOTAUX</span>
        </div>
        <LiquidProgressionTube currentXp={profile?.xp || 0} />
      </div>

      <div className="flex flex-col items-center mt-6">
        <button
          onClick={() => onSwitchTab("flash_offer")}
          className="group relative flex items-center justify-center gap-3 w-full max-w-sm py-4 px-6 rounded-2xl bg-[#0a0a09] border border-[var(--color-border-gold)] hover:border-[var(--color-gold-main)]/50 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-gold-main)]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <Crown
            size={18}
            className="text-[var(--color-gold-main)] transition-transform group-hover:scale-110"
          />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-main)]">
            Passer au niveau supérieur
          </span>
        </button>
      </div>

      {/* Icon Grid Actions - Beautiful Bento Column Layout */}
      <div className="grid grid-cols-4 gap-2.5 mt-4 px-1">
        <button
          onClick={() => onSwitchTab("leaderboard")}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0e0e0d] border border-white/5 hover:border-yellow-500/25 hover:bg-yellow-500/[0.02] transition-all duration-300 group active:scale-95"
        >
          <div className="w-11 h-11 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-yellow-500/20 transition-all duration-300 shadow-md">
            <Trophy size={18} className="text-yellow-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight text-neutral-200">
            Mondial
          </span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-yellow-500/70 mt-0.5">
            Rang
          </span>
        </button>

        <button
          onClick={() => onSwitchTab("leaderboard_local")}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0e0e0d] border border-white/5 hover:border-purple-500/25 hover:bg-purple-500/[0.02] transition-all duration-300 group active:scale-95"
        >
          <div className="w-11 h-11 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300 shadow-md">
            <MapPin size={18} className="text-purple-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight text-neutral-200">
            Local
          </span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-purple-400/70 mt-0.5">
            Territoire
          </span>
        </button>

        <button
          onClick={() => {
            onSwitchTab("weekly_challenge");
            localStorage.setItem('mz_weekly_challenge_seen', 'true');
          }}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0e0e0d] border border-white/5 hover:border-blue-500/25 hover:bg-blue-500/[0.02] transition-all duration-300 group relative active:scale-95"
        >
          {localStorage.getItem('mz_weekly_challenge_seen') !== 'true' && (
            <div className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
          )}
          <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300 shadow-md">
            <Target size={18} className="text-blue-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight text-neutral-200">
            Défi
          </span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-blue-400/70 mt-0.5">
            Hebdo
          </span>
        </button>

        <UserRewardsSection profile={profile} />
      </div>

      {isChallengeActive && (
        <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-red-500/5 to-red-900/5 border border-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-red-500/10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-red-400 tracking-widest">
              Défi Actif
            </span>
            <span className="text-xs font-bold text-neutral-400">
              Ta première vente en 3 Jours
            </span>
          </div>
          <div className="flex gap-2">
            {isAnyDayCompleted && !isAlreadyShared && (
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase rounded-xl transition-colors border border-emerald-500/20 whitespace-nowrap flex items-center gap-2"
              >
                <ShareIcon size={12} />
                Partager
              </button>
            )}
            <button
              onClick={handleCancelChallenge}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-xl transition-colors border border-red-500/20 whitespace-nowrap"
            >
              Renoncer au défi
            </button>
          </div>
        </div>
      )}

      {/* Logout Row */}
      <div className="pt-8 border-t border-white/5 space-y-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-red-500/20 active:scale-95 shadow-lg shadow-red-500/5 group"
        >
          <LogOut
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Déconnexion Sécurisée
        </button>
        <p className="text-center text-[8px] text-neutral-600 font-bold uppercase tracking-[0.3em] mt-6 opacity-30">
          Millionaire Zone Plus v7.4.2 • Elite Secure Logout
        </p>
      </div>

      <AnimatePresence>
        {shareModal.isOpen && (
          <WhatsAppShareModal 
            isOpen={shareModal.isOpen}
            onClose={() => setShareModal(prev => ({ ...prev, isOpen: false }))}
            onShare={handleExecuteShare}
            title="Impacte la Communauté"
            description="Le succès se partage ! Clique pour inspirer les autres membres sur WhatsApp."
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export const RevenueTab: React.FC<any> = ({ profile, wallet, onRefresh }) => {
  return (
    <WithdrawalSystem profile={profile} wallet={wallet} onRefresh={onRefresh} />
  );
};

export const TeamTab: React.FC<any> = ({ profile, teamCount }) => (
  <ReferralDashboard profile={profile} teamCount={teamCount} />
);

export const RPADashboard: React.FC<any> = ({
  profile,
  onRefresh,
  onSwitchTab,
}) => (
  <RpaDashboard
    profile={profile}
    onRefresh={onRefresh}
    onSwitchTab={onSwitchTab}
  />
);

export const CoachingTab: React.FC<any> = ({ profile, onSwitchTab }) => (
  <CoachingDashboard profile={profile} onSwitchTab={onSwitchTab} />
);

export const FormationTab: React.FC<any> = ({ profile, onSwitchTab }) => (
  <AcademieMain profile={profile} onSwitchTab={onSwitchTab} />
);

export const CommunityTab: React.FC<{ profile: UserProfile | null }> = ({ profile }) => (
  <div className="max-w-2xl mx-auto pb-24 pt-10 px-5">
    <EvolutionFeed profile={profile} />
  </div>
);

export const SuggestionsTab: React.FC<{ profile: UserProfile | null }> = ({
  profile,
}) => {
  const [suggestion, setSuggestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await supabase
        .from("user_suggestions")
        .insert([{ user_id: profile?.id, suggestion, type: "suggestion" }]);
      setSuggestion("");
      alert("Merci pour votre idée !");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSending(false);
    }
  };
  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-fade-in pb-20 pt-10">
      <SectionTitle
        title="Suggestions"
        subtitle="Aidez-nous à améliorer MZ+."
      />
      <GoldBorderCard className="p-10 bg-black/40 border-white/5">
        <form onSubmit={handleSubmit} className="space-y-8">
          <textarea
            required
            rows={5}
            placeholder="Votre idée..."
            className="w-full bg-black border border-white/10 rounded-xl p-6 text-sm text-white resize-none"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
          />
          <PrimaryButton fullWidth isLoading={isSending} type="submit">
            Envoyer mon message
          </PrimaryButton>
        </form>
      </GoldBorderCard>
    </div>
  );
};

export const UpgradeTab: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in pt-20">
    <div className="w-20 h-20 bg-yellow-600/10 rounded-[2rem] flex items-center justify-center mb-8 border border-yellow-600/20 shadow-2xl">
      <Crown className="text-yellow-600 animate-pulse" size={32} />
    </div>
    <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white leading-tight max-w-2xl">
      L'accès <GoldText>MZ+ Premium</GoldText> est maintenant{" "}
      <GoldText>OUVERT</GoldText>. <br /> Profitez de l'offre flash pour
      débloquer tout le système.
    </h3>
    <div className="mt-12 p-8 border border-dashed border-white/5 rounded-[3rem] opacity-30">
      <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-[0.5em] leading-relaxed">
        Propulsé par Millionaire Zone Plus Neural Network v6.5
      </p>
    </div>
  </div>
);

export const GuidesTab: React.FC<any> = ({
  onStartAffiliationGuide,
  onStartRPAGuide,
  onStartTeamGuide,
  onStartAxisGuide,
}) => (
  <GuidesTabComponent
    onStartAffiliationGuide={onStartAffiliationGuide}
    onStartRPAGuide={onStartRPAGuide}
    onStartTeamGuide={onStartTeamGuide}
    onStartAxisGuide={onStartAxisGuide}
  />
);
