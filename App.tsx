
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, X, AlertTriangle, Crown, Rocket, Bell } from 'lucide-react';
import { supabase } from './services/supabase.ts';
import { UserProfile, Wallet, TabId, Product } from './types.ts';
import { LandingPage } from './components/LandingPage.tsx';
import { DashboardLayout } from './components/DashboardLayout.tsx';
import { 
  GlobalView, 
  RevenueTab, 
  CommunityTab,
  TeamTab, 
  RPADashboard, 
  CoachingTab, 
  FormationTab, 
  UpgradeTab, 
  SuggestionsTab, 
  GuidesTab, 
  ProfileTab,
  EvolutionTab
} from './components/DashboardTabs.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { RankRewardChecker } from './components/features/rank-rewards/RankRewardChecker.tsx';
import { MyStore } from './components/features/my-store/MyStore.tsx';
import { StandalonePublicStore } from './components/features/my-store/StandalonePublicStore.tsx';
import { RewardFeature } from './components/features/programme-recompense/RewardFeature.tsx';
import { PWAInstallBanner } from './components/ui/PWAInstallBanner.tsx';
import { ProductSalesPage } from './components/ProductSalesPage.tsx';
import { EspacePrive } from './components/EspacePrive.tsx';
import { MZPlusFlashOfferOverlay } from './components/features/mz-plus-offer/MZPlusFlashOfferOverlay.tsx';
import { LiveWithdrawalsView } from './components/features/withdrawals/LiveWithdrawalsView.tsx';
import { LeaderboardTab } from './components/features/leaderboard/LeaderboardTab.tsx';
import { LunaChatPage } from './components/LunaChatPage.tsx';
import { SQLConsole } from './components/SQLConsole.tsx';
import { PrivateMessagingMain } from './components/features/messagerie-privee/PrivateMessagingMain.tsx';
import { PushDisplay } from './components/features/admin-push-notifications/PushDisplay.tsx';
import { AnnouncementOverlay } from './components/features/marketing-announcements/AnnouncementOverlay.tsx';
import { AffiliationGuide } from './components/guides/AffiliationGuide.tsx';
import { RPAGuide } from './components/guides/RPAGuide.tsx';
import { PremiumAccessGate } from './components/premium-access/PremiumAccessGate.tsx';
import { requestNotificationPermission, onMessageListener } from './services/firebase.ts';
import { useAxis } from './components/features/axis/AxisProvider.tsx';
import { AxisGuideFlow } from './components/features/axis/AxisGuideFlow.tsx';
import { AxisChat } from './components/features/axis/AxisChat.tsx';
import { XPRewardModal } from './components/features/gamification/XPRewardModal.tsx';
import { ShareModal } from './components/features/gamification/ShareModal.tsx';
import { ChallengePresentation } from './components/features/challenges/ChallengePresentation.tsx';
import { WeeklyChallenge } from './components/features/challenges/WeeklyChallenge.tsx';
import { rewardUserXP } from './services/gamification.ts';
import { PROGRESSION_LEVELS } from './components/features/progression/LiquidProgressionTube.tsx';
import { LevelUpCelebration } from './components/features/community/LevelUpCelebration.tsx';
import { EvolutionShareModal } from './components/features/community/EvolutionShareModal.tsx';
import { PremiumTriggerEngine } from './services/premiumTriggerService.ts';
import { PremiumOfferPopup } from './components/features/premium/PremiumOfferPopup.tsx';

