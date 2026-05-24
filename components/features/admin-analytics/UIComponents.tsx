import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const AnalyticsCard = ({ 
   title, value, trend, icon: Icon, invertTrendColors = false 
}: { 
   title: string, value: string | number, trend: string, icon: any, invertTrendColors?: boolean 
}) => {
   const isPositive = trend.startsWith('+');
   const trendColor = (isPositive && !invertTrendColors) || (!isPositive && invertTrendColors) 
     ? 'text-emerald-400 bg-emerald-400/10' 
     : 'text-red-400 bg-red-400/10';
   const TrendIcon = isPositive ? TrendingUp : TrendingDown;

   return (
      <div className="bg-neutral-900/50 border border-white/5 p-5 rounded-3xl flex flex-col gap-4 shadow-lg hover:bg-neutral-900/80 transition-colors">
         <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400">{title}</span>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400">
               <Icon size={14} />
            </div>
         </div>
         <div className="flex items-end gap-3">
            <span className="text-2xl font-black text-white">{value}</span>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 ${trendColor}`}>
               <TrendIcon size={10} /> {trend}
            </span>
         </div>
      </div>
   );
};

export const GraphicPlaceholder = ({ height, type, color = "emerald" }: { height: number, type: 'line' | 'bar' | 'heatmap' | 'funnel', color?: string }) => {
   const colors: Record<string, string> = {
      emerald: "from-emerald-500/20 to-emerald-500/5",
      amber: "from-amber-500/20 to-amber-500/5",
      blue: "from-blue-500/20 to-blue-500/5",
      purple: "from-purple-500/20 to-purple-500/5",
   };
   const bgClass = colors[color] || colors.emerald;

   return (
      <div 
         style={{ height }} 
         className={`w-full rounded-2xl flex items-center justify-center border border-white/5 bg-gradient-to-b ${bgClass} relative overflow-hidden`}
      >
         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
         
         <div className="text-center z-10 p-4">
            <span className="text-xs font-black uppercase text-white/40 tracking-widest flex items-center gap-2 justify-center">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
               Data Visualization ({type})
            </span>
            <p className="text-[9px] text-neutral-500 mt-2">Connecting to analytics engine...</p>
         </div>
      </div>
   );
};
