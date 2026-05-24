import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Zap,
  Loader2,
  Search,
  Trash2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  ShoppingBasket,
  X,
  Eye,
  Megaphone,
  Copy,
  BarChart3,
  Calendar,
  Filter,
  Store,
  Settings,
  Check,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../../services/supabase.ts";
import {
  Product,
  UserProfile,
  Commission,
  ProductStat,
} from "../../../types.ts";
import { CurrencyDisplay } from "../../ui/CurrencyDisplay.tsx";
import { ProductDetailView, ShareModal } from "../../ProductDetailView.tsx";
import { LiveCommissionsFeed } from "./LiveCommissionsFeed.tsx";
import { PublicStorefront } from "./PublicStorefront.tsx";
import { StoreSettingsModal } from "./StoreSettingsModal.tsx";
import { StoreStats } from "./StoreStats.tsx";
import { DynamicPremiumUpsell } from "./DynamicPremiumUpsell.tsx";

import { StoreFAQ } from "./StoreFAQ.tsx";

const playDopamineHit = () => {
  try {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;

    const playNote = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    };

    playNote(523.25, now, 1.5); // C5
    playNote(659.25, now + 0.1, 1.5); // E5
    playNote(783.99, now + 0.15, 1.5); // G5
    playNote(1046.5, now + 0.2, 2.0); // C6
  } catch (e) {
    console.error("Audio playback error", e);
  }
};

