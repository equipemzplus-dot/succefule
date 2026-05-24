import React from 'react';
import { Crown, Sparkles, LogIn, TrendingUp, ShieldCheck } from 'lucide-react';
import { AnalyticsCard, GraphicPlaceholder } from './UIComponents.tsx';

export const PremiumAnalytics = () => {
  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
               <Crown className="text-amber-400" />
               Analyse Premium
            </h2>
            <p className="text-neutral-400 text-xs">Analyse chirurgicale de la conversion et de la rétention Premium.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <AnalyticsCard title="Taux de conversion global" value="8.4%" trend="+1.2%" icon={ShieldCheck} />
         <AnalyticsCard title="Visites page Premium" value="12,450" trend="+24%" icon={Eye} />
         <AnalyticsCard title="Abandon panier (Premium)" value="45%" trend="-5%" icon={LogIn} invertTrendColors />
         <AnalyticsCard title="LTV (Life Time Value)" value="65,000 XAF" trend="+8%" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
            <h3 className="text-xs font-bold text-neutral-400 uppercase mb-4">Évolution des Conversions Premium (30j)</h3>
            <GraphicPlaceholder height={250} type="line" color="amber" />
         </div>
         <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 flex flex-col">
            <h3 className="text-xs font-bold text-neutral-400 uppercase mb-4">Meilleurs déclencheurs</h3>
            <div className="flex-1 space-y-4">
              {[
                { name: "Fin de défi Jour 3", rate: "45%" },
                { name: "Flash Offer (Pop-up)", rate: "28%" },
                { name: "Message Axis IA", rate: "15%" },
                { name: "Consultation Catalogue", rate: "12%" }
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                   <dl>
                      <dt className="text-xs font-bold text-white">{t.name}</dt>
                      <dd className="text-[9px] text-neutral-500 uppercase">Origine de conversion</dd>
                   </dl>
                   <span className="text-xs font-black text-amber-400">{t.rate}</span>
                </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
};

// Temp mock of icon missing above
const Eye = (props: any) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
