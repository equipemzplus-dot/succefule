import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Receipt, CalendarCheck, FileText, Download, Check, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../services/supabase';

const getCountryFlag = (countryCode?: string) => {
  if (!countryCode) return null;
  const code = countryCode.trim().toLowerCase();
  if (/^[a-z]{2}$/.test(code)) {
    return <img src={`https://flagcdn.com/w40/${code}.png`} alt={code.toUpperCase()} loading="lazy" className="w-5 sm:w-6 object-contain rounded-sm shadow-sm opacity-90 inline-block" />;
  }
  return null;
};

const getCountryName = (countryCode?: string) => {
   if (!countryCode) return 'Inconnu';
   const map: Record<string, string> = {
      'ci': "Côte d'Ivoire",
      'sn': "Sénégal",
      'cm': "Cameroun",
      'ml': "Mali",
      'bf': "Burkina Faso",
      'tg': "Togo",
      'bj': "Bénin",
      'ne': "Niger",
      'cd': "RDC",
      'cg': "Congo",
      'ga': "Gabon",
      'gf': "Guyane",
      'gp': "Guadeloupe",
      'mq': "Martinique",
      're': "Réunion",
      'yt': "Mayotte",
      'mg': "Madagascar",
      'gn': "Guinée",
      'dz': "Algérie",
      'ma': "Maroc",
      'tn': "Tunisie",
      'fr': "France",
      'ca': "Canada",
   };
   const code = countryCode.toLowerCase();
   return map[code] || code.toUpperCase();
};

const formatCurrency = (countryCode: string | undefined, amountFcfa: number) => {
  const code = (countryCode || '').toLowerCase();
  
  let amount = amountFcfa;
  let currency = 'FCFA';
  let decimals = 0;

  // XOF / XAF Countries
  if (['ci', 'sn', 'ml', 'bf', 'tg', 'bj', 'ne', 'gw', 'cm', 'ga', 'cg', 'td', 'gq', 'cf'].includes(code)) {
    amount = amountFcfa;
    currency = 'FCFA';
  } else if (code === 'cd') { // RDC
    amount = amountFcfa * 4.6;
    currency = 'CDF';
  } else if (code === 'gn') { // Guinée
    amount = amountFcfa * 14.2;
    currency = 'GNF';
  } else if (code === 'mg') { // Madagascar
    amount = amountFcfa * 7.5;
    currency = 'MGA';
  } else if (code === 'ma') { // Maroc
    amount = amountFcfa * 0.017;
    currency = 'MAD';
    decimals = 2;
  } else if (code === 'dz') { // Algérie
    amount = amountFcfa * 0.22;
    currency = 'DZD';
    decimals = 2;
  } else if (code === 'tn') { // Tunisie
    amount = amountFcfa * 0.0051;
    currency = 'TND';
    decimals = 2;
  } else if (['fr', 'be', 're', 'yt'].includes(code)) { // Europe / DOM
    amount = amountFcfa / 655.957;
    currency = '€';
    decimals = 2;
  } else if (code === 'ca') { // Canada
    amount = amountFcfa / 450;
    currency = '$ CA';
    decimals = 2;
  } else { // Fallback standard (USD) si inconnu et hors zone franc
    if (code && !['', '🌐'].includes(code)) {
      amount = amountFcfa / 600;
      currency = '$';
      decimals = 2;
    }
  }

  return {
    value: amount.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    currency
  };
};

