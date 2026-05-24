import React from 'react';
import { MousePointer2, Layers, Eye, Compass, Grip, TrendingUp } from 'lucide-react';
import { AnalyticsCard, GraphicPlaceholder } from './UIComponents.tsx';

export const BehavioralAnalytics = () => {
  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex flex-col gap-2">
         <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <MousePointer2 className="text-emerald-400" />
            Analyse Comportementale
         </h2>
         <p className="text-neutral-400 text-xs">Comprenez comment vos utilisateurs naviguent et interagissent avec l'écosystème MZ+.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <AnalyticsCard title="Pages les plus consultées" value="Acquisition" trend="+12%" icon={Layers} />
         <AnalyticsCard title="Temps moyen / session" value="4m 32s" trend="+4%" icon={Compass} />
         <AnalyticsCard title="Taux de rebond (Tunnel)" value="34%" trend="-2%" icon={Grip} invertTrendColors />
         <AnalyticsCard title="Clics uniques / jour" value="42,105" trend="+18%" icon={MousePointer2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
            <h3 className="text-xs font-bold text-neutral-400 uppercase mb-4">Heatmap des interactions (Landing)</h3>
            <GraphicPlaceholder height={200} type="heatmap" color="emerald" />
            <p className="text-[10px] text-neutral-600 mt-4 text-center">Les zones rouges indiquent de forts taux de clics (Call-to-Action VIP).</p>
         </div>
         <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
            <h3 className="text-xs font-bold text-neutral-400 uppercase mb-4">Parcours Typique (Drop-off)</h3>
            <GraphicPlaceholder height={200} type="funnel" color="blue" />
            <div className="flex justify-between text-[10px] uppercase font-bold text-neutral-500 mt-4">
               <span>Accueil (100%)</span>
               <span>Défis (65%)</span>
               <span>Premium (12%)</span>
            </div>
         </div>
      </div>
    </div>
  );
};
