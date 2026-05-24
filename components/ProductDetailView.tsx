import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Zap, TrendingUp, User, Coins, Target, MessageCircle, Activity, Sparkles, Clock, Share2, X, Facebook, Check, Link as LinkIcon, Store, Eye 
} from 'lucide-react';
import { Product } from '../types.ts';
import { useAxis } from './features/axis/AxisProvider.tsx';

const ShareModal = ({ isOpen, onClose, product, link }: { isOpen: boolean, onClose: () => void, product: Product, link: string }) => {
  const [copied, setCopied] = useState(false);

  const shareTitle = `Découvre : ${product.name} sur MZ+ Elite`;
  const shareText = `Je te recommande ce service sur MZ+ Elite : ${product.name}.\nC'est vraiment top pour booster tes activités !\n\nLien direct 👇\n${link}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'gmail':
        url = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText)}`;
        break;
    }
    if (url) window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30"></div>
        
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
                 <Share2 size={18} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-tighter">Partager le produit</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={20} />
           </button>
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-4">
              <img src={product.image_url} className="w-16 h-16 rounded-2xl object-cover border border-white/10" alt="" />
              <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-black uppercase text-yellow-500 leading-none mb-1">Elite Product</p>
                 <h4 className="text-sm font-black text-white uppercase italic truncate tracking-tight">{product.name}</h4>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 pb-2">
              <button 
                onClick={() => handleShare('whatsapp')}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/10 hover:bg-emerald-500/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.548 0 10.058-4.51 10.06-10.059.002-2.689-1.047-5.215-2.951-7.121-1.905-1.905-4.432-2.954-7.122-2.956-5.549 0-10.06 4.511-10.063 10.06-.001 2.032.547 3.513 1.488 5.13l-.999 3.648 3.731-.979zm11.367-7.393c-.31-.154-1.829-.903-2.11-.1.282-.102-.338-.204-.984-1.392-.506-.21-.422-.224-.744-.095-.547-.223-2.01-.739-3.344-1.928-1.037-.926-1.74-2.069-1.942-2.422-.204-.353-.021-.544.155-.72.158-.159.352-.412.529-.617.175-.206.234-.352.352-.588.117-.235.059-.441-.03-.617-.089-.176-.744-1.792-1.018-2.454-.267-.643-.538-.556-.744-.567-.19-.009-.41-.01-.63-.01-.22 0-.58.083-.884.412-.303.33-1.157 1.132-1.157 2.76 0 1.629 1.186 3.203 1.353 3.424.167.221 2.335 3.563 5.656 4.996.79.341 1.405.544 1.886.696.791.248 1.512.213 2.081.127.635-.095 1.829-.747 2.086-1.468.257-.721.257-1.341.18-1.468-.077-.127-.282-.204-.593-.352z"/></svg>
                </div>
                <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">WhatsApp</span>
              </button>

              <button 
                onClick={() => handleShare('facebook')}
                className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-blue-500/10 border border-blue-500/10 hover:bg-blue-500/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <Facebook size={18} />
                </div>
                <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Facebook</span>
              </button>

              {navigator.share && (
                <button 
                  onClick={() => {
                    navigator.share({
                      title: shareTitle,
                      text: shareText,
                      url: link
                    }).catch(console.error);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Share2 size={18} />
                  </div>
                  <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Autres</span>
                </button>
              )}
           </div>

           {/* Prominent Copy Link Section */}
           <div className="pt-4 border-t border-white/5 space-y-3">
              <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest ml-1">Copier le Lien Affilié</p>
              <div className="flex items-center gap-2 p-2 bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                 <div className="flex-1 px-3 py-1.5 font-mono text-[9px] text-neutral-500 truncate lowercase">
                    {link}
                 </div>
                 <button 
                   onClick={handleCopy}
                   className={`px-5 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
                     copied ? 'bg-emerald-600 text-white' : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg'
                   }`}
                 >
                   {copied ? <Check size={12} strokeWidth={3} /> : <LinkIcon size={12} strokeWidth={3} />}
                   <span>{copied ? 'Copié' : 'Copier'}</span>
                 </button>
              </div>
           </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
           <p className="text-[7px] font-bold text-neutral-600 uppercase tracking-[0.3em]">Copiez votre lien unique pour gagner des commissions</p>
        </div>
      </motion.div>
    </div>
  );
};

