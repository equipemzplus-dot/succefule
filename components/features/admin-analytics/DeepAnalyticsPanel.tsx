import React, { useState } from 'react';
import { 
  Users, Activity, Crown, Users2, Target, Bot, Clock, 
  DollarSign, Globe, AlertTriangle, TrendingUp,
  MousePointer2, Eye, Map, HeartHandshake, ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../../../types.ts';
import { SectionTitle } from '../../UI.tsx';

// Mock components for different analytics views
import { BehavioralAnalytics } from './BehavioralAnalytics.tsx';
import { PremiumAnalytics } from './PremiumAnalytics.tsx';
import { 
   TeamAnalytics, ChallengesAnalytics, AxisAnalytics, EngagementAnalytics, 
   RevenueAnalytics, GlobalAnalytics, IssueDetectionAnalytics 
} from './MiscellaneousAnalytics.tsx';

type AnalyticsTab = 
  | 'behavioral' 
  | 'premium' 
  | 'team' 
  | 'challenges' 
  | 'axis' 
  | 'engagement' 
  | 'revenue' 
  | 'global' 
  | 'issues';

export const DeepAnalyticsPanel: React.FC<{ 
  adminProfile: UserProfile | null;
}> = ({ adminProfile }) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('behavioral');

  const tabs = [
    { id: 'behavioral', label: 'Comportement', icon: MousePointer2, desc: "Parcours et clics" },
    { id: 'premium', label: 'Premium', icon: Crown, desc: "Conversions et rétention" },
    { id: 'team', label: 'Parrainage', icon: Users2, desc: "Réseaux et d'équipes" },
    { id: 'challenges', label: 'Défis & Missions', icon: Target, desc: "Réussites et abandons" },
    { id: 'axis', label: 'Axis IA', icon: Bot, desc: "Interactions et frustrations" },
    { id: 'engagement', label: 'Engagement', icon: HeartHandshake, desc: "Temps et sessions" },
    { id: 'revenue', label: 'Revenus', icon: DollarSign, desc: "LTV et rentabilité" },
    { id: 'global', label: 'Mondiale', icon: Globe, desc: "Démographie et zones actives" },
    { id: 'issues', label: 'Alertes', icon: AlertTriangle, desc: "Bugs et blocages", isAlert: true }
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'behavioral': return <BehavioralAnalytics />;
      case 'premium': return <PremiumAnalytics />;
      case 'team': return <TeamAnalytics />;
      case 'challenges': return <ChallengesAnalytics />;
      case 'axis': return <AxisAnalytics />;
      case 'engagement': return <EngagementAnalytics />;
      case 'revenue': return <RevenueAnalytics />;
      case 'global': return <GlobalAnalytics />;
      case 'issues': return <IssueDetectionAnalytics />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in text-white min-h-[800px]">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 shrink-0 space-y-6">
        <div className="px-4">
           <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <Activity size={24} className="animate-pulse" />
              <h2 className="text-xl font-black uppercase tracking-widest">Analytics</h2>
           </div>
           <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Centre de contrôle stratégique</p>
        </div>

        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AnalyticsTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-neutral-800 text-white shadow-xl border border-white/10' 
                    : 'text-neutral-500 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                   isActive 
                    ? (tab.isAlert ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400') 
                    : 'bg-neutral-900'
                }`}>
                   <Icon size={16} />
                </div>
                <div className="text-left">
                  <p className={`text-xs font-black uppercase tracking-wider ${isActive && tab.isAlert ? 'text-red-400' : ''}`}>{tab.label}</p>
                  <p className="text-[9px] text-neutral-500">{tab.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
         <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0"></div>
         {renderContent()}
      </div>
    </div>
  );
};