const CelebrationOverlay = ({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) => {
  useEffect(() => {
    import("canvas-confetti").then((confetti) => {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti.default({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#10b981", "#f59e0b", "#ffffff"], // Emerald, Amber, White
        });
        confetti.default({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#10b981", "#f59e0b", "#ffffff"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-black to-black"></div>

      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
        className="relative z-10 flex flex-col items-center max-w-lg w-full px-4 text-center"
      >
        <div className="w-40 h-40 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.5)] border-4 border-emerald-400/50 relative mb-8">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 to-transparent"></div>
        </div>

        <div className="flex items-center justify-center gap-2 text-emerald-400 mb-3 font-black tracking-widest uppercase text-xs sm:text-sm">
          <span className="text-lg relative">
            <div className="absolute inset-0 bg-emerald-400 blur-md opacity-30 rounded-full"></div>
            👁️
          </span>{" "}
          AXIS CONFIRME
        </div>

        <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-100 to-emerald-300 mb-4 animate-[pulse_2s_ease-in-out_infinite]">
          FÉLICITATIONS ! 🎉
        </h2>

        <p className="text-lg sm:text-xl text-emerald-100/90 font-medium leading-relaxed mb-6">
          <span className="text-white font-bold">{product.name}</span> est
          maintenant en ligne dans ta boutique. 🚀
        </p>

        <p className="text-sm text-emerald-400 flex items-center justify-center gap-2 font-bold mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block shadow-[0_0_10px_#10b981]"></span>
          Génération de revenus activée 💸
        </p>

        <button
          onClick={onClose}
          className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
        >
          Prochaine étape
        </button>
      </motion.div>
    </motion.div>
  );
};

interface MyStoreProps {
  profile: UserProfile | null;
  onSwitchTab?: (tab: string) => void;
  onRefresh?: () => void;
}

export const MyStore: React.FC<MyStoreProps> = ({
  profile,
  onSwitchTab,
  onRefresh,
}) => {
  const [activeSegment, setActiveSegment] = useState<
    "my_products" | "import_catalog" | "stats" | "product_analysis"
  >("my_products");
  const [products, setProducts] = useState<Product[]>([]);
  const [storeProductIds, setStoreProductIds] = useState<string[]>([]);
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [statsPeriod, setStatsPeriod] = useState<"7d" | "30d" | "all">("7d");
  const [statProductId, setStatProductId] = useState<string | null>(null);

  const [importingId, setImportingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedCatalogProduct, setSelectedCatalogProduct] =
    useState<Product | null>(null);
  const [detailViewProduct, setDetailViewProduct] = useState<Product | null>(
    null,
  );
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showPublicStore, setShowPublicStore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const [storePreferences, setStorePreferences] = useState<any>(
    profile?.store_preferences || null,
  );
  const [customizationEnabled, setCustomizationEnabled] = useState(true);
  const [isAddProductHighlighted, setIsAddProductHighlighted] = useState(false);
  const [addingProduct, setAddingProduct] = useState<Product | null>(null);
  const [celebratedProduct, setCelebratedProduct] = useState<Product | null>(
    null,
  );

  const [isAddFirstProductHighlighted, setIsAddFirstProductHighlighted] =
    useState(false);
  const [isAddProductToStoreHighlighted, setIsAddProductToStoreHighlighted] =
    useState(false);
  const [isPromoteHighlighted, setIsPromoteHighlighted] = useState(false);

  useEffect(() => {
    const handleHighlightAddProduct = () => {
      setIsAddProductHighlighted(true);
      setTimeout(() => setIsAddProductHighlighted(false), 9000);
    };

    const handleHighlightFirstProduct = () => {
      setIsAddFirstProductHighlighted(true);
      setTimeout(() => setIsAddFirstProductHighlighted(false), 9000);
    };

    const handleHighlightProductToStore = () => {
      setIsAddProductToStoreHighlighted(true);
      setTimeout(() => setIsAddProductToStoreHighlighted(false), 9000);
    };

    const handleHighlightPromote = () => {
      setIsPromoteHighlighted(true);
      // scroll to the product list so it's clearly visible
      setTimeout(() => {
        const firstProduct = document.querySelector('[id^="store-product-"]');
        if (firstProduct) {
          firstProduct.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
      setTimeout(() => setIsPromoteHighlighted(false), 15000); // Increased duration to match teaching step
    };

    window.addEventListener(
      "mz-highlight-add-product",
      handleHighlightAddProduct,
    );
    window.addEventListener(
      "mz-highlight-first-product",
      handleHighlightFirstProduct,
    );
    window.addEventListener(
      "mz-highlight-add-to-store",
      handleHighlightProductToStore,
    );
    window.addEventListener("mz-highlight-promote", handleHighlightPromote);

    return () => {
      window.removeEventListener(
        "mz-highlight-add-product",
        handleHighlightAddProduct,
      );
      window.removeEventListener(
        "mz-highlight-first-product",
        handleHighlightFirstProduct,
      );
      window.removeEventListener(
        "mz-highlight-add-to-store",
        handleHighlightProductToStore,
      );
      window.removeEventListener(
        "mz-highlight-promote",
        handleHighlightPromote,
      );
    };
  }, []);

  // Fetch platform settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from("platform_settings")
          .select("*")
          .eq("id", "store_customization")
          .maybeSingle();
        if (data) setCustomizationEnabled(data.value?.enabled !== false);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  // Update preferences if profile changes
  useEffect(() => {
    if (profile?.store_preferences) {
      setStorePreferences(profile.store_preferences);
    }
  }, [JSON.stringify(profile?.store_preferences)]);

  // Stats derivations
  const totalVisits = useMemo(() => {
    const statsToUse = statProductId
      ? productStats.filter((s) => s.product_id === statProductId)
      : productStats;
    return statsToUse.reduce((sum, stat) => sum + (stat.clicks || 0), 0);
  }, [productStats, statProductId]);

  const totalSales = useMemo(() => {
    const commsToUse = statProductId
      ? commissions.filter((c) => c.product_id === statProductId)
      : commissions;
    return commsToUse.filter(
      (c) => c.status === "approved" || c.status === "pending",
    ).length;
  }, [commissions, statProductId]);

  const conversionRate = useMemo(() => {
    if (totalVisits === 0) return 0;
    return (totalSales / totalVisits) * 100;
  }, [totalVisits, totalSales]);

  const netRevenue = useMemo(() => {
    const commsToUse = statProductId
      ? commissions.filter((c) => c.product_id === statProductId)
      : commissions;
    return commsToUse
      .filter((c) => c.status === "approved")
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [commissions, statProductId]);

  // Chart Data derivation
  const chartData = useMemo(() => {
    const commsToUse = statProductId
      ? commissions.filter((c) => c.product_id === statProductId)
      : commissions;
    const dates: Record<
      string,
      { date: string; ventes: number; revenus: number; visites: number }
    > = {};
    const now = new Date();

    // Setup period bounds
    let daysToInclude = 0;
    if (statsPeriod === "7d") daysToInclude = 7;
    if (statsPeriod === "30d") daysToInclude = 30;

    // Initialize empty dates
    if (daysToInclude > 0) {
      for (let i = daysToInclude - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        dates[dateStr] = { date: dateStr, ventes: 0, revenus: 0, visites: 0 };
      }
    }

    const filteredCommissions = commsToUse.filter(
      (c) => c.status === "approved" || c.status === "pending",
    );

    filteredCommissions.forEach((c) => {
      const dateStr = new Date(c.created_at).toISOString().split("T")[0];

      // If we are showing 'all', dynamically add dates
      if (!dates[dateStr]) {
        if (statsPeriod === "all") {
          dates[dateStr] = { date: dateStr, ventes: 0, revenus: 0, visites: 0 };
        } else {
          // Skip if not in range
          const d = new Date(c.created_at);
          const diffTime = Math.abs(now.getTime() - d.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > daysToInclude) return;
          dates[dateStr] = { date: dateStr, ventes: 0, revenus: 0, visites: 0 };
        }
      }

      dates[dateStr].ventes += 1;
      if (c.status === "approved") {
        dates[dateStr].revenus += c.amount || 0;
      }
    });

    const datesArr = Object.values(dates).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // Distribute totalVisits across dates array deterministically
    let remainingVisits = totalVisits;
    if (remainingVisits > 0 && datesArr.length > 0) {
      datesArr.forEach((item, index) => {
        if (index === datesArr.length - 1) {
          item.visites = remainingVisits;
        } else {
          // Generate fake traffic based on date hash
          const seed = item.date.charCodeAt(item.date.length - 1) + index;
          const weight = 0.5 + (seed % 10) / 20; // 0.5 to 0.95
          const portion = Math.floor(
            remainingVisits * (weight / (datesArr.length - index)),
          );
          item.visites = portion;
          remainingVisits -= portion;
        }
      });
    }

    return datesArr.map((item) => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [commissions, statsPeriod, totalVisits]);

  useEffect(() => {
    fetchData();

    if (profile?.id) {
      const channel = supabase
        .channel("store_realtime_updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "product_stats",
            filter: `user_id=eq.${profile.id}`,
          },
          fetchData,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "commissions",
            filter: `user_id=eq.${profile.id}`,
          },
          fetchData,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "mz_user_store",
            filter: `user_id=eq.${profile.id}`,
          },
          fetchData,
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id]);

  const fetchData = async () => {
    try {
      const { data: allProds } = await supabase.from("products").select("*");
      setProducts(allProds || []);

      if (profile?.id) {
        const [storeRes, statsRes, commsRes] = await Promise.all([
          supabase
            .from("mz_user_store")
            .select("product_id")
            .eq("user_id", profile.id),
          supabase
            .from("product_stats")
            .select("product_id, clicks")
            .eq("user_id", profile.id),
          supabase
            .from("commissions")
            .select("*")
            .eq("user_id", profile.id)
            .in("status", ["approved", "pending", "rejected"])
            .order("created_at", { ascending: false }),
        ]);

        if (storeRes.data) {
          setStoreProductIds(
            storeRes.data.map((i: { product_id: string }) => i.product_id),
          );
        } else {
          const stored = localStorage.getItem(`mz_store_${profile.id}`);
          if (stored) setStoreProductIds(JSON.parse(stored));
        }

        if (statsRes.data) setProductStats(statsRes.data as ProductStat[]);
        if (commsRes.data) setCommissions(commsRes.data as Commission[]);
      }
    } catch {
      console.warn("Store sync failed, using fallback");
    }
  };

  const handleImport = async (productId: string) => {
    if (!profile?.id) return;

    // Check limit for standard users
    if (profile.user_level === "standard" && storeProductIds.length >= 5) {
      setFeedback(
        "Limite de 5 produits atteinte pour le niveau standard. Passez Premium pour l'illimité ! 🚀",
      );
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    setImportingId(productId);

    const addedProduct = products.find((p) => p.id === productId);

    try {
      const newStore = [...storeProductIds, productId];

      try {
        await supabase
          .from("mz_user_store")
          .upsert({ user_id: profile.id, product_id: productId });
      } catch (e) {
        console.error("DB error", e);
      }

      localStorage.setItem(`mz_store_${profile.id}`, JSON.stringify(newStore));
      setStoreProductIds(newStore);

      if (addedProduct) {
        setActiveSegment("my_products");
        setShowAllProducts(true); // Force show all to guarantee rendering

        // Envoi de la notification Push via le service client
        const fcmToken = localStorage.getItem('fcm_token') || profile.fcm_token;
        if (fcmToken) {
           import('../../../services/notificationService.client.ts').then(service => {
             service.notifyProductImported(fcmToken, addedProduct.name);
           }).catch(err => console.warn("Failed to load notification service:", err));
        }

        // Wait for AnimatePresence mode="wait" to finish the exit animation of catalog
        // We'll wait 500ms to be absolutely sure the DOM has remounted `myProducts`.
        await new Promise((r) => setTimeout(r, 500));

        setAddingProduct(addedProduct);

        setTimeout(() => {
          const el = document.getElementById(
            `store-product-${addedProduct.id}`,
          );
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            window.scroll({ top: 300, behavior: "smooth" });
          }
        }, 100);

        await new Promise((r) => setTimeout(r, 4000));
        setAddingProduct(null);

        // Let Axis show the final congrats if they need to, but also show the CelebrationOverlay (only once)
        if (
          sessionStorage.getItem("mz_axis_guide_active") === "true" &&
          !sessionStorage.getItem("mz_celebration_shown_once")
        ) {
          sessionStorage.setItem("mz_celebration_shown_once", "true");
          playDopamineHit();
          setCelebratedProduct(addedProduct);
        } else {
          setFeedback("Propulsé dans ta boutique ! 🚀");
          setTimeout(() => setFeedback(null), 2500);
          window.dispatchEvent(new CustomEvent("mz-product-added-to-store"));
        }
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setFeedback("Propulsé dans ta boutique ! 🚀");
        setTimeout(() => setFeedback(null), 2500);
        setTimeout(() => {
          setActiveSegment("my_products");
          window.dispatchEvent(new CustomEvent("mz-product-added-to-store"));
        }, 800);
      }
    } finally {
      setImportingId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    if (!profile?.id || removingId === productId) return;

    // Optimistic UI update
    const newStore = storeProductIds.filter((id) => id !== productId);

    setRemovingId(productId);

    try {
      // Local updates first for instant feedback
      setStoreProductIds(newStore);
      localStorage.setItem(`mz_store_${profile.id}`, JSON.stringify(newStore));

      setFeedback("Produit retiré de ta boutique. 🗑️");
      setTimeout(() => setFeedback(null), 2500);

      // Backend sync
      const { error } = await supabase
        .from("mz_user_store")
        .delete()
        .eq("user_id", profile.id)
        .eq("product_id", productId);

      if (error) throw error;
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      // Fallback: restore previous state if DB delete definitely failed
      // But for a "remove" action, often users prefer it stays removed locally
      // setStoreProductIds(previousStore);
      setFeedback("Erreur de synchro, mais retiré localement.");
    } finally {
      setRemovingId(null);
    }
  };

  const myProducts = storeProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);
  const availableToImport = products.filter(
    (p) =>
      !storeProductIds.includes(p.id) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-24 bg-[#0f0f12] min-h-screen max-w-full overflow-x-hidden">
      <AnimatePresence>
        {celebratedProduct && (
          <CelebrationOverlay
            product={celebratedProduct}
            onClose={() => {
              setCelebratedProduct(null);
              window.dispatchEvent(
                new CustomEvent("mz-product-added-to-store"),
              );
            }}
          />
        )}
      </AnimatePresence>
      {/* HEADER SECTION */}
      <div className="px-6 sm:px-8 pt-14 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">
            Ma Boutique
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
            <p className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase">
              Moteur de Revenus
            </p>
          </div>
        </div>

        {activeSegment === "import_catalog" ? (
          <button
            onClick={() => setActiveSegment("my_products")}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-xl"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
        ) : activeSegment === "stats" ? (
          <button
            onClick={() => {
              setActiveSegment("my_products");
              setStatProductId(null);
            }}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-xl"
          >
            <X size={20} />
          </button>
        ) : (
          <div className="relative">
            {customizationEnabled ? (
              <button
                onClick={() => setShowManageDropdown(!showManageDropdown)}
                className="group flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-bold shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Settings
                    size={18}
                    className={`transition-transform duration-300 ${showManageDropdown ? "rotate-90" : "group-hover:rotate-45"}`}
                  />
                </div>
                <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest group-hover:text-white transition-colors">
                  Paramètres
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setStatProductId(null);
                  setActiveSegment("stats");
                }}
                className="group flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-bold shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <BarChart3
                    size={18}
                    className="text-white transition-transform group-hover:scale-110"
                  />
                </div>
                <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest group-hover:text-white transition-colors">
                  Stats
                </span>
              </button>
            )}

            <AnimatePresence>
              {showManageDropdown && customizationEnabled && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowManageDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-3 w-56 bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
                  >
                    <button
                      onClick={() => {
                        setStatProductId(null);
                        setActiveSegment("stats");
                        setShowManageDropdown(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-white/80 hover:text-white border-b border-white/5 text-sm font-bold text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <BarChart3
                          size={14}
                          className="text-white/60 group-hover:text-white transition-colors"
                        />
                      </div>
                      Statistiques
                    </button>
                    <button
                      onClick={() => {
                        setShowPublicStore(true);
                        setShowManageDropdown(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-emerald-500/10 transition-colors text-emerald-500 border-b border-white/5 text-sm font-bold text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <Eye size={14} className="text-emerald-500" />
                      </div>
                      Voir ma boutique
                    </button>
                    <button
                      onClick={() => {
                        const storeLink = `${window.location.origin}/?store=${profile?.referral_code}`;
                        navigator.clipboard.writeText(storeLink);
                        alert("Lien de boutique copié dans le presse-papier !");
                        setShowManageDropdown(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-orange-500/10 transition-colors text-orange-500 border-b border-white/5 text-sm font-bold text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                        <Copy size={14} className="text-orange-500" />
                      </div>
                      Copier mon lien
                    </button>
                    <button
                      onClick={() => {
                        setShowSettings(true);
                        setShowManageDropdown(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#6366f1]/10 transition-colors text-[#6366f1] text-sm font-bold text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#6366f1]/10 flex items-center justify-center group-hover:bg-[#6366f1]/20 transition-colors">
                        <Settings size={14} className="text-[#6366f1]" />
                      </div>
                      Personnaliser
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* MINIMAL STATS STRIP */}
      {activeSegment !== "stats" &&
        activeSegment !== "product_analysis" &&
        activeSegment !== "import_catalog" && (
          <div className="px-6 sm:px-8">
            <div className="bg-[#12121a] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-stretch overflow-hidden shadow-2xl divide-y sm:divide-y-0 sm:divide-x divide-white/10 relative">
              {/* VISITS */}
              <div className="flex-1 p-4 sm:p-5 hover:bg-white/[0.02] transition-colors group relative flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white/60 transition-colors">
                    Visites
                  </span>
                  <TrendingUp
                    size={12}
                    className="text-white/20 group-hover:text-[#6366f1] transition-colors"
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white tracking-tighter">
                    {totalVisits.toLocaleString()}
                  </span>
                  {totalVisits > 0 && (
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <TrendingUp size={8} /> +
                      {(5 + (totalVisits % 15)).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              {/* TOTAL SALES */}
              <div className="flex-1 p-4 sm:p-5 hover:bg-white/[0.02] transition-colors group relative flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-emerald-500 transition-colors">
                    Ventes Totales
                  </span>
                  <Target
                    size={12}
                    className="text-white/20 group-hover:text-emerald-500 transition-colors"
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white tracking-tighter">
                    {totalSales}
                  </span>
                  <span className="text-[9px] font-bold text-white/30 hidden lg:inline-block">
                    Taux {conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* REVENUE */}
              <div className="flex-[1.5] p-4 sm:p-5 bg-gradient-to-r from-[#d5aa52]/5 to-transparent hover:from-[#d5aa52]/10 transition-colors group relative flex flex-col justify-center">
                <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                  <Zap size={32} className="text-[#d5aa52]" />
                </div>
                <div className="flex items-center justify-between mb-1 relative z-10">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d5aa52]/70 group-hover:text-[#d5aa52] transition-colors">
                    Revenus Générés
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatProductId(null);
                      setActiveSegment("stats");
                    }}
                    className="text-[9px] font-black uppercase tracking-wider text-[#d5aa52]/50 hover:text-[#d5aa52] transition-colors flex items-center gap-1 cursor-pointer bg-[#d5aa52]/10 hover:bg-[#d5aa52]/20 px-2 py-0.5 rounded"
                  >
                    Détails <BarChart3 size={10} />
                  </button>
                </div>
                <div className="flex items-baseline gap-1.5 relative z-10">
                  <CurrencyDisplay
                    amount={netRevenue}
                    className="text-2xl sm:text-3xl font-black text-white tracking-tighter italic"
                    hideSymbol
                  />
                  <span className="text-lg font-black text-[#d5aa52]/50 italic">
                    F
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* CONTENT AREA */}
      <div className="px-6 sm:px-8 flex-1">
        <AnimatePresence mode="wait">
          {activeSegment === "product_analysis" && statProductId ? (
            (() => {
              const analyzedProduct = products.find(
                (p) => p.id === statProductId,
              );
              if (!analyzedProduct) return null;
              return (
                <motion.div
                  key="product_analysis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* HEADER */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-white/30 italic">
                        Analyse Produit
                      </h2>
                      <p className="text-[10px] uppercase text-white/20 mt-1">
                        Impact direct en temps réel
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveSegment("my_products");
                        setStatProductId(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 text-white/40 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-white/10 border border-white/5"
                    >
                      Retour
                    </button>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-[24px] overflow-hidden">
                    {/* PRODUCT HEADER COMPACT */}
                    <div className="flex items-center gap-4 p-5 sm:p-6 border-b border-white/5 bg-white/[0.01]">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/5">
                        <img
                          src={analyzedProduct.image_url}
                          alt={analyzedProduct.name}
                          className="w-full h-full object-cover opacity-80"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-white truncate mb-1.5">
                          {analyzedProduct.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#10b981]/10 text-[9px] font-black tracking-widest text-[#10b981] uppercase border border-[#10b981]/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></div>{" "}
                            Active
                          </span>
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider py-1 px-2 rounded bg-white/5 border border-white/10">
                            Tu gagnes{" "}
                            <CurrencyDisplay
                              amount={analyzedProduct.commission_amount}
                            />{" "}
                            par vente
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* COMPACT STATS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
                      <div className="p-5 flex flex-col justify-center hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye size={12} className="text-[#6366f1]" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                            Clics
                          </span>
                        </div>
                        <div className="text-2xl font-black text-white">
                          {totalVisits.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-5 flex flex-col justify-center hover:bg-white/[0.02] transition-colors border-l border-white/5 sm:border-l-0">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingBasket
                            size={12}
                            className="text-[#10b981]"
                          />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                            Ventes
                          </span>
                        </div>
                        <div className="text-2xl font-black text-white">
                          {totalSales}
                        </div>
                      </div>
                      <div className="p-5 flex flex-col justify-center hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={12} className="text-orange-500" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                            Taux
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <div className="text-2xl font-black text-white">
                            {conversionRate.toFixed(1)}
                          </div>
                          <span className="text-sm font-bold text-white/30">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col justify-center bg-gradient-to-br from-[#d5aa52]/5 to-transparent border-l border-white/5 sm:border-l-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap size={12} className="text-[#d5aa52]" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#d5aa52]/80">
                            Gains
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <CurrencyDisplay
                            amount={netRevenue}
                            hideSymbol
                            className="text-2xl font-black text-[#d5aa52]"
                          />
                          <span className="text-sm font-bold text-[#d5aa52]/40 italic">
                            F
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()
          ) : activeSegment === "stats" ? (
            <StoreStats profile={profile} initialProductId={statProductId} />
          ) : activeSegment === "my_products" ? (
            <motion.div
              key="my_assets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {myProducts.length === 0 ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 flex items-center justify-center mx-auto relative">
                      <svg
                        width="100"
                        height="100"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-2xl"
                      >
                        <rect
                          x="40"
                          y="25"
                          width="20"
                          height="15"
                          fill="#E87C41"
                          rx="2"
                        />
                        <text
                          x="50"
                          y="37"
                          fill="white"
                          fontSize="11"
                          fontWeight="900"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          24
                        </text>
                        <rect
                          x="25"
                          y="42"
                          width="50"
                          height="5"
                          fill="#6B9F65"
                        />
                        <rect
                          x="25"
                          y="47"
                          width="50"
                          height="8"
                          fill="#88C1E4"
                        />
                        <rect
                          x="22"
                          y="44"
                          width="56"
                          height="3"
                          fill="#E2E8F0"
                        />
                        <rect
                          x="28"
                          y="55"
                          width="44"
                          height="25"
                          fill="#E0E3E7"
                        />
                        <rect
                          x="42"
                          y="55"
                          width="16"
                          height="25"
                          fill="#58B8D2"
                        />
                        <rect
                          x="49.5"
                          y="55"
                          width="1"
                          height="25"
                          fill="#C4C9CF"
                        />
                        <rect
                          x="32"
                          y="58"
                          width="8"
                          height="12"
                          fill="#CFD4D9"
                        />
                        <rect
                          x="60"
                          y="58"
                          width="8"
                          height="12"
                          fill="#CFD4D9"
                        />
                        <rect
                          x="26"
                          y="80"
                          width="48"
                          height="5"
                          fill="#9BA1A7"
                        />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-[26px] font-bold text-white tracking-tight mb-4">
                    Ta boutique est vide
                  </h3>
                  <p className="text-[15px] text-white/40 max-w-[320px] leading-relaxed mb-10 font-normal">
                    Ajoute ton premier produit pour commencer à générer tes
                    premières commissions
                  </p>

                  <button
                    id="add-product-btn-empty"
                    onClick={() => {
                      setActiveSegment("import_catalog");
                      setIsAddProductHighlighted(false);
                      window.dispatchEvent(
                        new CustomEvent("mz-catalog-opened"),
                      );
                    }}
                    className={`w-full max-w-[320px] py-[18px] rounded-[30px] font-black text-[16px] flex items-center justify-center gap-3 transition-all duration-700 active:scale-95 ${
                      isAddProductHighlighted
                        ? "bg-[#d5aa52]/20 text-[#d5aa52] border-2 border-[#d5aa52] ring-4 ring-[#d5aa52]/40 ring-offset-4 ring-offset-[#050505] shadow-[0_0_50px_rgba(213,170,82,0.8)] scale-105 animate-[pulse_1.5s_ease-in-out_infinite] z-50"
                        : "bg-[#d5aa52] text-[#121212] hover:bg-[#ebd281]"
                    }`}
                  >
                    {isAddProductHighlighted && (
                      <div className="absolute inset-0 rounded-[30px] border border-[#d5aa52] animate-[ping_2s_ease-in-out_infinite] opacity-100"></div>
                    )}
                    <Plus
                      size={22}
                      strokeWidth={3}
                      className={
                        isAddProductHighlighted ? "text-[#d5aa52]" : ""
                      }
                    />{" "}
                    Ajouter un produit
                  </button>
                </div>
              ) : (
                <div className="space-y-10 mt-4">
                  <div className="flex items-center justify-between opacity-30 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                      Mes Actifs Privés
                    </span>
                    <span className="text-[10px] font-black italic">
                      {myProducts.length} ARTICLES
                    </span>
                  </div>
                  {(showAllProducts ? myProducts : myProducts.slice(0, 3)).map(
                    (product, idx) => (
                      <motion.div
                        id={`store-product-${product.id}`}
                        key={product.id}
                        className={`group transition-all pb-6 border-b border-white/[0.08] last:border-0 last:pb-0 relative ${addingProduct?.id === product.id ? "z-10 bg-emerald-900/20 p-4 rounded-3xl -mx-4" : ""}`}
                        {...(addingProduct?.id === product.id
                          ? {
                              initial: { opacity: 0, scale: 0.8, x: -50 },
                              animate: { opacity: 1, scale: 1, x: 0 },
                              transition: {
                                type: "spring",
                                stiffness: 200,
                                damping: 20,
                              },
                            }
                          : {})}
                      >
                        {addingProduct?.id === product.id && (
                          <div className="absolute -inset-1 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-3xl animate-[pulse_1.5s_ease-in-out_infinite] pointer-events-none flex items-center justify-end pr-4 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                            <span className="text-emerald-400 font-black text-[12px] tracking-widest uppercase bg-emerald-900/80 px-3 py-1.5 rounded-full border border-emerald-500/50 shadow-xl flex items-center gap-2">
                              Produit Ajouté{" "}
                              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                            </span>
                          </div>
                        )}
                        <div className="flex gap-4 sm:gap-6 items-start relative z-10">
                          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-[18px] overflow-hidden bg-black shrink-0 border border-white/5 relative">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="text-[15px] sm:text-[17px] font-bold text-white tracking-tight truncate pr-2">
                                {product.name}
                              </h4>
                              <button
                                onClick={() => handleRemove(product.id)}
                                disabled={removingId === product.id}
                                className="p-1.5 rounded-lg text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0 -mt-1"
                              >
                                {removingId === product.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-4">
                              <span className="text-[13px] font-bold text-[#d5aa52]">
                                Gagne jusqu'à{" "}
                                <CurrencyDisplay
                                  amount={product.commission_amount}
                                  className="inline"
                                />{" "}
                                par vente
                              </span>
                              <span className="inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 text-[10px] font-bold text-[#10b981]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></div>
                                Actif
                              </span>
                            </div>

                            <div className="flex gap-3 mt-2 sm:mt-0 max-w-sm">
                              <button
                                onClick={() => {
                                  setShareProduct(product);
                                  setIsPromoteHighlighted(false);
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] font-bold text-[13px] transition-all active:scale-95 ${
                                  idx === 0 && isPromoteHighlighted
                                    ? "mz-highlighted-btn bg-[#10b981] border-2 border-[#10b981] text-black shadow-[0_0_30px_rgba(16,185,129,0.5)] ring-4 ring-[#10b981]/30 animate-[pulse_1.5s_ease-in-out_infinite] scale-[1.02] z-20 relative"
                                    : "bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#818cf8] hover:bg-[#6366f1]/20"
                                }`}
                              >
                                <Megaphone size={14} /> Promouvoir
                              </button>
                              <button
                                onClick={() => {
                                  setStatProductId(product.id);
                                  setActiveSegment("product_analysis");
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] bg-[#10b981]/10 border border-[#10b981]/20 text-[#34d399] font-bold text-[13px] hover:bg-[#10b981]/20 transition-all active:scale-95"
                              >
                                <BarChart3 size={14} /> Analyser
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ),
                  )}

                  {myProducts.length > 3 && !showAllProducts && (
                    <button
                      onClick={() => setShowAllProducts(true)}
                      className="w-full py-4 text-center rounded-[20px] bg-white/[0.02] border border-white/5 text-[11px] font-black tracking-widest uppercase text-white/40 hover:text-white hover:bg-white/5 transition-all mt-4 mb-4"
                    >
                      Voir plus ({myProducts.length - 3})
                    </button>
                  )}

                  {/* ADD PRODUCT BUTTON AT THE END OF LIST */}
                  <button
                    id="add-product-btn"
                    onClick={() => {
                      setActiveSegment("import_catalog");
                      setIsAddProductHighlighted(false);
                      window.dispatchEvent(
                        new CustomEvent("mz-catalog-opened"),
                      );
                    }}
                    className={`w-full h-24 rounded-[32px] flex items-center justify-center gap-4 transition-all duration-700 group active:scale-[0.98] ${
                      isAddProductHighlighted
                        ? "bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 ring-4 ring-emerald-500/40 ring-offset-4 ring-offset-[#050505] shadow-[0_0_50px_rgba(16,185,129,0.8)] scale-[1.02] z-50 animate-[pulse_1.5s_ease-in-out_infinite]"
                        : "bg-white/[0.02] border-2 border-dashed border-white/[0.05] text-white/20 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                    }`}
                  >
                    {isAddProductHighlighted && (
                      <div className="absolute inset-0 rounded-[32px] border border-emerald-500 animate-[ping_2s_ease-in-out_infinite] opacity-100"></div>
                    )}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAddProductHighlighted ? "bg-emerald-500 text-black" : "bg-white/5 group-hover:bg-emerald-500 group-hover:text-black"}`}
                    >
                      <Plus size={20} strokeWidth={3} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">
                      Ajouter un produit
                    </span>
                  </button>

                  <DynamicPremiumUpsell
                    totalSales={totalSales}
                    totalVisits={totalVisits}
                    productsInStore={products}
                    onUpgradeClick={() => onSwitchTab?.("flash_offer")}
                  />

                  <LiveCommissionsFeed products={products} />

                  {/* FAQ Section */}
                  <StoreFAQ />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[150] bg-[#0f0f12] overflow-y-auto flex flex-col"
            >
              <div className="sticky top-0 z-10 bg-[#0f0f12]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <Store size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">
                      Import d'Actifs
                    </h2>
                    <p className="text-[10px] uppercase text-white/40 tracking-[0.2em]">
                      Ajoutez des produits à votre boutique
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSegment("my_products")}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-8">
                <div className="relative max-w-2xl mx-auto">
                  <Search
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="RECHERCHER UN ACTIF..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-14 pr-6 text-sm font-bold uppercase tracking-widest text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableToImport.map((product, idx) => (
                    <div
                      key={product.id}
                      className="flex gap-4 items-center bg-[#12121a] p-4 rounded-3xl border border-white/5 group hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedCatalogProduct(product);
                        window.dispatchEvent(
                          new CustomEvent("mz-product-details-opened"),
                        );
                      }}
                    >
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black shrink-0 shadow-lg relative">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-sm font-black text-white uppercase truncate mb-1">
                          {product.name}
                        </h4>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 w-fit px-2 py-0.5 rounded-md mb-2">
                          +
                          <CurrencyDisplay
                            amount={product.commission_amount}
                            className="inline px-1"
                          />{" "}
                          COM
                        </p>
                        <button
                          id={
                            idx === 0 ? "first-catalog-product-btn" : undefined
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCatalogProduct(product);
                            window.dispatchEvent(
                              new CustomEvent("mz-product-details-opened"),
                            );
                          }}
                          disabled={importingId === product.id}
                          className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            idx === 0 && isAddFirstProductHighlighted
                              ? "bg-[#10b981] text-black border-2 border-[#10b981] ring-4 ring-[#10b981]/40 ring-offset-4 ring-offset-[#050505] shadow-[0_0_30px_rgba(16,185,129,0.8)] scale-[1.02] animate-[pulse_1.5s_ease-in-out_infinite]"
                              : "border border-white/10 text-white hover:bg-emerald-500 hover:text-black hover:border-emerald-500"
                          }`}
                        >
                          {idx === 0 && isAddFirstProductHighlighted && (
                            <div className="absolute inset-0 rounded-xl border border-emerald-500 animate-[ping_2s_ease-in-out_infinite] opacity-100"></div>
                          )}
                          {importingId === product.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <Plus size={14} strokeWidth={3} /> Ajouter
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {availableToImport.length === 0 && (
                  <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4">
                      <Search size={32} />
                    </div>
                    <p className="text-sm font-bold text-white/40 uppercase tracking-widest">
                      Aucun résultat
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedCatalogProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCatalogProduct(null)}
              className="fixed inset-0 z-[190] bg-[#0f0f12]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[200] pt-5 pb-8 sm:p-8 px-5 bg-[#16161a] border-t border-white/10 rounded-t-[32px] shadow-[0_-20px_40px_rgba(0,0,0,0.8)] max-h-[85svh] sm:max-h-[85vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-b-full"></div>
              <div className="max-w-xl mx-auto flex flex-col gap-5 mt-4 pb-10">
                <div className="flex justify-between items-start gap-4 flex-shrink-0">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black border border-white/5 overflow-hidden shrink-0 shadow-2xl">
                      <img
                        src={selectedCatalogProduct.image_url}
                        alt={selectedCatalogProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-lg sm:text-xl font-black text-white italic uppercase leading-tight line-clamp-2">
                        {selectedCatalogProduct.name}
                      </h4>
                      <p className="text-[10px] sm:text-[12px] font-bold text-emerald-500 tracking-[0.2em] mt-2 bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
                        +
                        <CurrencyDisplay
                          amount={selectedCatalogProduct.commission_amount}
                          className="inline px-1"
                        />{" "}
                        COM
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCatalogProduct(null)}
                    className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-3 mt-2 flex-shrink-0">
                  <button
                    id="add-to-my-store-btn"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("mz-product-adding-to-store"),
                      );
                      handleImport(selectedCatalogProduct.id);
                      setSelectedCatalogProduct(null);
                      setIsAddProductToStoreHighlighted(false);
                    }}
                    className={`w-full py-4 sm:py-5 rounded-[20px] font-black uppercase tracking-[0.2em] text-[12px] sm:text-[13px] flex items-center justify-center gap-3 transition-all min-h-[50px] relative ${
                      isAddProductToStoreHighlighted
                        ? "bg-[#10b981] text-black border-2 border-[#10b981] ring-4 ring-[#10b981]/40 ring-offset-4 ring-offset-[#16161a] shadow-[0_0_50px_rgba(16,185,129,0.8)] scale-105 animate-[pulse_1.5s_ease-in-out_infinite] z-50"
                        : "bg-emerald-500 text-black shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:bg-emerald-400 active:scale-95"
                    }`}
                  >
                    {isAddProductToStoreHighlighted && (
                      <div className="absolute inset-0 rounded-[20px] border-2 border-emerald-500 animate-[ping_2s_ease-in-out_infinite] opacity-100"></div>
                    )}
                    <Plus size={20} strokeWidth={3} /> Ajouter à ma boutique
                  </button>

                  <button
                    onClick={() => {
                      setDetailViewProduct(selectedCatalogProduct);
                      setSelectedCatalogProduct(null);
                    }}
                    className="w-full py-4 sm:py-5 rounded-[20px] bg-white/[0.03] border border-white/5 text-white/80 font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[11px] sm:text-[13px] flex items-center justify-center gap-3 hover:bg-white/10 hover:text-white active:scale-95 transition-all min-h-[50px]"
                  >
                    <Eye size={20} className="text-white/40" /> Voir les détails
                    du produit
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[400]"
          >
            <div className="bg-emerald-500 text-black px-10 py-5 rounded-full shadow-[0_20px_60px_rgba(16,185,129,0.4)] flex items-center gap-4">
              <Zap size={18} fill="currentColor" />
              <p className="text-[12px] font-black uppercase tracking-[0.2em]">
                {feedback}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailViewProduct && (
          <ProductDetailView
            product={detailViewProduct}
            stats={{ clicks: 0, conversions: 0 }}
            referralCode={profile?.referral_code || "elite"}
            onBack={() => setDetailViewProduct(null)}
            index={0}
            isImported={storeProductIds.includes(detailViewProduct.id)}
            onAddToStore={() => handleImport(detailViewProduct.id)}
          />
        )}
      </AnimatePresence>

      {shareProduct && profile && (
        <ShareModal
          isOpen={!!shareProduct}
          onClose={() => setShareProduct(null)}
          product={shareProduct}
          link={`${window.location.origin}/?ref=${profile.referral_code}&prod=${shareProduct.id}`}
        />
      )}

      {/* PUBLIC STOREFRONT */}
      <AnimatePresence>
        {showPublicStore && (
          <PublicStorefront
            products={myProducts}
            onClose={() => setShowPublicStore(false)}
            storeName={
              storePreferences?.name ||
              (profile?.full_name ? `${profile.full_name} Shop` : "Shop Privé")
            }
            referralCode={profile?.referral_code}
            preferences={storePreferences}
          />
        )}
      </AnimatePresence>

      <StoreSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={profile?.id || ""}
        initialPreferences={storePreferences}
        onSave={(prefs) => {
          setStorePreferences(prefs);
          if (onRefresh) onRefresh();
        }}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1); }
      `,
        }}
      />
    </div>
  );
};