// Smart Strategic Trend Simulation
export const getProductTrend = (product: Product, index: number) => {
  const now = new Date();
  const dateString = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  
  const hashString = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return Math.abs(h);
  };

  const baseHash = hashString(`${product.id}-base`);
  const dailyHash = hashString(`${product.id}-${dateString}`);
  
  // Popularity tier from 1 to 5 to avoid extreme values
  const popularityMultiplier = (baseHash % 5) + 1; 
  
  // Keep total sales initialized well under 100
  const historicalSales = 10 + (baseHash % 50); // 10 to ~59

  // Today's target sales (logical small numbers to stay realistic)
  const targetSalesToday = (dailyHash % 15) + popularityMultiplier * 2; // 2 to 25

  // Progression of the day based on local time to reset precisely at midnight
  const hoursElapsed = now.getHours() + now.getMinutes() / 60;
  const fractionOfDay = hoursElapsed / 24;
  const salesCurve = Math.pow(fractionOfDay, 1.2); 
  
  // Starts at 0 exactly at midnight
  const salesToday = Math.floor(targetSalesToday * salesCurve);
  const totalSales = historicalSales + salesToday;

  // Viewers currently active
  const peakTimeMultiplier = 0.5 + 0.5 * Math.max(
    Math.exp(-Math.pow(hoursElapsed - 12, 2) / 8),
    Math.exp(-Math.pow(hoursElapsed - 19, 2) / 8)
  );
  
  const baseViewers = popularityMultiplier * 3 + (dailyHash % 10);
  const minuteHash = hashString(`${product.id}-${now.getMinutes()}`);
  const viewersNow = Math.floor(baseViewers * peakTimeMultiplier) + (minuteHash % 4) + 2;

  const isPositive = (dailyHash % 10) < 8; // 80% chance
  const percentage = (dailyHash % 18) + 8; // 8% to 25% growth
  const isTopSeller = popularityMultiplier >= 4 && (dailyHash % 5 === 0);

  // Dynamic strategic messages from user request
  const phrases = [
    "🔥 Ça vend fort aujourd’hui… et si c’était ton tour ?",
    "💸 Certains font déjà des ventes avec ce produit…",
    "🚀 Ce produit commence vraiment à marcher en ce moment",
    "📈 Les ventes montent doucement… tu peux en faire partie",
    "👥 De plus en plus de personnes s’y mettent…",
    "🤑 Il y a de l’argent qui circule ici…",
    "🔥 Explosion des ventes aujourd’hui grâce à ce produit",
    "🚀 Ce produit décolle en ce moment",
    "💸 Des utilisateurs génèrent des commissions chaque heure grâce à ce produit",
    "🎯 Simple à promouvoir… parfait pour commencer",
    "💰 D’autres gagnent déjà avec… pourquoi pas toi ?",
    "⚡ Ça bouge beaucoup sur ce produit en ce moment",
    "⭐ Beaucoup commencent par celui-ci…",
    "🔄 Les ventes continuent… tranquillement mais sûrement",
    "🚨 Ça prend de l’ampleur… c’est peut-être le bon moment"
  ];

  let dynamicMessage = phrases[dailyHash % phrases.length];
  
  // Priority overlays
  if (isTopSeller) {
    dynamicMessage = "🏆 Produit le plus vendu";
  } else if (percentage > 22) {
    dynamicMessage = "🔥 Explosion des ventes aujourd’hui grâce à ce produit";
  }

  // Final validation: if not positive, hide the message
  const finalMessage = isPositive ? dynamicMessage : null;

  return { isPositive, percentage, salesToday, totalSales, viewersNow, isTopSeller, dynamicMessage: finalMessage, absHash: dailyHash };
};

