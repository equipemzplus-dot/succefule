import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../../types.ts';
import { CurrencyDisplay } from '../../ui/CurrencyDisplay.tsx';
import { Zap } from 'lucide-react';

const FIRST_NAMES = [
  "Amadou", "Mamadou", "Ousmane", "Awa", "Fatou", "Aminata", "Kofi", "Kwame", "Abdoulaye", "Cheikh",
  "Seydou", "Idrissa", "Kouamé", "Yao", "Aya", "Akissi", "Fanta", "Binta", "Mariam", "Ibrahim",
  "Moussa", "Aliou", "Hassan", "Khadija", "Ndeye", "Aissatou", "Saliou", "Lamine", "Malick", "Babacar",
  "Boubacar", "Youssouf", "Sekou", "Oumar", "Djibril", "Moustapha", "Salif", "Kadiatou", "Nanténin", "Hawa",
  "Assetou", "Kadi", "Zoumana", "Souleymane", "Modibo", "Lassina", "Oumou", "Djeneba", "Fatoumata", "Makhtar",
  "Pape", "Samba", "Demba", "Tidiane", "Assane", "Ousseynou", "Ababacar", "Madou", "Issa", "Ismael",
  "Mahamadou", "Bakary", "Sibiri", "Oumarou", "Kouassi", "Koffi", "Konan", "N'Guessan", "Kouadio", "Adjoua",
  "Amenan", "Ahou", "Affoué", "Amos", "Ezéchiel", "Samuel", "David", "Emmanuel", "Grâce", "Bénédicte",
  "Victoire", "Espérance", "Dieudonné", "Bienvenu", "Claver", "Evariste", "Félicien", "Eulalie", "Prisca", "Léocadie"
];

const LAST_INITIALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const ACTIONS = [
  "a vendu",
  "vient de vendre"
];

const xmur3 = (str: string) => {
    let h = 1779033703;
    for(let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
};

const sfc32 = (a: number, b: number, c: number, d: number) => {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      let t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
};

const generateSalesForDate = (date: Date, products: Product[]) => {
   if (products.length === 0) return [];
   
   // Sort deterministically
   const sortedProducts = [...products].sort((a,b) => a.id.localeCompare(b.id));
   
   const dateString = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
   const seed = xmur3(dateString);
   const rand = sfc32(seed(), seed(), seed(), seed());
   
   const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).getTime();
   const endOfDay = startOfDay + 24 * 3600000;
   const sales: LiveSale[] = [];
   
   let currentTime = startOfDay;
   let i = 0;
   
   while (currentTime < endOfDay) {
      // Advance time by 0 to 2 minutes (in milliseconds)
      const gapMinutes = Math.floor(rand() * 3);
      const gapSeconds = Math.floor(rand() * 60) + (gapMinutes === 0 ? 15 : 0); // min 15 seconds
      currentTime += gapMinutes * 60000 + gapSeconds * 1000;
      
      if (currentTime >= endOfDay) break;
      
      const product = sortedProducts[Math.floor(rand() * sortedProducts.length)];
      const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
      const initial = LAST_INITIALS[Math.floor(rand() * LAST_INITIALS.length)];
      const actionText = ACTIONS[Math.floor(rand() * ACTIONS.length)];
      
      sales.push({
        id: `${dateString}-${i}`,
        name: `${firstName} ${initial}.`,
        actionText,
        productId: product.id,
        productName: product.name,
        commission: product.commission_amount,
        time: currentTime,
        imageUrl: product.image_url
      });
      i++;
   }
   
   return sales;
};

interface LiveSale {
  id: string;
  name: string;
  actionText: string;
  productId: string;
  productName: string;
  commission: number;
  time: number;
  imageUrl: string;
}

export const LiveCommissionsFeed: React.FC<{ products: Product[] }> = ({ products }) => {
  const [visibleSales, setVisibleSales] = useState<LiveSale[]>([]);
  const [now, setNow] = useState(Date.now());
  const [allSales, setAllSales] = useState<LiveSale[]>([]);

  useEffect(() => {
    if (!products || products.length === 0) return;

    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    const tomorrow = new Date(today.getTime() + 86400000);

    const generated = [
       ...generateSalesForDate(yesterday, products),
       ...generateSalesForDate(today, products),
       ...generateSalesForDate(tomorrow, products)
    ].sort((a, b) => b.time - a.time);

    setAllSales(generated);
  }, [products]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      
      if (allSales.length > 0) {
        const past = allSales.filter(s => s.time <= currentNow);
        setVisibleSales(past.slice(0, 5));
      }
    }, 1000); // Check every second to pop them accurately in real-time

    return () => clearInterval(interval);
  }, [allSales]);

  const getTimeAgo = (time: number) => {
    const diff = Math.max(0, Math.floor((now - time) / 1000));
    if (diff < 60) return "à l'instant";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days} j`;
  };

  if (products.length === 0) return null;

  return (
    <div className="mt-8 border border-white/5 rounded-[24px] overflow-hidden bg-[#0f0f12]">
       <div className="p-4 sm:p-5 border-b border-white/5 bg-white/[0.01] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center relative">
             <div className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping" style={{ animationDuration: '3s' }}></div>
             <Zap size={14} className="text-[#10b981]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest italic leading-tight">Commissions en temps réel</h3>
          </div>
       </div>

       <div className="p-4 sm:p-5 flex flex-col gap-3">
          <AnimatePresence initial={false}>
             {visibleSales.map((sale) => (
                <motion.div
                   key={sale.id}
                   initial={{ opacity: 0, y: -20, height: 0 }}
                   animate={{ opacity: 1, y: 0, height: 'auto' }}
                   exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
                   transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                   className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-[18px] border border-white/[0.04]"
                >
                   <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black overflow-hidden border border-white/5 shrink-0 shadow-lg">
                      <img src={sale.imageUrl} alt={sale.productName} className="w-full h-full object-cover opacity-90" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
                         <p className="text-[11px] sm:text-[13px] text-white/90 leading-snug line-clamp-2">
                            <span className="font-bold text-white">{sale.name}</span> <span className="text-white/40">{sale.actionText}</span> <span className="text-white/80 font-medium italic">{(sale.productName || "").substring(0, 35)}{(sale.productName?.length > 35 ? "..." : "")}</span>
                         </p>
                         <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] text-white/30 uppercase tracking-widest whitespace-nowrap">{getTimeAgo(sale.time)}</span>
                            <span className="whitespace-nowrap px-2 py-1 rounded bg-[#10b981]/15 text-[#10b981] text-[11px] font-black uppercase tracking-wider relative overflow-hidden">
                               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                               +<CurrencyDisplay amount={sale.commission} showOriginal={false} inline />
                            </span>
                         </div>
                      </div>
                   </div>
                </motion.div>
             ))}
          </AnimatePresence>
       </div>
    </div>
  );
};