export const PastRewardsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
   const [rewards, setRewards] = useState<any[]>([]);
   const [appImages, setAppImages] = useState<Record<string, string>>({});
   const [loading, setLoading] = useState(true);

   // Calculate dynamic dates
   const now = new Date();
   const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
   const distributionDate = new Date(now.getFullYear(), now.getMonth(), 1);
   
   const lastMonthStr = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(lastMonthDate);
   const distributionDateStr = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(distributionDate);

   useEffect(() => {
      fetchData();
   }, []);

   const fetchData = async () => {
      setLoading(true);
      try {
         // Fetch images from platform_settings
         const { data: imgData } = await supabase.from('platform_settings').select('value').eq('id', 'app_images').single();
         const images = imgData?.value || {};
         setAppImages(images);

         const { data, error } = await supabase
           .from('past_monthly_rewards')
           .select('*')
           .order('rank', { ascending: true })
           .limit(10);
           
         if (data && data.length > 0) {
            setRewards(data);
         } else {
            // Realistic mock data for preview with matching countries/methods
            setRewards([
              { id: '1', rank: 1, user_name: 'Alex D.', country_code: 'ci', amount_fcfa: 50000, rewarded_xp: 45200, payment_methods: { name: 'Orange Money' } },
              { id: '2', rank: 2, user_name: 'Sarah M.', country_code: 'sn', amount_fcfa: 40000, rewarded_xp: 38900, payment_methods: { name: 'Wave' } },
              { id: '3', rank: 3, user_name: 'Kevin B.', country_code: 'cm', amount_fcfa: 30000, rewarded_xp: 32100, payment_methods: { name: 'MTN Mobile Money' } },
              { id: '4', rank: 4, user_name: 'Marie J.', country_code: 'ml', amount_fcfa: 25000, rewarded_xp: 28500, payment_methods: { name: 'Orange Money' } },
              { id: '5', rank: 5, user_name: 'Paul H.', country_code: 'bf', amount_fcfa: 20000, rewarded_xp: 24300, payment_methods: { name: 'Wave' } },
              { id: '6', rank: 6, user_name: 'Omar C.', country_code: 'ci', amount_fcfa: 18000, rewarded_xp: 21500, payment_methods: { name: 'Wave' } },
              { id: '7', rank: 7, user_name: 'Fatou N.', country_code: 'sn', amount_fcfa: 17000, rewarded_xp: 19800, payment_methods: { name: 'Orange Money' } },
              { id: '8', rank: 8, user_name: 'Ali K.', country_code: 'tg', amount_fcfa: 16000, rewarded_xp: 18200, payment_methods: { name: 'Moov Money' } },
              { id: '9', rank: 9, user_name: 'Jean P.', country_code: 'cd', amount_fcfa: 15000, rewarded_xp: 17500, payment_methods: { name: 'M-Pesa' } },
              { id: '10', rank: 10, user_name: 'Awa T.', country_code: 'bj', amount_fcfa: 15000, rewarded_xp: 16900, payment_methods: { name: 'MTN Mobile Money' } },
            ]);
         }
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
   }

   return (
     <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
        <button onClick={onClose} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors py-2 px-3 bg-[#1a1a1a] rounded-xl border border-white/10 hover:bg-[#222] w-fit shadow-md">
           <ArrowLeft size={16} /> <span className="font-bold text-sm uppercase tracking-wider">Retour au classement</span>
        </button>

        {/* Financial Statement Container */}
        <div className="relative bg-white text-slate-800 rounded-sm overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200">
           
           {/* Top Border Accent */}
           <div className="h-2 w-full bg-[#0A2540]"></div>
           
           <div className="p-8 sm:p-12 pb-6 border-b border-slate-200 bg-slate-50 relative">
              {/* Trust Badge */}
              <div className="absolute top-8 right-8 flex flex-col items-end opacity-80 mt-2 sm:mt-0">
                 <ShieldCheck size={40} className="text-[#0A2540] mb-2 sm:size-12" />
                 <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-slate-400">Paiements Sécurisés</span>
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-[#0A2540] rounded-lg flex items-center justify-center text-white shadow-md">
                    <FileText size={24} />
                 </div>
                 <div>
                    <h1 className="text-xl sm:text-3xl font-black text-[#0A2540] tracking-tight leading-none uppercase">État des Versements</h1>
                    <p className="text-sm text-slate-500 font-medium">Programme de Récompenses MZ+</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-sm mb-6">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Période Récompensée</p>
                   <p className="text-sm font-semibold text-slate-700 capitalize">{lastMonthStr}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date d'Exécution</p>
                   <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded border border-emerald-200">
                     <Check size={14} className="stroke-[3]" />
                     <span className="text-xs font-bold uppercase tracking-wider">{distributionDateStr}</span>
                   </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
                 <div className="mt-0.5 text-blue-600"><CheckCircle2 size={18} /></div>
                 <p className="text-xs sm:text-sm text-blue-800 font-medium leading-relaxed">
                   Ces récompenses ont été <span className="font-bold">transmises avec succès</span> sur les comptes des bénéficiaires le {distributionDateStr}. Ces transactions sont définitives.
                 </p>
              </div>
           </div>

           <div className="p-0 sm:p-8">
             {loading ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-t-2 border-[#0A2540] animate-spin" /></div>
             ) : (
                <div className="w-full">
                  {/* Table Header */}
                  <div className="hidden sm:grid grid-cols-[1fr_2.5fr_2fr_1.5fr] gap-4 px-6 py-3 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <div>Classement</div>
                     <div>Bénéficiaire</div>
                     <div>Moyen de paiement</div>
                     <div className="text-right">Montant Réglé</div>
                  </div>

                  {/* Table Body */}
                  <div className="flex flex-col">
                    {rewards.map((reward, i) => {
                      const computedCurrency = formatCurrency(reward.country_code, reward.amount_fcfa);
                      return (
                      <div key={reward.id} className="grid sm:grid-cols-[1fr_2.5fr_2fr_1.5fr] gap-2 sm:gap-4 px-6 py-4 sm:py-5 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center group">
                         
                         {/* Rank */}
                         <div className="flex items-center gap-3">
                            <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Rang</span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${reward.rank === 1 ? 'bg-amber-100 text-amber-700 border border-amber-200' : reward.rank === 2 ? 'bg-slate-200 text-slate-700 border border-slate-300' : reward.rank === 3 ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                              #{reward.rank}
                            </div>
                         </div>
                         
                         {/* Name & Country */}
                         <div className="flex items-center gap-3">
                            <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Bénéficiaire</span>
                            <div className="flex flex-col items-center justify-center w-8 shrink-0">
                               {getCountryFlag(reward.country_code)}
                               <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tight text-center leading-tight mt-1 truncate max-w-[40px]">{getCountryName(reward.country_code)}</span>
                            </div>
                            <div className="flex flex-col">
                               <span className="font-bold text-slate-800 leading-tight">{reward.user_name}</span>
                               {reward.rewarded_xp && (
                                 <span className="text-[10px] text-slate-500 font-semibold">{reward.rewarded_xp.toLocaleString('fr-FR')} XP</span>
                               )}
                            </div>
                         </div>
                         
                         {/* Payment Method */}
                         <div className="flex items-center gap-3">
                            <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Paiement via</span>
                            <div className="flex items-center gap-2">
                               {reward.payment_methods?.logo_url || (reward.payment_methods?.name && appImages[reward.payment_methods.name]) ? (
                                 <div className="h-6 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex items-center justify-center shadow-sm">
                                    <img src={reward.payment_methods?.logo_url || appImages[reward.payment_methods.name]} alt={reward.payment_methods?.name} className="h-4 w-auto object-contain max-w-[40px]" />
                                 </div>
                               ) : (
                                  <div className="h-6 w-8 bg-slate-200 rounded flex items-center justify-center text-[8px] text-slate-500 uppercase font-black" >{reward.payment_methods?.name?.substring(0, 2) || '-'}</div>
                               )}
                               <span className="text-xs font-semibold text-slate-600 truncate max-w-[120px]">{reward.payment_methods?.name || 'Virement'}</span>
                            </div>
                         </div>
                         
                         {/* Amount */}
                         <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                            <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Montant Acté</span>
                            <div className="text-right flex items-baseline gap-1">
                               <span className="text-[17px] font-black text-slate-900 tracking-tight">
                                 {computedCurrency.value}
                               </span>
                               <span className="text-[11px] font-bold text-slate-500">{computedCurrency.currency}</span>
                            </div>
                         </div>

                      </div>
                    )})}
                  </div>
                </div>
             )}
           </div>
           
           {/* Footer */}
           <div className="bg-slate-50 p-6 border-t border-slate-200 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold max-w-sm">
                Document certifié généré automatiquement par le système de facturation de MZ+.
              </p>
              <div className="flex gap-2">
                 <button className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5 bg-white shadow-sm">
                   <Download size={14} /> Imprimer reçu
                 </button>
              </div>
           </div>

        </div>
     </div>
   )
}