export const ProductDetailView = ({ product, stats, referralCode, onBack, index, onAddToStore, isImported = false }: { product: Product, stats: { clicks: number, conversions: number }, referralCode: string, onBack: () => void, index: number, onAddToStore?: () => void, isImported?: boolean }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const link = `${window.location.origin}/?ref=${referralCode}&prod=${product.id}`;
  const { triggerAxisMessage } = useAxis();
  
  const initialTrend = getProductTrend(product, index);
  const [trend, setTrend] = useState(initialTrend);
  const [livePulse, setLivePulse] = useState(false);
  const [liveSalesPulse, setLiveSalesPulse] = useState(false);

  // Live simulation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse(true);
      
      setTrend(prev => {
        // Flux of active viewers
        const viewChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const newViewers = Math.max(1, prev.viewersNow + viewChange);
        
        let newSalesToday = prev.salesToday;
        let newTotalSales = prev.totalSales;
        
        // Randomly simulate a sale (15% chance every 4-8 seconds)
        if (Math.random() > 0.85) {
           newSalesToday += 1;
           newTotalSales += 1;
           setLiveSalesPulse(true);
           setTimeout(() => setLiveSalesPulse(false), 2000);
        }

        return { ...prev, viewersNow: newViewers, salesToday: newSalesToday, totalSales: newTotalSales };
      });

      // Turn off viewers pulse early
      setTimeout(() => setLivePulse(false), 500);

    }, 4000 + Math.random() * 4000); // every 4-8 seconds

    return () => clearInterval(interval);
  }, []);

  const totalEarned = stats.conversions * product.commission_amount;

  return (
    <div className="fixed inset-0 z-[600] bg-black text-white flex flex-col font-sans">
      <div className="flex-1 overflow-x-hidden overflow-y-auto pb-32">
      {/* Optimized Background - High Performance Dopamine */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-500/5 via-rose-500/5 to-emerald-500/5"></div>
        <motion.div 
          animate={{ 
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(234,179,8,0.15)_0%,transparent_70%)] blur-[80px]"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      {/* Header Bar */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl px-6 py-5 flex items-center justify-between border-b border-white/5"
      >
         <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all active:scale-95 border border-white/5">
            <ArrowLeft size={20} />
         </button>
         <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_8px_#eab308] animate-pulse"></div>
              <p className="text-[7px] font-black uppercase text-yellow-500 tracking-[0.4em]">Flux de Profit Live</p>
            </div>
            <h2 className="text-[10px] font-black uppercase italic text-white tracking-widest opacity-80">Poste de Contrôle</h2>
         </div>
         <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
            <Zap size={18} fill="currentColor" />
         </div>
      </motion.div>

      <div className="relative z-10 p-6 md:p-10 space-y-8 max-w-2xl mx-auto w-full pb-32">
         
         {/* Refactored Product Hero - Smooth & Clean */}
         <div className="py-8 md:py-12 flex flex-col items-center text-center space-y-8 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 blur-[80px] -z-10"></div>
            
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ type: "spring", damping: 20 }}
               className="relative"
            >
               <motion.img 
                  animate={{ 
                    y: [0, -8, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  src={product.image_url} 
                  className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_15px_40px_rgba(234,179,8,0.25)]" 
                  alt="" 
               />
               {trend.isPositive && (
                 <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-lg shadow-xl uppercase tracking-tighter animate-bounce-gentle">
                   🔥 Tendance
                 </div>
               )}
            </motion.div>

            <div className="space-y-4">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex justify-center items-center gap-3"
               >
                  <div className="h-[1px] w-6 bg-yellow-500/30"></div>
                  <span className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.4em] italic">Opportunité Elite</span>
                  <div className="h-[1px] w-6 bg-yellow-500/30"></div>
               </motion.div>
               
               <motion.h3 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none"
               >
                 <span className="text-white drop-shadow-lg">{product.name}</span>
               </motion.h3>

               <div className="flex flex-wrap justify-center gap-6 pt-2">
                  <div className="text-center">
                     <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Ta Commission</p>
                     <p className="text-3xl md:text-5xl font-black text-emerald-400 font-mono italic tracking-tight">+{product.commission_amount.toLocaleString()} <span className="text-[10px]">FCFA</span></p>
                     <p className="text-[9px] font-bold text-neutral-400 mt-2 uppercase tracking-widest">Tu gagnes <span className="text-emerald-400 font-black">{product.commission_amount.toLocaleString()} FCFA</span> par vente sur ce produit</p>
                  </div>
                  <div className="w-px h-10 bg-white/5 self-center"></div>
                  <div className="text-center opacity-50">
                     <p className="text-[7px] font-black text-neutral-500 uppercase tracking-widest mb-1">Valeur Marchande</p>
                     <p className="text-xl md:text-2xl font-black text-white font-mono italic">{product.price.toLocaleString()} FCFA</p>
                  </div>
               </div>
            </div>
         </div>

          {/* IMMERSIVE DOPAMINE STATS - Not a card, an experience */}
         <section className="relative py-12">
            <div className="absolute inset-0 bg-yellow-500/5 blur-[100px] -z-10"></div>
            
            <div className="flex flex-col items-center text-center space-y-14">
               
               <div className="flex items-end justify-center w-full max-w-sm mx-auto">
                 <div className="flex-1 text-center">
                    <p className="text-[8px] font-black uppercase text-neutral-500 tracking-widest mb-1">Total</p>
                    <motion.span 
                      key={trend.totalSales}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-3xl font-black text-white italic tracking-tighter"
                    >
                       {trend.totalSales}
                    </motion.span>
                 </div>
                 
                 <div className="w-px h-12 bg-white/10 mx-2"></div>

                 <div className="flex-1 text-center relative">
                    <p className="text-[8px] font-black uppercase text-emerald-500 tracking-widest mb-1 flex items-center justify-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                       Aujourd'hui
                    </p>
                    <motion.span 
                      key={trend.salesToday}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-black text-emerald-500 italic tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    >
                       {trend.salesToday}
                    </motion.span>
                 </div>
               </div>

               <div className="bg-white/5 border border-white/5 rounded-full px-4 py-2 flex items-center justify-center gap-2 text-[9px] font-black text-white/70 uppercase tracking-widest shadow-[0_5px_20px_rgba(0,0,0,0.3)]">
                  <Activity size={12} className={livePulse ? 'text-blue-400 animate-pulse' : 'text-neutral-500'} />
                  {trend.viewersNow} personnes sur cette page
               </div>

               {/* Strategic Ticker / Dynamic Phrase */}
               {trend.dynamicMessage && (
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: 0.3 }}
                     className="w-full max-w-2xl px-6"
                  >
                     <div className="relative p-6 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 overflow-hidden group/phrase">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/phrase:animate-shimmer"></div>
                        <p className="text-xl md:text-2xl font-black text-white italic tracking-tighter text-center leading-tight">
                           "{trend.dynamicMessage}"
                        </p>
                     </div>
                  </motion.div>
               )}

               {/* Add to Store Button */}
               <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.5 }}
                 className="w-full max-w-2xl px-6 mt-6 pb-2"
               >
                  <button 
                    onClick={() => {
                       if (!isImported && onAddToStore) {
                           onAddToStore();
                           // triggerAxisMessage removed
                       } else if (!isImported) {
                           alert("Produit ajouté à votre boutique avec succès !");
                       }
                    }}
                    disabled={isImported}
                    className={`relative w-full py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] flex flex-col items-center justify-center gap-2 group overflow-hidden shadow-lg transition-all duration-300 ${
                       isImported 
                         ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default' 
                         : 'bg-gradient-to-br from-[#1A1814] to-[#0A0908] text-[var(--color-gold-main)] border border-[var(--color-border-gold)]/30 hover:border-[var(--color-gold-main)]/80 hover:shadow-[0_0_20px_rgba(201,168,76,0.15)] active:scale-[0.98]'
                    }`}
                  >
                     {!isImported && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-gold-main)]/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>}
                     <div className="flex items-center gap-2">
                        {isImported ? <Check size={18} strokeWidth={3} /> : <Store size={18} strokeWidth={3} />}
                        {isImported ? "Dans ma boutique" : "Ajouter à ma boutique"}
                     </div>
                  </button>
               </motion.div>


            </div>
         </section>
         </div>

         <div className="relative z-10 p-6 md:p-10 max-w-2xl mx-auto w-full">
            {/* THE MONEY MAKER - CENTRAL CALL TO ACTION */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="relative"
            >
               <div className="absolute -inset-4 bg-yellow-500/10 blur-3xl opacity-50 animate-pulse"></div>
               <button 
                 onClick={() => {
                   setIsShareModalOpen(true);
                 }}
                 className="relative w-full py-8 bg-white text-black rounded-[2.5rem] font-black uppercase text-base tracking-[0.3em] shadow-[0_30px_60px_rgba(255,255,255,0.15)] hover:bg-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex flex-col items-center justify-center gap-1 group overflow-hidden"
               >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                  <div className="flex items-center gap-3">
                     <Zap size={22} fill="currentColor" />
                     Générer de l'Argent Maintenant
                  </div>
                  <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">Lancez votre campagne de profit</span>
               </button>
            </motion.div>
         </div>

         {/* Share Modal Integration */}
         <ShareModal 
           isOpen={isShareModalOpen} 
           onClose={() => setIsShareModalOpen(false)} 
           product={product} 
           link={link} 
         />
      </div>{/* End of scroller flex-1 */}

      {/* Extreme Bottom Button (Fixed on mobile) */}
      <div className="fixed pb-safe pb-8 pt-10 bottom-0 left-0 w-full px-6 bg-gradient-to-t from-black via-black/95 to-transparent flex justify-center z-[650] pointer-events-none">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
               window.open(link, '_blank');
            }}
            className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 py-5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300 hover:text-white hover:bg-white/10 transition-all shadow-2xl pointer-events-auto flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            Prévisualiser le produit
          </motion.button>
      </div>
    </div>
  );
};

export { ShareModal };
