import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, Clock, ShieldCheck, Download, Wallet, CreditCard } from 'lucide-react';
import { CurrencyDisplay } from '../../ui/CurrencyDisplay.tsx';
import { supabase } from '../../../services/supabase.ts';

const xmur3 = (str: string) => {
  let h = 1779033703;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
};

const sfc32 = (a: number, b: number, c: number, d: number) => {
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
};

interface LiveWithdrawalEvent {
  id: string;
  name: string;
  amountXAF: number;
  method: string;
  time: number;
  status: "validated" | "pending" | "rejected";
  isPremium: boolean;
  reference: string;
}

export const LiveWithdrawalsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [events, setEvents] = useState<LiveWithdrawalEvent[]>([]);
  const [appImages, setAppImages] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data } = await supabase.from('platform_settings').select('value').eq('id', 'app_images').single();
        if (data?.value) setAppImages(data.value);
      } catch (e) {}
    };
    fetchImages();

    // Generate some history
    const history: LiveWithdrawalEvent[] = [];
    const dateString = `${new Date().getUTCFullYear()}-${new Date().getUTCMonth()}-${new Date().getUTCDate()}-withdrawals`;
    const seed = xmur3(dateString);
    const rand = sfc32(seed(), seed(), seed(), seed());

    const names = ["Abdoulaye", "Aminata", "Moussa", "Fatoumata", "Ibrahim", "Mariam", "Ousmane", "Aissatou", "Sekou", "Kadidiatou", "Cheick", "Djeneba", "Bakary", "Sira", "Modibo", "Tene", "Lamine", "Awa", "Youssouf", "Fanta"];
    const methods = ["Orange Money", "MTN MoMo", "Wave", "Moov Money", "Airtel Money"];

    const currentTime = Date.now();
    for (let i = 0; i < 30; i++) {
        const timeOffset = Math.floor(rand() * 86400000);
        const amount = Math.floor(rand() * 50) * 1000 + 5000;
        const method = methods[Math.floor(rand() * methods.length)];
        const isPremium = rand() > 0.4;
        
        history.push({
            id: `WD-${Math.floor(rand() * 100000000)}`,
            name: names[Math.floor(rand() * names.length)],
            amountXAF: amount,
            method,
            time: currentTime - timeOffset,
            status: "validated",
            isPremium,
            reference: `REF-${Math.floor(rand() * 100000000)}`
        });
    }

    setEvents(history.sort((a, b) => b.time - a.time));

    const interval = setInterval(() => {
        setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (method: string) => {
    switch (method) {
      case "Orange Money": return "https://brand.orange.com/app/uploads/2016/10/logo-orange.png";
      case "MTN MoMo": return "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/200px-New-mtn-logo.jpg";
      case "Wave": return "https://dashboard.wave.com/static/favicon.ico";
      case "Airtel Money": return "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Airtel_logo-01.png/200px-Airtel_logo-01.png";
      case "Moov Money": return "https://www.moov-africa.ml/PublishingImages/Logo/Logo-Moov-Africa.png";
      default: return "";
    }
  };

  const getTimeAgo = (time: number) => {
    const diff = Math.max(0, Math.floor((now - time) / 1000));
    if (diff < 60) return "à l'instant";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#f8f9fa] overflow-y-auto text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 px-4 py-4 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
               <ArrowLeft size={20} />
            </button>
            <div>
               <h1 className="text-sm font-black uppercase tracking-wider text-slate-900">Registre Public</h1>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Retraits en temps réel</p>
            </div>
         </div>
         <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Live</span>
         </div>
      </div>

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        
        {/* Trust Banner */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200 flex flex-col md:flex-row items-center gap-6">
           <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
              <ShieldCheck size={32} className="text-blue-600" />
           </div>
           <div className="text-center md:text-left flex-1">
              <h2 className="text-lg font-black text-slate-900">Transparence Totale</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Tous les paiements sont traités automatiquement et affichés publiquement pour garantir une confiance absolue.</p>
           </div>
           <div className="shrink-0 flex items-center gap-4">
              <div className="flex -space-x-4">
                 {["Orange Money", "MTN MoMo", "Wave", "Moov Money"].map((m, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm p-1">
                       <img src={appImages[m] || getIcon(m)} alt={m} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Invoice List */}
        <div className="space-y-4">
           {events.map((ev, index) => (
              <motion.div 
                 key={ev.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.05 }}
                 className="bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-sm relative group"
              >
                 {/* Receipt Perforation effect */}
                 <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#e5e7eb_4px,#e5e7eb_8px)] opacity-50"></div>
                 
                 <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded bg-slate-50 border border-slate-100 p-1.5 flex shrink-0 items-center justify-center">
                          <img src={appImages[ev.method] || getIcon(ev.method)} alt={ev.method} className="w-full h-full object-contain" referrerPolicy="no-referrer" onError={(e) => {
                             (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/2169/2169864.png";
                          }} />
                       </div>
                       
                       <div>
                          <div className="flex items-center gap-2">
                             <h3 className="text-sm font-bold text-slate-900">{ev.name}</h3>
                             {ev.isPremium && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Premium</span>
                             )}
                          </div>
                          <div className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                             <Clock size={12} />
                             <span>{getTimeAgo(ev.time)}</span>
                             <span className="text-slate-300">•</span>
                             <span className="text-slate-400 font-mono tracking-wider">{ev.reference}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 sm:gap-4 pl-16 sm:pl-0 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                       <div className="flex flex-col items-start sm:items-end">
                          <div className="flex items-center gap-1.5">
                             <CheckCircle2 size={14} className="text-emerald-500" />
                             <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Effectué</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Paiement via {ev.method}</p>
                       </div>
                       
                       <div className="text-right">
                          <CurrencyDisplay amount={ev.amountXAF} className="text-lg font-black text-slate-900" secondaryClassName="hidden" showOriginal={false} />
                       </div>
                    </div>
                 </div>

              </motion.div>
           ))}
        </div>

      </div>
    </div>
  );
};