import { BonusHub } from './components/features/bonus/BonusHub.tsx';
import { BonusContentReader } from './components/features/bonus/BonusContentReader.tsx';
import { getBonusContent } from './components/features/formation/bonusContentData.ts';
import { AdminSecurityWall } from './components/AdminSecurityWall.tsx';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const profileRef = useRef<UserProfile | null>(null);
  useEffect(() => {
    profileRef.current = userProfile;
  }, [userProfile]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProductChecked, setIsProductChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    if (activeTab === 'admin') {
      setIsAdminView(true);
      setActiveTab('dashboard');
    }
  }, [activeTab]);

  const [activeCategory, setActiveCategory] = useState<string>('main');
  const [lastUpdateSignal, setLastUpdateSignal] = useState<number>(Date.now());
  const [customerProduct, setCustomerProduct] = useState<Product | null>(null);
  const [storeOwnerCode, setStoreOwnerCode] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<'view' | 'processing' | 'success'>('view');
  const [isGuideActive, setIsGuideActive] = useState(false);
  const [isRPAGuideActive, setIsRPAGuideActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{ title: string; body: string; type?: 'info' | 'error' | 'warning' } | null>(null);
  const [initSequence, setInitSequence] = useState(true);
  const [showXpReward, setShowXpReward] = useState(false);
  const [xpRewardAmount, setXpRewardAmount] = useState(0);
  const [xpRewardTitle, setXpRewardTitle] = useState("");
  const [xpRewardDesc, setXpRewardDesc] = useState("");
  const [xpRewardSource, setXpRewardSource] = useState("");
  const [rankUpData, setRankUpData] = useState<{ rankId: number; rankName: string; oldXp: number; newXp: number } | null>(null);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showEvolutionShare, setShowEvolutionShare] = useState(false);
  const [evolutionShareType, setEvolutionShareType] = useState<'formation_completed' | 'achievement_unlocked' | 'generic' | 'sale_validated'>('generic');
  const [evolutionShareData, setEvolutionShareData] = useState<any>(null);
  const [, setFcmToken] = useState<string | null>(null);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  
  // Premium Trigger States
  const [premiumTrigger, setPremiumTrigger] = useState<{ type: 'popup' | 'axis', message: string, priority?: number, cta?: string } | null>(null);
  const [lastClickCount, setLastClickCount] = useState<number | null>(null);
  
  // Défis "3 Jours" Trigger States

  const [showChallenge, setShowChallenge] = useState(false);
  const [showChallengeDay2, setShowChallengeDay2] = useState(false);
  const [showChallengeDay3, setShowChallengeDay3] = useState(false);
  const [showChallengeDay2Fail, setShowChallengeDay2Fail] = useState(false);
  const [pendingDay3TriggerAfterPremium, setPendingDay3TriggerAfterPremium] = useState(false);
  const [forceDay3FailText, setForceDay3FailText] = useState(false);
  const [challengeEligible, setChallengeEligible] = useState(false);
  const [challengeTriggered, setChallengeTriggered] = useState(false);
  const [showChallengeCelebration, setShowChallengeCelebration] = useState(false);
  const [challengeCelebratedStep, setChallengeCelebratedStep] = useState(1);
  const [showDay2UpsellPopup, setShowDay2UpsellPopup] = useState(false);
  const [showDay2FailedUpsellPopup, setShowDay2FailedUpsellPopup] = useState(false);
  const [bonusContent, setBonusContent] = useState<{ id: string; title: string; content: string; previewUrl?: string } | null>(null);
  
  const { triggerAxisMessage, hideAxis, setIsChatOpen, setChatUnlocked } = useAxis();

  // Premium Trigger Engine Integration
  const runPremiumTrigger = useCallback(async (scenario: 'mission_complete' | 'click_spike' | 'fallback') => {
    if (!userProfile?.id || userProfile.user_level === 'niveau_mz_plus') return;
    
    // Délai de 30 secondes pour le succès de mission (moins brusque)
    if (scenario === 'mission_complete') {
      await new Promise(resolve => setTimeout(resolve, 30000));
    }

    const result = await PremiumTriggerEngine.trigger(userProfile.id, scenario);
    if (result) {
      if (result.type === 'popup') {
        setPremiumTrigger({ type: 'popup', message: result.message, priority: result.priority, cta: result.cta });
      } else {
        triggerAxisMessage(result.message, 'progression', 15000, {
          label: result.cta || "S'abonner",
          action: () => setActiveTab('flash_offer')
        }, 'smart');
      }
    }
  }, [userProfile, triggerAxisMessage, setActiveTab]);

  // Handle Fallback Trigger (5 mins active)
  useEffect(() => {
    if (!userProfile || userProfile.user_level === 'niveau_mz_plus') return;

    // Last Active tracking with a 3-minute throttle to protect database performance
    let lastReported = 0;
    const updateActivity = () => {
      const now = Date.now();
      if (userProfile?.id && now - lastReported > 180000) {
        lastReported = now;
        PremiumTriggerEngine.reportActivity(userProfile.id);
      }
    };
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // Initial check for absence > 6h
    if (userProfile?.last_active_at) {
      const lastSession = new Date(userProfile.last_active_at).getTime();
      const diff = Date.now() - lastSession;
      const sixHours = 6 * 60 * 60 * 1000;
      if (diff > sixHours && !localStorage.getItem('mz_premium_away_pushed')) {
        PremiumTriggerEngine.registerPushTrigger(userProfile.id, 'fallback');
        localStorage.setItem('mz_premium_away_pushed', 'true');
      }
    }

    
    const startTime = parseInt(localStorage.getItem('mz_active_session_start') || Date.now().toString());
    if (!localStorage.getItem('mz_active_session_start')) {
      localStorage.setItem('mz_active_session_start', startTime.toString());
    }

    const checkFallback = () => {
      const elapsed = Date.now() - startTime;
      const fiveMins = 5 * 60 * 1000;
      if (elapsed >= fiveMins && !localStorage.getItem('mz_premium_fallback_triggered')) {
        runPremiumTrigger('fallback');
        localStorage.setItem('mz_premium_fallback_triggered', 'true');
      }
    };

    const interval = setInterval(checkFallback, 60000);
    return () => clearInterval(interval);
  }, [userProfile, runPremiumTrigger]);

  // Handle Click Spike Trigger
  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    const checkClicks = async () => {
      const profile = profileRef.current;
      if (!profile || profile.user_level === 'niveau_mz_plus') return;

      const { data } = await supabase.from('product_stats').select('clicks').eq('user_id', profile.id);
      const totalClicks = data?.reduce((acc: number, curr: any) => acc + curr.clicks, 0) || 0;
      
      const prefs = profile.store_preferences || {};
      const clickSpike = prefs.click_spike || {};

      const timesTriggered = parseInt(clickSpike.times_triggered || '0', 10);
      const hasTriggeredFirstTime = clickSpike.triggered === true || timesTriggered >= 1;

      let shouldTrigger = false;
      let nextClickSpike = { ...clickSpike };

      if (!hasTriggeredFirstTime) {
        // First execution threshold: 10 clicks
        if (totalClicks >= 10) {
          shouldTrigger = true;
          nextClickSpike = {
            triggered: true,
            times_triggered: 1,
            baseline_clicks: totalClicks,
            history: [{ timestamp: Date.now(), clicks: 0 }]
          };
        }
      } else {
        // Second time and onwards: 15 clicks in 1 hour
        const baselineClicks = clickSpike.baseline_clicks !== undefined ? parseInt(clickSpike.baseline_clicks, 10) : totalClicks;
        let history = Array.isArray(clickSpike.history) ? [...clickSpike.history] : [];

        if (totalClicks > baselineClicks) {
          const clicksDiff = totalClicks - baselineClicks;
          history.push({ timestamp: Date.now(), clicks: clicksDiff });
          nextClickSpike.baseline_clicks = totalClicks;
        } else if (totalClicks < baselineClicks) {
          nextClickSpike.baseline_clicks = totalClicks;
        }

        // Clean up items older than 1 hour (3600000 ms)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        history = history.filter((item: any) => item.timestamp >= oneHourAgo);
        nextClickSpike.history = history;

        const clicksInLastHour = history.reduce((sum: number, item: any) => sum + item.clicks, 0);

        if (clicksInLastHour >= 15) {
          shouldTrigger = true;
          const nextTimes = timesTriggered > 0 ? timesTriggered + 1 : 2;
          nextClickSpike.times_triggered = nextTimes;
          nextClickSpike.history = []; // Clear history to avoid re-triggering consecutively
        }
      }

      // Check if state changed
      const hasStateChanged = JSON.stringify(clickSpike) !== JSON.stringify(nextClickSpike);

      if (hasStateChanged) {
        const newPrefs = {
          ...prefs,
          click_spike: nextClickSpike
        };

        // Update state reactively
        setUserProfile((prev: any) => prev ? { ...prev, store_preferences: newPrefs } : prev);

        // Update DB
        await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', profile.id);
      }

      if (shouldTrigger) {
        runPremiumTrigger('click_spike');
      }
      setLastClickCount(totalClicks);
    };

    const interval = setInterval(checkClicks, 10 * 1000); // Check every 10 seconds for instant responsive dev and real production validation
    checkClicks();
    return () => clearInterval(interval);
  }, [activeTab, runPremiumTrigger]);

  const fetchUserData = useCallback(async (userId: string, email?: string, fullName?: string, retryCount = 0) => {
    try {
      const userEmail = email?.toLowerCase().trim() || "";
      
      let { data: profile } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      
      let challengeState = null;
      if (profile) {
          const { data: cState } = await supabase.from('mz_challenge_3j_state').select('*').eq('user_id', userId).maybeSingle();
          if (cState) {
              challengeState = {
                presented: cState.presented,
                startedAt: cState.started_at,
                j1Completed: cState.j1_completed,
                j2Presented: cState.j2_presented,
                j2StartedAt: cState.j2_started_at,
                j2Completed: cState.j2_completed,
                j2CompletedAtStr: cState.j2_completed_at,
                j3Presented: cState.j3_presented,
                j3StartedAt: cState.j3_started_at,
                j3Completed: cState.j3_completed,
                cancelled: cState.cancelled
              };
          }
      }

      if (!profile) {
        const newRefCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newProfileData = { 
          id: userId, 
          full_name: fullName || 'Ambassadeur', 
          email: userEmail, 
          referral_code: newRefCode, 
          rank_id: 1, 
          is_admin: false, 
          user_level: 'standard'
        };
        const { data: upsertedProfile } = await supabase.from('users').upsert(newProfileData, { onConflict: 'id' }).select('*').single();
        profile = upsertedProfile || (newProfileData as any);
      }

      let isAdminValue = profile?.is_admin === true;
      if (userEmail === 'google@gmail.com') {
        isAdminValue = true;
        if (profile && !profile.is_admin) {
          supabase.from('users').update({ is_admin: true }).eq('id', userId).then(({ error }) => {
            if (error) {
              console.warn("Database sync for admin failed or was blocked by trigger/RLS, which is normal. Admin state is forced in memory.", error);
            } else {
              console.log("Database successfully learned/scheduled that google@gmail.com is admin.");
            }
          });
        }
      }
      
      const enrichedProfile: UserProfile = { 
        id: profile?.id || userId, 
        full_name: profile?.full_name || fullName || 'Ambassadeur', 
        referral_code: profile?.referral_code || '---', 
        rank_id: profile?.rank_id || 1, 
        email: profile?.email || userEmail, 
        is_admin: isAdminValue, 
        admin_role: profile?.admin_role || null,
        rpa_balance: Number(profile?.rpa_balance || 0), 
        rpa_points: Number(profile?.rpa_points || 0), 
        xp: Number(profile?.xp || 0),
        user_level: (profile?.user_level as 'standard' | 'niveau_mz_plus') || 'standard', 
        created_at: profile?.created_at,
        last_active_at: profile?.last_active_at,
        last_premium_trigger_at: profile?.last_premium_trigger_at,
        premium_trigger_history: profile?.premium_trigger_history || [],
        store_preferences: { ...(profile?.store_preferences || {}) },
        country_code: profile?.country_code || profile?.country
      };

      // Calculate the correct rank_id from xp immediately.
      let currentLevelIdx = 0;
      for (let i = 0; i < PROGRESSION_LEVELS.length; i++) {
        if (enrichedProfile.xp >= PROGRESSION_LEVELS[i].xp) {
          currentLevelIdx = i;
        }
      }
      const computedRankId = currentLevelIdx + 1;
      enrichedProfile.rank_name = PROGRESSION_LEVELS[currentLevelIdx].name;

      if (computedRankId !== enrichedProfile.rank_id) {
        enrichedProfile.rank_id = computedRankId;
        try {
          // Fire and forget update
          supabase.from('users').update({ rank_id: computedRankId }).eq('id', enrichedProfile.id).then();
        } catch (e) {
          console.error("Error updating rank_id", e);
        }
      }

      if (challengeState) {
          enrichedProfile.store_preferences.challenge_3j = challengeState;
      }

      
      // Handle challenge commands from Admin
      if (enrichedProfile.store_preferences?.challenge_command) {
        const command = enrichedProfile.store_preferences.challenge_command;
        const newPrefs = { ...enrichedProfile.store_preferences };
        const challenge = newPrefs.challenge_3j || {};
        
        if (command === 'reset') {
            newPrefs.challenge_3j = {};
        } else if (command === 'complete') {
            newPrefs.challenge_3j = {
               ...challenge,
               presented: true,
               j1Completed: true,
               startedAt: challenge.startedAt || new Date().toISOString()
            };
        }
        
        delete newPrefs.challenge_command;
        
        try {
          await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', enrichedProfile.id);
          enrichedProfile.store_preferences = newPrefs;
        } catch (e) {
          console.error("Error clearing challenge command", e);
        }
      }

      setUserProfile(enrichedProfile);

      const [walletRes, teamRes] = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('referral_code_used', enrichedProfile.referral_code)
      ]);

      setWallet(walletRes.data || { id: 'initial', user_id: userId, balance: 0 });
      setTeamCount(teamRes?.count || 0);
    } catch (error: any) {
      if (error?.code === 'PGRST303' || error?.message?.includes('JWT expired')) {
        console.warn('JWT expired during fetchUserData, signing out...');
        supabase.auth.signOut();
        return;
      }
      console.error("Fetch data error:", error);
      if (retryCount < 2 && (error.message?.includes('fetch') || error.name === 'TypeError')) {
        console.log(`Retrying fetchUserData (${retryCount + 1})...`);
        setTimeout(() => fetchUserData(userId, email, fullName, retryCount + 1), 1500);
        return;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userProfile || userProfile.country_code || loading) return;

    const detectCountryCode = () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const tzMap: Record<string, string> = {
          'Africa/Abidjan': 'ci',
          'Africa/Dakar': 'sn',
          'Africa/Douala': 'cm',
          'Africa/Bamako': 'ml',
          'Africa/Ouagadougou': 'bf',
          'Africa/Lome': 'tg',
          'Africa/Porto-Novo': 'bj',
          'Africa/Niamey': 'ne',
          'Africa/Conakry': 'gn',
          'Africa/Libreville': 'ga',
          'Africa/Brazzaville': 'cg',
          'Africa/Kinshasa': 'cd',
          'Africa/Lubumbashi': 'cd',
          'Europe/Paris': 'fr',
          'Africa/Algiers': 'dz',
          'Africa/Casablanca': 'ma',
          'Africa/Tunis': 'tn',
          'Indian/Antananarivo': 'mg',
          'America/Toronto': 'ca',
          'America/Montreal': 'ca'
        };

        const detectedCode = tzMap[tz];
        if (detectedCode) {
          console.log(`[Geo] Intelligent detection: ${tz} -> ${detectedCode}`);
          supabase.from('users')
            .update({ country_code: detectedCode })
            .eq('id', userProfile.id)
            .then(({ error }) => {
              if (!error) {
                setUserProfile(prev => prev ? { ...prev, country_code: detectedCode } : prev);
              }
            });
        }
      } catch (e) {
        console.error("Error detecting country", e);
      }
    };

    detectCountryCode();
  }, [userProfile, loading]);

  const triggerRefresh = useCallback(() => { 
    setLastUpdateSignal(Date.now());
    if (session?.user?.id) {
      fetchUserData(session.user.id, session.user.email, session.user.user_metadata?.full_name); 
    }
  }, [session, fetchUserData]);

  useEffect(() => {
    if (!userProfile || loading) return;
    const chatIntroduced = localStorage.getItem('mz_axis_chat_introduced') === 'true';
    if (chatIntroduced) return;

    const checkUnlock = () => {
      const challengeState = userProfile.store_preferences?.challenge_3j || {};
      const day1Done = challengeState.j1Completed === true;
      
      const sessionStart = localStorage.getItem('mz_first_visit_time') || Date.now().toString();
      if (!localStorage.getItem('mz_first_visit_time')) {
        localStorage.setItem('mz_first_visit_time', sessionStart);
      }
      
      const fiveMinutesPassed = (Date.now() - parseInt(sessionStart)) > 5 * 60 * 1000;

      if (day1Done || fiveMinutesPassed) {
        setTimeout(() => {
          triggerAxisMessage(
            "Tu es maintenant un vrai Elite… 👁️\nTu peux désormais discuter avec moi en direct à tout moment. Je serai toujours là pour t'épauler dans ton ascension.",
            "success",
            15000,
            {
              label: "Essayer le chat",
              action: () => setIsChatOpen(true)
            }
          );
          localStorage.setItem('mz_axis_chat_introduced', 'true');
          setChatUnlocked(true);
        }, 2000);
        return true;
      }
      return false;
    };

    // Initial check
    if (checkUnlock()) return;

    // Background timer to check every 30 seconds
    const interval = setInterval(() => {
      if (checkUnlock()) {
        clearInterval(interval);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [userProfile, loading, triggerAxisMessage, setIsChatOpen, setChatUnlocked]);

  useEffect(() => {
    const handlePlaySound = async (e: Event) => {
      const customEvent = e as CustomEvent<{ sound: string }>;
      const soundCategory = customEvent.detail?.sound;
      if (!soundCategory) return;

      try {
        const { data, error } = await supabase
          .from('mz_sound_effects')
          .select('url')
          .eq('category', soundCategory)
          .single();
        
        if (error) {
          console.warn(`Could not find sound for category: ${soundCategory}`, error);
          return;
        }

        if (data?.url) {
          const audio = new Audio(data.url);
          audio.play().catch(err => console.warn("Audio play blocked", err));
        }
      } catch (err) {
        console.error("Sound play error:", err);
      }
    };
    window.addEventListener('mz-play-sound', handlePlaySound);
    return () => window.removeEventListener('mz-play-sound', handlePlaySound);
  }, []);

  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
        if (e.detail === 'axis') setIsChatOpen(true);
        else setIsChatOpen(false);
      }
    };
    window.addEventListener('switch-tab', handleSwitchTab);
    return () => window.removeEventListener('switch-tab', handleSwitchTab);
  }, [setIsChatOpen]);

  useEffect(() => {
    if (activeTab === 'dashboard' && pendingDay3TriggerAfterPremium) {
      setPendingDay3TriggerAfterPremium(false);
      updateChallengeDB({ j3Presented: true, j3StartedAt: new Date().toISOString() });
      setForceDay3FailText(true);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('mz-trigger-3j-day3'));
      }, 800);
    }
  }, [activeTab, pendingDay3TriggerAfterPremium]);

  // DB-Backed Challenge Update Helper
  const updateChallengeDB = useCallback(async (updates: Partial<NonNullable<UserProfile['store_preferences']>['challenge_3j']>) => {
    if (!userProfile?.id) return;
    const currentState = userProfile.store_preferences?.challenge_3j || {};
    const newState = { ...currentState, ...updates };
    const newPrefs = { ...(userProfile.store_preferences || {}), challenge_3j: newState };
    
    // Optimistic UI Update
    setUserProfile((prev) => prev ? { ...prev, store_preferences: newPrefs } : prev);
    // Push DB
    try {
      await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userProfile.id);
      
      const dbPayload = {
        user_id: userProfile.id,
        presented: newState.presented || false,
        started_at: newState.startedAt || null,
        j1_completed: newState.j1Completed || false,
        j2_presented: newState.j2Presented || false,
        j2_started_at: newState.j2StartedAt || null,
        j2_completed: newState.j2Completed || false,
        j2_completed_at: newState.j2CompletedAtStr || null,
        j3_presented: newState.j3Presented || false,
        j3_started_at: newState.j3StartedAt || null,
        j3_completed: newState.j3Completed || false,
        cancelled: newState.cancelled || false,
        updated_at: new Date().toISOString()
      };
      await supabase.from('mz_challenge_3j_state').upsert(dbPayload, { onConflict: 'user_id' });
    } catch (_err) {
      console.error(_err);
    }
  }, [userProfile?.id]);

  // Handle Challenge Progression / Completion (J1 & J2)
  useEffect(() => {
    if (!userProfile) return;

    const challengeState = userProfile.store_preferences?.challenge_3j || {};
    
    const checkDailyChallenge = () => {
      if (!challengeState.presented || challengeState.cancelled) return;

      // Check for Day 2 eligibility
      if (challengeState.startedAt && challengeState.j1Completed) {
        const startedAtDate = new Date(challengeState.startedAt);
        const currentDate = new Date();
        const startDayLocal = startedAtDate.getFullYear() + '-' + String(startedAtDate.getMonth() + 1).padStart(2, '0') + '-' + String(startedAtDate.getDate()).padStart(2, '0');
        const currentDayLocal = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');

        if (currentDayLocal > startDayLocal) {
          // Si J2 n'est pas encore commencé, on le propose (même si déjà "présenté" par notification background)
          if (!challengeState.j2StartedAt && !challengeState.j2Completed) {
            setShowChallengeDay2(true);
          }
        }
      }
      
      // Check for Day 2 Failure (Presented but not completed the next day)
      if (challengeState.j2StartedAt && !challengeState.j2Completed) {
        const j2StartedDate = new Date(challengeState.j2StartedAt);
        const currentDate = new Date();
        const j2StartLocal = j2StartedDate.getFullYear() + '-' + String(j2StartedDate.getMonth() + 1).padStart(2, '0') + '-' + String(j2StartedDate.getDate()).padStart(2, '0');
        const currentDayLocal = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');

        if (currentDayLocal > j2StartLocal) {
           if (!challengeState.j3Presented) {
               setTimeout(() => setShowChallengeDay2Fail(true), 1500);
           }
        }
      }

      if (challengeState.j2CompletedAtStr) {
        const j2CompDate = new Date(challengeState.j2CompletedAtStr);
        const currentDate = new Date();
        const j2CompLocal = j2CompDate.getFullYear() + '-' + String(j2CompDate.getMonth() + 1).padStart(2, '0') + '-' + String(j2CompDate.getDate()).padStart(2, '0');
        const currentDayLocal = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
        
        if (currentDayLocal > j2CompLocal) {
          // Si J3 n'est pas encore complété et pas encore présenté, on le propose (même si déjà notifié en background)
          if (!challengeState.j3Completed && !challengeState.j3Presented) {
              window.dispatchEvent(new CustomEvent('mz-trigger-3j-day3'));
          }
        }
      }
    };

    checkDailyChallenge();
    const interval = setInterval(checkDailyChallenge, 60000);
    return () => clearInterval(interval);
  }, [userProfile?.id, JSON.stringify(userProfile?.store_preferences?.challenge_3j), updateChallengeDB]); // Runs when userProfile (and nested challengeState) changes

  useEffect(() => {
    const handleProductAdded = () => {
      const challengeState = userProfile?.store_preferences?.challenge_3j || {};
      
      if (!challengeState.presented || challengeState.cancelled) return;
      
      const updates: any = {};
      
      // Register the start time if not present
      if (!challengeState.startedAt) {
         updates.startedAt = new Date().toISOString();
      }
      
      if (!challengeState.j1Completed) {
        updates.j1Completed = true;
        setChallengeCelebratedStep(1);
        
        // Premium Trigger on Mission Complete
        runPremiumTrigger('mission_complete');

        setTimeout(() => {
          setShowChallengeCelebration(true);
        }, 800);
      }
      
      if (Object.keys(updates).length > 0) {
        updateChallengeDB(updates);
      }
    };
    
    const handleNewSale = () => {
       const challengeState = userProfile?.store_preferences?.challenge_3j || {};
       if (challengeState.cancelled) return;
       const updates: any = {};
       
       if (challengeState.j2Presented && !challengeState.j2Completed) {
          updates.j2Completed = true;
          updates.j2CompletedAtStr = new Date().toISOString();
          setChallengeCelebratedStep(2);

          // Premium Trigger on Mission Complete
          runPremiumTrigger('mission_complete');

          // Reward XP for completing Day 2
          window.dispatchEvent(new CustomEvent('mz-xp-reward', {
            detail: { 
              amount: 50, 
              title: 'Jour 2 Validé !', 
              description: 'Incroyable ! Tu as réalisé ta première vente ! 💰',
              source: 'challenge_j2'
            }
          }));

          setTimeout(() => {
            setShowChallengeCelebration(true);
          }, 800);
       } else if (challengeState.j3Presented && !challengeState.j3Completed) {
          updates.j3Completed = true;
          setChallengeCelebratedStep(3);

          // Premium Trigger on Mission Complete
          runPremiumTrigger('mission_complete');

          // Reward XP for completing Day 3
          window.dispatchEvent(new CustomEvent('mz-xp-reward', {
            detail: { 
              amount: 100, 
              title: 'Défi 3 Jours Réussi ! 👑', 
              description: 'Tu es officiellement un entrepreneur aguerri de la MZ+ !',
              source: 'challenge_j3'
            }
          }));

          setTimeout(() => {
            setShowChallengeCelebration(true);
          }, 800);
       }
       
       if (Object.keys(updates).length > 0) {
          updateChallengeDB(updates);
       }
    };

    const handleDay2FormationRead = () => {
       if (userProfile?.user_level === 'niveau_mz_plus') return;
       if (localStorage.getItem('mz_premium_cta_clicked')) return;
       if (localStorage.getItem('mz_day2_premium_upsell_shown')) return;

       localStorage.setItem('mz_day2_premium_upsell_shown', 'true');
       
       setTimeout(() => {
          setShowDay2UpsellPopup(true);
       }, 500);
    };

    const handleResetChallenge = () => {
       if (!userProfile) return;
       const newPrefs = { ...(userProfile.store_preferences || {}), challenge_3j: {} };
       setUserProfile((prev: any) => prev ? { ...prev, store_preferences: newPrefs } : prev);
       supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userProfile.id).then();
    };

    const handleTestDay2Fail = () => {
      setShowChallengeDay2Fail(true);
    };

    window.addEventListener('mz-product-added-to-store', handleProductAdded);
    window.addEventListener('mz-new-sale', handleNewSale);
    window.addEventListener('mz-day2-formation-read', handleDay2FormationRead);
    window.addEventListener('mz-reset-challenge', handleResetChallenge);
    window.addEventListener('mz-test-day2-fail', handleTestDay2Fail);
    
    return () => {
       window.removeEventListener('mz-product-added-to-store', handleProductAdded);
       window.removeEventListener('mz-new-sale', handleNewSale);
       window.removeEventListener('mz-day2-formation-read', handleDay2FormationRead);
       window.removeEventListener('mz-reset-challenge', handleResetChallenge);
       window.removeEventListener('mz-test-day2-fail', handleTestDay2Fail);
    };
  }, [userProfile?.id, JSON.stringify(userProfile?.store_preferences?.challenge_3j), updateChallengeDB]); // Add dependency on identifiers so hooks get latest state!

  useEffect(() => {
    const handleFormationCompleted = (e: Event) => {
      const customEvent = e as CustomEvent<{formationId: string, type: string, newlyCompleted: boolean}>;
      const { formationId } = customEvent.detail;
      
      // We no longer auto-complete Day 1 just by reading the formation.
      // Day 1 requires choosing a product (handleProductAdded).
      if (formationId === 'default-free-text') {
        console.log("[Academy] Core formation read completed.");
      }
    };
    
    window.addEventListener('mz-formation-completed', handleFormationCompleted);
    return () => window.removeEventListener('mz-formation-completed', handleFormationCompleted);
  }, [userProfile, updateChallengeDB]);

  useEffect(() => {
    const handleEvolutionShare = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: any; data: any }>;
      setEvolutionShareType(customEvent.detail.type);
      setEvolutionShareData(customEvent.detail.data);
      setShowEvolutionShare(true);
    };
    window.addEventListener('mz-trigger-evolution-share', handleEvolutionShare);
    return () => window.removeEventListener('mz-trigger-evolution-share', handleEvolutionShare);
  }, []);

  useEffect(() => {
    const handleXpReward = async (e: Event) => {
      const customEvent = e as CustomEvent<{amount: number, title?: string, description?: string, source?: string}>;
      const { amount, title, description, source } = customEvent.detail;
      
      setXpRewardAmount(amount);
      if (title) setXpRewardTitle(title);
      if (description) setXpRewardDesc(description);
      if (source) setXpRewardSource(source);
      else setXpRewardSource("");
      setShowXpReward(true);
      
      if (session?.user?.id) {
        try {
          console.log(`[XP] Rewarding ${amount} XP to ${session.user.id} from source: ${source}`);
          const success = await rewardUserXP(session.user.id, amount);
          if (success) {
            triggerRefresh();
          } else {
            console.error(`[XP] Failed to reward XP from source: ${source}`);
          }
        } catch (xpErr) {
          console.error(`[XP] Exception in handleXpReward:`, xpErr);
        }
      }
    };
    
    window.addEventListener('mz-xp-reward', handleXpReward);
    return () => window.removeEventListener('mz-xp-reward', handleXpReward);
  }, [session, triggerRefresh]);

  useEffect(() => {
    const handleRankUp = (e: Event) => {
      const customEvent = e as CustomEvent<{ rankId: number; rankName: string; oldXp: number; newXp: number }>;
      setRankUpData(customEvent.detail);
    };
    window.addEventListener('mz-rank-up-detected', handleRankUp);
    return () => window.removeEventListener('mz-rank-up-detected', handleRankUp);
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setInitSequence(false);
      }, 1500); 
      return () => clearTimeout(timer);
    } else {
      // Sécurité: si le chargement dure trop longtemps (ex: bug réseau), on débloque après 5s
      const fallback = setTimeout(() => {
        setInitSequence(false);
      }, 5000);
      return () => clearTimeout(fallback);
    }
  }, [loading]);

  // Challenge Trigger Effect
  useEffect(() => {
    if (challengeEligible && !challengeTriggered) {
      let activeSeconds = 0;
      const isAdminTest = false; // Désactivé par sécurité
      const waitTarget = 15;
      
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          activeSeconds += 1;
          if (activeSeconds >= waitTarget) {
            clearInterval(interval);
            setChallengeTriggered(true);
            setShowChallenge(true);
            const prefs = userProfile?.store_preferences || {};
            const challenge = prefs.challenge_3j || {};
            if (!challenge.presented && userProfile) {
              const newPrefs = { ...prefs, challenge_3j: { ...challenge, presented: true } };
              setUserProfile((prev: any) => prev ? { ...prev, store_preferences: newPrefs } : prev);
              supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userProfile.id).then();
            }
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [challengeEligible, challengeTriggered, userProfile?.email]);

  useEffect(() => {
    const handleAxisMessage = (e: Event) => {
      const customEvent = e as CustomEvent<{
        text: string;
        type?: 'progression' | 'warning' | 'success';
        duration?: number;
        action?: { label: string; onClick?: () => void; action?: () => void };
      }>;
      
      const rawAction = customEvent.detail.action;
      const formattedAction = rawAction ? {
        label: rawAction.label,
        action: rawAction.action || rawAction.onClick || (() => {})
      } : undefined;

      triggerAxisMessage(
        customEvent.detail.text, 
        customEvent.detail.type || 'progression', 
        customEvent.detail.duration || 10000, 
        formattedAction,
        'smart'
      );
    };
    window.addEventListener('mz-axis-message', handleAxisMessage);
    return () => window.removeEventListener('mz-axis-message', handleAxisMessage);
  }, [triggerAxisMessage]);

  useEffect(() => {
    if (!userProfile?.id) return;
    
    // Écoute les modifications admin en temps réel
    const channel = supabase.channel('mz_admin_challenge_controls_' + userProfile.id)
      .on('broadcast', { event: 'force_update' }, (payload: any) => {
        const { userId, challengeData, action } = payload.payload;
        if (userId === userProfile.id) {
          console.log("[Admin Force Update] Received:", payload.payload);
          
          setUserProfile((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              store_preferences: {
                ...(prev.store_preferences || {}),
                challenge_3j: challengeData
              }
            };
          });
          
          // Sauvegarde en DB pour la persistance 
          supabase.from('users').select('store_preferences').eq('id', userId).single().then(({data}) => {
            const prefs = data?.store_preferences || {};
            const newPrefs = { ...prefs, challenge_3j: challengeData };
            supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userId).then();
          });
          
          window.dispatchEvent(new CustomEvent('mz-axis-message', { 
            detail: { text: `⚠️ Votre état de défi a été modifié (${action})`, type: 'warning', duration: 5000 } 
          }));
          
          // Re-evaluation instantanée des modales
          if (action === 'reset') {
            setShowChallenge(false);
            setShowChallengeDay2(false);
            setShowChallengeDay3(false);
            setShowChallengeDay2Fail(false);
            setShowChallengeCelebration(false);
          } else if (action === 'set_j1') {
            setShowChallenge(true);
            setShowChallengeDay2(false);
            setShowChallengeDay3(false);
            setShowChallengeDay2Fail(false);
            setShowChallengeCelebration(false);
          } else if (action === 'set_j2') {
            setShowChallenge(false);
            setShowChallengeDay2(true);
            setShowChallengeDay3(false);
            setShowChallengeDay2Fail(false);
            setShowChallengeCelebration(false);
          } else if (action === 'set_j2_failed') {
            setShowChallenge(false);
            setShowChallengeDay2(false);
            setShowChallengeDay3(false);
            setShowChallengeDay2Fail(true);
            setShowChallengeCelebration(false);
          } else if (action === 'set_j3') {
            setShowChallenge(false);
            setShowChallengeDay2(false);
            setShowChallengeDay3(true);
            setShowChallengeDay2Fail(false);
            setShowChallengeCelebration(false);
          }
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  useEffect(() => {
    const handleForceChallenge = () => {
      setShowChallenge(true);
      if (userProfile && !userProfile.store_preferences?.challenge_3j?.presented) {
         const prefs = userProfile.store_preferences || {};
         const challenge = prefs.challenge_3j || {};
         const newPrefs = { ...prefs, challenge_3j: { ...challenge, presented: true } };
         setUserProfile((prev: any) => prev ? { ...prev, store_preferences: newPrefs } : prev);
         supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userProfile.id).then();
      }
    };
    const handleForceGuide = () => {
      setChallengeTriggered(false);
      setChallengeEligible(false);
    };
    const handleForceCelebration = () => {
      setChallengeCelebratedStep(1);
      setShowChallengeCelebration(true);
    };
    const handleForceDay2 = () => {
      setShowChallengeDay2(true);
    };
    const handleForceDay3 = () => {
      setShowChallengeDay3(true);
    };
    window.addEventListener('mz-trigger-3j-challenge', handleForceChallenge);
    window.addEventListener('mz-force-welcome-guide', handleForceGuide);
    window.addEventListener('mz-trigger-3j-celebration', handleForceCelebration);
    window.addEventListener('mz-trigger-3j-day2', handleForceDay2);
    window.addEventListener('mz-trigger-3j-day3', handleForceDay3);
    return () => {
      window.removeEventListener('mz-trigger-3j-challenge', handleForceChallenge);
      window.removeEventListener('mz-force-welcome-guide', handleForceGuide);
      window.removeEventListener('mz-trigger-3j-celebration', handleForceCelebration);
      window.removeEventListener('mz-trigger-3j-day2', handleForceDay2);
      window.removeEventListener('mz-trigger-3j-day3', handleForceDay3);
    };
  }, []);

  useEffect(() => {
    const handleNavigateDashboard = () => {
      setActiveTab('dashboard');
    };
    window.addEventListener('mz-navigate-dashboard', handleNavigateDashboard);
    return () => window.removeEventListener('mz-navigate-dashboard', handleNavigateDashboard);
  }, []);

  const setupFCM = useCallback(async (isManual = false) => {
    // ESSENTIEL : Récupérer la clé VAPID depuis l'environnement ou utiliser une clé de secours
    const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BJq2QbMlGOeSnuz94cUiQ-kqj6DqXGyIEa968-nBPmmPZ2V7Y_USSAhDodiPSiSwyWl-v8y8fP75byiWFgmFtlo";
    
    console.log('FCM: Initializing setup...', { isManual, hasVapid: !!VAPID_KEY });

    if (!VAPID_KEY || typeof window === 'undefined') return;

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('FCM: Notifications not supported');
      return;
    }

    // Si on a déjà la permission, on récupère juste le token silencieusement (background sync)
    if (Notification.permission === 'granted') {
      console.log('FCM: Permission already granted, syncing token...');
      try {
        const result = await requestNotificationPermission(VAPID_KEY);
        if (result.token) {
          setFcmToken(result.token);
          if (session?.user?.id) {
            await supabase.from('users').update({ fcm_token: result.token, last_fcm_sync: new Date().toISOString() }).eq('id', (session as any).user.id);
          }
        }
      } catch (e) {
        console.warn('FCM: Background sync failed', e);
      }
      return;
    }

    // Si la permission est 'denied', on n'affiche rien (sauf si clic manuel sur un bouton spécifique)
    if (Notification.permission === 'denied') {
      if (isManual) {
        setNotification({
          title: 'Notifications Bloquées',
          body: 'Veuillez autoriser les notifications dans les réglages de votre navigateur.',
          type: 'warning'
        });
      }
      return;
    }

    // SI PERMISSION === 'DEFAULT'
    if (Notification.permission === 'default') {
      // On tente de déclencher le popup natif automatiquement si non dismissed
      if (!localStorage.getItem('fcm_permission_dismissed')) {
        console.log('FCM: Requesting native permission automatically...');
        try {
          // On ne "await" pas forcément ici pour ne pas bloquer si le navigateur met du temps
          requestNotificationPermission(VAPID_KEY).then(result => {
            console.log('FCM: Auto request result:', result.status);
            if (result.status === 'granted' && result.token) {
              setFcmToken(result.token);
              if (session?.user?.id) {
                supabase.from('users').update({ fcm_token: result.token, last_fcm_sync: new Date().toISOString() }).eq('id', (session as any).user.id);
              }
            } else if (result.status === 'default') {
              // Si le popup a été ignoré ou bloqué silencieusement, on montre le bandeau
              setShowPermissionBanner(true);
            }
          }).catch(err => {
            console.error('FCM: Auto request error:', err);
            setShowPermissionBanner(true);
          });
        } catch (e) {
          setShowPermissionBanner(true);
        }
      }
    }
  }, [session]);

  useEffect(() => {
    if (session && !initSequence) {
      // Déclenchement naturel du setup après chargement complet
      const timer = setTimeout(() => {
        setupFCM(false);
      }, 5000); // 5 secondes pour être sûr que tout est fluide au rendu
      
      return () => clearTimeout(timer);
    }
  }, [session, initSequence, setupFCM]);

  // Listen for foreground messages
  useEffect(() => {
    if (!session) return;
    
    const unsubscribe = onMessageListener((payload: any) => {
      if (payload?.notification) {
        setNotification({
          title: payload.notification.title,
          body: payload.notification.body,
        });
        
        // Optionnel: Déclencher une notification système même si l'app est ouverte
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(payload.notification.title, {
              body: payload.notification.body,
              icon: '/firebase-logo.png',
              tag: 'mz-plus-push-foreground'
            });
          });
        }

        // Auto-hide in-app notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') (unsubscribe as any)();
    };
  }, [session]);

  useEffect(() => {
    if (session && userProfile?.id && !localStorage.getItem('mz_guide_completed')) {
      const timer = setTimeout(() => {
        setIsGuideActive(true);
        localStorage.setItem('mz_guide_completed', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session, userProfile?.id]);

  // Sync PWA Branding from Database
  useEffect(() => {
    const syncBranding = async () => {
      try {
        const { data } = await supabase.from('mz_app_config').select('*').eq('id', 'main-config').maybeSingle();
        if (data) {
          if (data.app_name) {
            localStorage.setItem('pwa_custom_name', data.app_name);
            document.title = data.app_name;
          }
          if (data.icon_base64) {
            localStorage.setItem('pwa_custom_icon', data.icon_base64);
            const iconEl = document.querySelector('link[rel="icon"]');
            if (iconEl) iconEl.setAttribute('href', data.icon_base64);
            const appleIconEl = document.querySelector('link[rel="apple-touch-icon"]');
            if (appleIconEl) appleIconEl.setAttribute('href', data.icon_base64);
          }
        }
      } catch (e) {
        console.warn("Branding sync failed (ignore if table doesn't exist yet):", e);
      }
    };
    syncBranding();
  }, []);

  useEffect(() => {
    // Safety fallback: if we are still loading after 15s, something is stuck.
    // Force dismiss the loading screen.
    const loadingGlobalFallback = setTimeout(() => {
      if (loading) {
        console.warn("[App] Loading safety fallback triggered after 15s");
        setLoading(false);
        setInitSequence(false);
      }
    }, 15000);
    
    return () => clearTimeout(loadingGlobalFallback);
  }, [loading]);

  useEffect(() => {
    const getInitialSession = async (retryCount = 0) => {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
          }
          throw error;
        }
        
        setSession(s); 
        if (s) fetchUserData(s.user.id, s.user.email, s.user.user_metadata?.full_name); 
        else if (isProductChecked) setLoading(false);
      } catch (error: any) {
        console.error("Initial session fetch error:", error);
        if (retryCount < 3 && (error.message?.includes('fetch') || error.name === 'TypeError')) {
          setTimeout(() => getInitialSession(retryCount + 1), 1000 * (retryCount + 1));
        } else {
          // If we encounter a hard error (like invalid token), clear session UI state
          setSession(null);
          if (isProductChecked) setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { 
      setSession(s); 
      if (s) fetchUserData(s.user.id, s.user.email, s.user.user_metadata?.full_name); 
      else { setUserProfile(null); if (isProductChecked) setLoading(false); } 
    });
    return () => subscription.unsubscribe();
  }, [fetchUserData, isProductChecked]);

  useEffect(() => {
    const checkProduct = async (retryCount = 0) => {
      try {
        const params = new URLSearchParams(window.location.search);
        const prodId = params.get('prod');
        const refCode = params.get('ref');
        const storeParam = params.get('store');
        const tabParam = params.get('tab') as TabId;
        const scrollToPostParam = params.get('scroll_to_post');

        if (scrollToPostParam) {
          localStorage.setItem('mz_scroll_to_post', scrollToPostParam);
          (window as any).mz_scroll_to_post = scrollToPostParam;
        }

        if (storeParam) {
           setStoreOwnerCode(storeParam);
        }

        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();

        if (
          path === '/admin' || 
          path.endsWith('/admin') || 
          hash === '#admin' || 
          tabParam === 'admin'
        ) {
          setIsAdminView(true);
          if (path.includes('/admin')) {
            window.history.replaceState({}, '', '/' + window.location.search);
          }
        } else if (
          path === '/offreflashpremium' || 
          path.endsWith('/offreflashpremium') || 
          hash === '#offreflashpremium' || 
          hash === '#flash_offer' ||
          tabParam === 'flash_offer' || 
          params.get('tab') === 'offreflashpremium' ||
          params.get('tab') === 'flash_offer'
        ) {
          setActiveTab('flash_offer');
          if (path.includes('/offreflashpremium')) {
            window.history.replaceState({}, '', '/' + window.location.search);
          }
        } else if (
          path === '/evolution' || 
          path.endsWith('/evolution') || 
          hash === '#evolution' || 
          tabParam === 'evolution'
        ) {
          setActiveTab('evolution');
          if (path.includes('/evolution')) {
            window.history.replaceState({}, '', '/' + window.location.search);
          }
        } else if (
          path === '/academie' || 
          path.endsWith('/academie') || 
          path === '/formation' || 
          path.endsWith('/formation') || 
          hash === '#academie' || 
          hash === '#formation' || 
          tabParam === 'formation' ||
          tabParam === 'academie'
        ) {
          setActiveTab('formation');
          if (path.includes('/academie') || path.includes('/formation')) {
            window.history.replaceState({}, '', '/' + window.location.search);
          }
        } else if (tabParam) {
           setActiveTab(tabParam);
        }

        if (prodId) {
          const { data: product, error } = await supabase.from('products').select('*').eq('id', prodId).maybeSingle();
          if (error) throw error;
          if (product) setCustomerProduct(product);
        }

         if (refCode) {
          const { data: referrer } = await supabase.from('users').select('id').eq('referral_code', refCode).maybeSingle();
          if (referrer) {
            setReferrerId(referrer.id);
            if (prodId) {
              // Incrémenter le compteur de clics via RPC uniquement si prodId est présent
              try {
                await supabase.rpc('mz_increment_product_clicks', { 
                  p_user_id: referrer.id, 
                  p_product_id: prodId 
                });
              } catch (err) {
                console.warn("Erreur incrémentation clics:", err);
              }
            }
          }
        }

        setIsProductChecked(true);
      } catch (error: any) {
        console.error("Check product error:", error);
        if (retryCount < 2 && (error.message?.includes('fetch') || error.name === 'TypeError')) {
          setTimeout(() => checkProduct(retryCount + 1), 1000);
        } else {
          setIsProductChecked(true);
        }
      }
    };
    checkProduct();
  }, []);

  useEffect(() => {
    const handleViewProduct = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.product) {
        setCustomerProduct(customEvent.detail.product);
      }
    };
    const handleCloseProduct = () => {
      setCustomerProduct(null);
      if (window.location.search.includes('prod=')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    window.addEventListener('view-product-details', handleViewProduct);
    window.addEventListener('close-product-details', handleCloseProduct);

    const handleOpenReward = (e: any) => {
      const { rewardId, id, text, content, title, imageUrl, navigateOnly } = e.detail || {};
      
      if (navigateOnly) {
        setActiveTab('bonuses');
        return;
      }

      const actualId = rewardId || id;
      const actualContent = text || content || (actualId ? getBonusContent(actualId, title) : null);
      
      if (actualContent) {
        setBonusContent({
          id: actualId || 'dynamic-reward',
          title: title || "CONTENU BONUS ÉLITE",
          content: actualContent,
          previewUrl: imageUrl
        });
      }
    };

    window.addEventListener('mz-open-reward-content', handleOpenReward);

    return () => {
      window.removeEventListener('view-product-details', handleViewProduct);
      window.removeEventListener('close-product-details', handleCloseProduct);
      window.removeEventListener('mz-open-reward-content', handleOpenReward);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'rpa' && !localStorage.getItem('mz_rpa_guide_completed')) {
      const timer = setTimeout(() => {
        setIsRPAGuideActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // GLOBAL HEARTBEAT & INACTIVITY TRACKING
  useEffect(() => {
    if (!userProfile?.id) return;
    
    let lastActivityTime = Date.now();
    const handleActivity = () => {
      lastActivityTime = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    const sendHeartbeat = async () => {
      // If idle for more than 30 seconds (one heartbeat interval), stop heartbeats to allow background notifications
      if (Date.now() - lastActivityTime > 30000) return;

      try {
        const { error } = await supabase.rpc('mz_rewards_heartbeat', { p_user_id: userProfile.id });
        if (error) console.warn("Global heartbeat error:", error.message);
      } catch {
        console.warn("Global heartbeat RPC not available");
      }
    };

    // Premier appel immédiat
    sendHeartbeat();
    
    // Puis toutes les 30 secondes (pour une détection d'inactivité plus précise)
    const interval = setInterval(sendHeartbeat, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [userProfile?.id]);

  const handlePurchase = useCallback(async () => {
    setPurchaseStep('processing');
    
    // Enregistrer la commission si un parrain est détecté
    if (referrerId && customerProduct) {
      try {
        const { error: commError } = await supabase.from('commissions').insert([{
          user_id: referrerId,
          product_id: customerProduct.id,
          amount: customerProduct.commission_amount,
          status: 'pending'
        }]);
        
        if (commError) {
          console.error("Erreur lors de l'enregistrement de la commission:", commError);
        } else {
          console.log("Commission enregistrée avec succès pour l'ambassadeur:", referrerId);
        }
      } catch (err) {
        console.error("Exception lors de l'enregistrement de la commission:", err);
      }
    }

    // Redirection vers le lien final du produit
    setTimeout(() => {
      triggerAxisMessage('Transaction validée. Un nouvel accomplissement pour votre ascension.', 'success', 6000);
      if (customerProduct?.final_link) {
        window.location.href = customerProduct.final_link;
      } else {
        setPurchaseStep('view');
        alert("Lien de redirection manquant pour ce produit.");
      }
    }, 800); // Délai suffisant pour l'enregistrement et l'effet visuel
  }, [customerProduct, referrerId, triggerAxisMessage]);

  if (loading || !isProductChecked || initSequence) {
    return <SystemInitiator loading={loading} />;
  }

  if (isAdminView) {
    return (
      <AdminSecurityWall 
        userProfile={userProfile} 
        onExit={() => {
          setIsAdminView(false);
          setActiveTab('dashboard');
        }}
        onRefresh={triggerRefresh}
      />
    );
  }

  if (storeOwnerCode) {
    return <StandalonePublicStore storeOwnerCode={storeOwnerCode} />;
  }
  
  if (customerProduct) return (<ProductSalesPage product={customerProduct} onPurchase={handlePurchase} purchaseStep={purchaseStep} countdown={900} isLoggedIn={!!session} />);
  if (!session) return <LandingPage />;

  const isAdmin = userProfile?.email === 'google@gmail.com' && (userProfile?.is_admin === true);

  const handleShareClose = () => {
    setShowSharePopup(false);
    if (xpRewardSource === 'formation_complete') {
      let remaining3s = 3;
      const interval3s = setInterval(() => {
        if (document.visibilityState === 'visible') {
          remaining3s -= 1;
          if (remaining3s <= 0) {
            clearInterval(interval3s);
            triggerAxisMessage(
              "Allô, c'est moi, Axis 👁️\nMaintenant que tu as suivi la formation, il est temps de passer à l'action 🚀\nVa choisir ton produit 💰",
              'progression',
              15000,
              {
                label: "Aller à la boutique",
                action: () => {
                  hideAxis();
                  setActiveTab('affiliation');
                }
              },
              'smart'
            );
          }
        }
      }, 1000);
      setXpRewardSource(""); // Clear to prevent double triggering
    }
  };

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      isAdmin={isAdmin} 
      profile={userProfile}
      isMenuOpen={isMenuOpen}
      setIsMenuOpen={setIsMenuOpen}
    >
      <ShareModal isVisible={showSharePopup} onClose={handleShareClose} referralCode={userProfile?.referral_code} />
      <PremiumAccessGate />
      
      <PushDisplay profile={userProfile} />

      {/* Foreground Notification Toast (FCM) */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] bg-neutral-900 border ${notification.type === 'error' ? 'border-red-500/50' : notification.type === 'warning' ? 'border-yellow-500/50' : 'border-yellow-500/30'} p-4 rounded-xl shadow-2xl animate-slide-down max-w-sm pointer-events-auto`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full ${notification.type === 'error' ? 'bg-red-500/10' : notification.type === 'warning' ? 'bg-yellow-500/10' : 'bg-yellow-500/10'} flex items-center justify-center shrink-0`}>
              {notification.type === 'error' ? (
                <AlertTriangle className="text-red-500" size={20} />
              ) : (
                <Sparkles className="text-yellow-500 animate-pulse" size={20} />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`${notification.type === 'error' ? 'text-red-500' : 'text-yellow-500'} font-bold text-sm`}>{notification.title}</h4>
              <p className="text-neutral-400 text-xs mt-1">{notification.body}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {/* Désactivation des popups Premium automatiques à la demande de l'utilisateur */}
      {/* <PremiumPopup user={userProfile} /> */}
      {/* <MZPlusPresentationOverlay profile={userProfile} onUpgrade={() => setActiveTab('flash_offer')} /> */}
      <AnnouncementOverlay profile={userProfile} onNavigate={(tab) => setActiveTab(tab as TabId)} />

      {activeTab === 'flash_offer' && <MZPlusFlashOfferOverlay profile={userProfile} onUpgrade={() => setActiveTab('upgrade')} onClose={() => setActiveTab('dashboard')} isFullPage={true} />}
      {activeTab === 'dashboard' && (
        <GlobalView 
          profile={userProfile} 
          onSwitchTab={(tab) => {
            if (tab === 'admin') {
              setIsAdminView(true);
            } else {
              setActiveTab(tab as TabId);
            }
          }} 
          onStartGuide={() => {
            if (!localStorage.getItem('mz_guide_completed')) {
              setIsGuideActive(true);
              localStorage.setItem('mz_guide_completed', 'true');
            }
          }}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          wallet={wallet}
          onRefresh={triggerRefresh}
        />
      )}
      <AffiliationGuide 
        isActive={isGuideActive} 
        onComplete={() => setIsGuideActive(false)} 
        activeCategory={activeCategory}
        activeTab={activeTab}
      />
      <RPAGuide 
        isActive={isRPAGuideActive} 
        onComplete={() => setIsRPAGuideActive(false)} 
      />
      {activeTab === 'profile' && (
        <ProfileTab 
          profile={userProfile} 
          onLogout={handleLogout} 
          isAdmin={isAdmin} 
          onSwitchTab={(tab) => {
            if (tab === 'admin') {
              setIsAdminView(true);
            } else {
              setActiveTab(tab as TabId);
            }
          }} 
          onRefresh={triggerRefresh} 
          onStartAxisGuide={() => {
            localStorage.removeItem('mz_axis_welcomed');
            sessionStorage.setItem('mz_axis_guide_active', 'true');
            setActiveTab('dashboard');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('mz-force-welcome-guide'));
            }, 500);
          }}
        />
      )}
      {activeTab === 'bonuses' && <BonusHub profile={userProfile} onSwitchTab={(tab) => setActiveTab(tab as TabId)} />}
      {activeTab === 'community' && <CommunityTab profile={userProfile} />}
      {activeTab === 'live_withdrawals' && <LiveWithdrawalsView onBack={() => setActiveTab('dashboard')} />}
      {activeTab === 'axis' && <AxisChat profile={userProfile} onSwitchTab={(tab) => setActiveTab(tab as TabId)} />}
      {activeTab === 'leaderboard' && <LeaderboardTab profile={userProfile} mode="global" />}
      {activeTab === 'leaderboard_local' && <LeaderboardTab profile={userProfile} mode="local" />}
      {activeTab === 'weekly_challenge' && <WeeklyChallenge profile={userProfile} teamCount={teamCount} onSwitchTab={(tab) => setActiveTab(tab as TabId)} />}
      {activeTab === 'recompense' && <RewardFeature profile={userProfile} onSwitchTab={(tab) => setActiveTab(tab as TabId)} />}
      {activeTab === 'private_chat' && <EspacePrive profile={userProfile} />}
      {activeTab === 'private_messaging' && <PrivateMessagingMain profile={userProfile} />}
      {activeTab === 'revenus' && <RevenueTab profile={userProfile} wallet={wallet} />}
      {(activeTab === 'affiliation' || activeTab === 'catalog') && <MyStore profile={userProfile} onSwitchTab={setActiveTab} onRefresh={triggerRefresh} />}
      {activeTab === 'team' && <TeamTab profile={userProfile} teamCount={teamCount} onSwitchTab={setActiveTab} />}
      {activeTab === 'coaching' && <CoachingTab profile={userProfile} onSwitchTab={setActiveTab} />}
      {activeTab === 'formation' && <FormationTab profile={userProfile} onSwitchTab={setActiveTab} />}
      {activeTab === 'rpa' && (
        <RPADashboard 
          profile={userProfile} 
          onRefresh={triggerRefresh} 
          onSwitchTab={setActiveTab} 
          onStartGuide={() => {
            localStorage.removeItem('mz_rpa_guide_completed');
            setIsRPAGuideActive(true);
          }}
        />
      )}
      {activeTab === 'suggestions' && <SuggestionsTab profile={userProfile} />}
      {activeTab === 'guides' && (
        <GuidesTab 
          onStartAffiliationGuide={() => {
            localStorage.removeItem('mz_guide_completed');
            setActiveTab('dashboard');
            setIsGuideActive(true);
          }}
          onStartRPAGuide={() => {
            localStorage.removeItem('mz_rpa_guide_completed');
            setActiveTab('rpa');
            setIsRPAGuideActive(true);
          }}
          onStartTeamGuide={() => {
            localStorage.removeItem('mz_referral_guide_seen');
            setActiveTab('team');
            // La redirection déclenchera le guide Axis dans ReferralDashboard
          }}
          onStartAxisGuide={() => {
            localStorage.removeItem('mz_axis_welcomed');
            sessionStorage.setItem('mz_axis_guide_active', 'true');
            setActiveTab('dashboard');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('mz-force-welcome-guide'));
            }, 500);
          }}
        />
      )}
      {activeTab === 'upgrade' && <UpgradeTab />}
      {activeTab === 'luna_chat' && <LunaChatPage profile={userProfile} onUpgrade={() => setActiveTab('flash_offer')} />}
      {activeTab === 'evolution' && <EvolutionTab profile={userProfile} onBack={() => setActiveTab('profile')} />}
      <AxisGuideFlow session={session} userProfile={userProfile} isReady={!loading && !initSequence} />
      <RankRewardChecker profile={userProfile} onRedirectProfile={() => {
        setActiveTab('profile');
        setTimeout(() => {
          const tube = document.getElementById('progression-section');
          if (tube) {
            tube.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }} />
      <LevelUpCelebration 
        rankData={rankUpData}
        userName={userProfile?.full_name || "Élite"}
        userId={userProfile?.id || ""}
        onClose={() => setRankUpData(null)}
      />
      <EvolutionShareModal 
        isVisible={showEvolutionShare}
        onClose={() => setShowEvolutionShare(false)}
        userName={userProfile?.full_name || "Élite"}
        userId={userProfile?.id || ""}
        type={evolutionShareType}
        data={evolutionShareData}
      />
      <XPRewardModal 
        isVisible={showXpReward} 
        amount={xpRewardAmount} 
        title={xpRewardTitle}
        description={xpRewardDesc}
        onComplete={() => {
          setShowXpReward(false);
          if (xpRewardSource === 'formation_complete') {
            let remaining2s = 2;
            const interval2s = setInterval(() => {
              if (document.visibilityState === 'visible') {
                remaining2s -= 1;
                if (remaining2s <= 0) {
                  clearInterval(interval2s);
                  // Use Evolution Share instead of generic Share
                  setEvolutionShareType('formation_completed');
                  setEvolutionShareData({ title: xpRewardTitle || 'Formation MZ+' });
                  setShowEvolutionShare(true);
                }
              }
            }, 1000);
          }
          const hasSeenChallenge = userProfile?.store_preferences?.challenge_3j?.presented;
          if (!hasSeenChallenge) {
             setChallengeTriggered(false);
             setChallengeEligible(true);
          }
        }} 
      />
      <ChallengePresentation 
        isVisible={showChallenge} 
        onAccept={() => {
          setShowChallenge(false);
          setActiveTab('formation');
          setTimeout(() => {
            triggerAxisMessage(
               "👉 \"Bravo pour ton engagement ! 🎉🎉 Juste avant de te lancer, il est important que tu lises ce guide. Clique ci-dessous !\"",
               'progression',
               15000,
               {
                 label: "Voir la formation J1",
                 action: () => {
                   hideAxis();
                   window.dispatchEvent(new CustomEvent('open-formation', { detail: { id: 'default-free-text' } }));
                 }
               },
               'smart'
            );
          }, 800);
        }} 
      />
      <ChallengePresentation 
        isVisible={showChallengeCelebration}
        mode="celebration"
        profile={userProfile}
        completedStep={challengeCelebratedStep}
        onAccept={() => {
          setShowChallengeCelebration(false);
        }}
      />
      <ChallengePresentation 
        isVisible={showChallengeDay2}
        mode="day2_intro"
        onAccept={() => {
          setShowChallengeDay2(false);
          setActiveTab('formation');
          updateChallengeDB({ j2Presented: true, j2StartedAt: new Date().toISOString() });
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-formation', { detail: { id: 'default-free-video' } }));
          }, 400);
        }}
        onClose={() => {
          setShowChallengeDay2(false);
          // Ne pas marquer comme présenté pour qu'on puisse le re-proposer "Plus tard"
        }}
      />
      <ChallengePresentation 
        isVisible={showChallengeDay3}
        mode="day3_intro"
        hasFailedDay2={forceDay3FailText || !userProfile?.store_preferences?.challenge_3j?.j2Completed}
        onAccept={() => {
          setShowChallengeDay3(false);
          setForceDay3FailText(false);
          updateChallengeDB({ j3Presented: true, j3StartedAt: new Date().toISOString() });
        }}
        onClose={() => {
          setShowChallengeDay3(false);
          setForceDay3FailText(false);
        }}
      />
      <ChallengePresentation 
        isVisible={showChallengeDay2Fail}
        mode="day2_fail_intro"
        onAccept={(action) => {
          setShowChallengeDay2Fail(false);
          setTimeout(() => {
            if (action === 'premium') {
              setPendingDay3TriggerAfterPremium(true);
              setActiveTab('flash_offer');
            } else {
              updateChallengeDB({ j3Presented: true, j3StartedAt: new Date().toISOString() });
              setForceDay3FailText(true);
              window.dispatchEvent(new CustomEvent('mz-trigger-3j-day3'));
            }
          }, 300);
        }}
        onClose={() => {
          setShowChallengeDay2Fail(false);
          updateChallengeDB({ j3Presented: true, j3StartedAt: new Date().toISOString() });
          setForceDay3FailText(true);
          window.dispatchEvent(new CustomEvent('mz-trigger-3j-day3'));
        }}
      />
      <AnimatePresence>
        {showDay2UpsellPopup && (
           <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowDay2UpsellPopup(false)}
           >
              <motion.div
                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.9, opacity: 0, y: 20 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                 onClick={e => e.stopPropagation()}
                 className="bg-[#111] border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full relative overflow-hidden shadow-[0_10px_50px_rgba(168,85,247,0.2)]"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-purple-500">
                    <Rocket size={80} />
                 </div>
                 
                 <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                       <Crown size={32} />
                    </div>
                    
                    <div className="space-y-4">
                       <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                         <span className="text-orange-500 mr-2">🔥</span>Tu comprends maintenant comment fonctionnent les ventes avec MZ+.
                       </h3>
                       
                       <p className="text-sm font-medium text-purple-200/70 leading-relaxed">
                         <span className="text-purple-400 mr-2">👑</span>Les membres MZ+ Premium obtiennent des résultats plus rapidement grâce à un accompagnement et des stratégies avancées.
                       </p>
                    </div>

                    <button
                       onClick={() => {
                          setShowDay2UpsellPopup(false);
                          setActiveTab('flash_offer');
                       }}
                       className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.02] transition-all relative overflow-hidden group border border-purple-400/30"
                    >
                       <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:opacity-100 opacity-60 z-20 pointer-events-none mix-blend-overlay" />
                       <span className="relative z-10 flex flex-col items-center gap-1">
                          <span>👉 En savoir plus 👑</span>
                       </span>
                    </button>
                    
                    <button
                       onClick={() => setShowDay2UpsellPopup(false)}
                       className="text-neutral-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                       Peut-être plus tard
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
        
        {showDay2FailedUpsellPopup && (
           <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowDay2FailedUpsellPopup(false)}
           >
              <motion.div
                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.9, opacity: 0, y: 20 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                 onClick={e => e.stopPropagation()}
                 className="bg-[#111] border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full relative overflow-hidden shadow-[0_10px_50px_rgba(168,85,247,0.2)]"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none text-purple-500">
                    <Rocket size={80} />
                 </div>
                 
                 <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-[var(--color-gold-main)] shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                       <Crown size={32} />
                    </div>
                    
                    <div className="space-y-4">
                       <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                         <span className="text-purple-500 mr-2">🎯</span>C'est normal de bloquer au début.
                       </h3>
                       
                       <p className="text-sm font-medium text-neutral-300 leading-relaxed">
                         <span className="text-purple-400 mr-2">⚡</span>Ne reste pas bloqué ! Les membres <strong className="text-[var(--color-gold-main)]">MZ+ Premium</strong> obtiennent des résultats beaucoup plus vite grâce à notre accompagnement et nos conseils.
                       </p>
                    </div>

                    <button
                       onClick={() => {
                          setShowDay2FailedUpsellPopup(false);
                          setActiveTab('flash_offer');
                       }}
                       className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.02] transition-all relative overflow-hidden group border border-purple-400/30"
                    >
                       <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:opacity-100 opacity-60 z-20 pointer-events-none mix-blend-overlay" />
                       <span className="relative z-10 flex flex-col items-center gap-1">
                          <span>👉 Découvrir MZ+ Premium 👑</span>
                       </span>
                    </button>
                    
                    <button
                       onClick={() => setShowDay2FailedUpsellPopup(false)}
                       className="text-neutral-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                       Peut-être plus tard
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
      <PWAInstallBanner />
      
      {/* Progressive Permission Banner (Soft Prompt) */}
      <AnimatePresence>
        {showPermissionBanner && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            className="fixed top-20 left-4 right-4 z-[150] md:left-auto md:right-8 md:top-8 md:w-96"
          >
            <div className="bg-[#111] border border-yellow-500/20 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-l-4 border-l-yellow-600 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-600/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
                  <Bell size={20} className="animate-pulse" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm tracking-tight">Activez vos alertes stratégiques</h4>
                  <p className="text-white/50 text-[11px] mt-0.5 leading-relaxed">
                    Ne manquez aucune vente ni opportunité MZ+. Soyez notifié en temps réel.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    localStorage.setItem('fcm_permission_dismissed', 'true');
                    setShowPermissionBanner(false);
                  }}
                  className="text-neutral-600 hover:text-white transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setupFCM(true)}
                  className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition-all active:scale-95"
                >
                  Activer maintenant
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('fcm_permission_dismissed', 'true');
                    setShowPermissionBanner(false);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bonusContent && (
          <BonusContentReader 
            title={bonusContent.title}
            content={bonusContent.content}
            bonusId={bonusContent.id}
            previewUrl={bonusContent.previewUrl}
            onClose={() => setBonusContent(null)}
            onComplete={() => {}}
          />
        )}
      </AnimatePresence>

      <PremiumOfferPopup 
        isOpen={premiumTrigger?.type === 'popup'}
        message={premiumTrigger?.message || ''}
        cta={premiumTrigger?.cta}
        onClose={() => setPremiumTrigger(null)}
        onUpgrade={() => {
          setPremiumTrigger(null);
          setActiveTab('flash_offer');
        }}
      />
    </DashboardLayout>
  );
};

const QUOTES = [
  { text: "Le risque le plus grand est de ne prendre aucun risque.", author: "Mark Zuckerberg" },
  { text: "Les riches investissent leur argent et dépensent ce qui reste.", author: "Jim Rohn" },
  { text: "Le meilleur investissement que vous puissiez faire est d’investir en vous-même.", author: "Warren Buffett" },
  { text: "La discipline crée des résultats que la motivation seule ne peut pas maintenir.", author: "Confucius" },
  { text: "Le succès n’est pas final, l’échec n’est pas fatal : c’est le courage de continuer qui compte.", author: "Winston Churchill" },
  { text: "Les opportunités ne se présentent pas. Vous les créez.", author: "Chris Grosser" },
  { text: "L'innovation distingue un leader d'un suiveur.", author: "Steve Jobs" },
  { text: "Votre temps est limité, ne le gâchez pas en menant une existence qui n'est pas la vôtre.", author: "Steve Jobs" },
  { text: "Si vous ne trouvez pas un moyen de gagner de l’argent pendant que vous dormez, vous travaillerez jusqu’à votre mort.", author: "Warren Buffett" },
  { text: "Le prix est ce que vous payez, la valeur est ce que vous obtenez.", author: "Warren Buffett" },
  { text: "La persévérance est ce qui rend l'impossible possible.", author: "Robert Half" },
  { text: "Il n'y a pas de raccourci pour arriver là où ça vaut la peine d'aller.", author: "Beverly Sills" },
  { text: "Visez la lune. Même si vous échouez, vous atterrirez parmi les étoiles.", author: "Les Brown" },
  { text: "Celui qui déplace une montagne commence par déplacer de petites pierres.", author: "Confucius" },
  { text: "Le talent gagne des matchs, mais le travail d’équipe et l’intelligence gagnent des championnats.", author: "Michael Jordan" },
  { text: "Je n'ai pas échoué. J'ai juste trouvé 10 000 moyens qui ne fonctionnent pas.", author: "Thomas Edison" },
  { text: "La régularité est la clé de la croissance exponentielle.", author: "Conseil MZ+" },
  { text: "Votre réseau est votre valeur nette. Connectez-vous avec les élites.", author: "Conseil MZ+" },
  { text: "Le défi 3J est conçu pour tester votre engagement initial.", author: "Conseil MZ+" },
  { text: "Ne travaillez pas pour l'argent, faites en sorte que l'argent travaille pour vous.", author: "Conseil MZ+" }
];

const SystemInitiator: React.FC<{ loading: boolean }> = ({ loading }) => {
  const [progress, setProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // Change quote every 20% progress
        const nextVal = prev + 1.5;
        if (Math.floor(prev / 25) !== Math.floor(nextVal / 25)) {
           setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
        }
        
        return nextVal;
      });
    }, 40);

    const quoteInterval = setInterval(() => {
      setQuoteIndex(prev => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * QUOTES.length);
        } while (nextIndex === prev && QUOTES.length > 1);
        return nextIndex;
      });
    }, 4500);

    return () => {
      clearInterval(interval);
      clearInterval(quoteInterval);
    };
  }, [loading]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,1),rgba(5,5,5,1))]" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-600/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-600/5 blur-[120px] rounded-full" />
      
      <div className="relative z-10 w-full max-w-2xl space-y-16 flex flex-col items-center">
        {/* Animated Icon */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-[2.5rem] flex items-center justify-center text-black shadow-[0_0_60px_rgba(202,138,4,0.2)]"
        >
          <Crown size={48} fill="currentColor" />
        </motion.div>

        {/* Content Area */}
        <div className="space-y-8 w-full min-h-[160px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="space-y-6 text-center"
            >
              <p className="text-xl sm:text-2xl md:text-3xl font-medium text-white/90 leading-tight tracking-tight italic font-serif max-w-lg mx-auto">
                “{QUOTES[quoteIndex].text}”
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-8 bg-yellow-600/30" />
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-yellow-600">
                  {QUOTES[quoteIndex].author}
                </p>
                <div className="h-[1px] w-8 bg-yellow-600/30" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress System */}
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Initialisation de votre système</span>
            <span className="text-[10px] font-mono text-yellow-600/60">{loading ? '...' : `${Math.round(progress)}%`}</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/[0.02]">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-600 to-yellow-500 shadow-[0_0_20px_rgba(202,138,4,0.4)]"
              initial={{ width: "0%" }}
              animate={{ width: loading ? "10%" : `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        {/* Footer Meta */}
        <div className="grid grid-cols-3 w-full max-w-md pt-8 border-t border-white/5 text-[8px] font-black uppercase tracking-[0.2em] text-white/10 uppercase">
           <div className="text-left">Intelligence MZ+</div>
           <div className="text-center">Élite Business</div>
           <div className="text-right">v7.4.2</div>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-30">
         <p className="text-[9px] font-black tracking-[0.5em] text-white/40 uppercase animate-pulse">L'ambition n'attends pas</p>
      </div>
    </div>
  );
};

export default App;
