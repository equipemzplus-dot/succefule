import React from 'react';
import { Users2, ShieldCheck, Trophy, Crown, Target, Flag, CircleSlash, Award, Bot, MessageSquare, AlertCircle, Zap, HeartHandshake, Clock, LogIn, DollarSign, Wallet, TrendingDown, Globe, MapPin, AlertTriangle, Bug } from 'lucide-react';
import { AnalyticsCard, GraphicPlaceholder } from './UIComponents.tsx';

// TEAM ANALYTICS
export const TeamAnalytics = () => (
  <div className="p-8 space-y-8 h-full overflow-y-auto">
    <div className="flex flex-col gap-2">
       <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
          <Users2 className="text-blue-400" /> Analyse Parrainage & Équipes
       </h2>
       <p className="text-neutral-400 text-xs">Surveillez la croissance de vos réseaux et l'impact des recruteurs.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       <AnalyticsCard title="Membres recrutés (30j)" value="1,240" trend="+15%" icon={Users2} />
       <AnalyticsCard title="Revenus Générés (Équipes)" value="4.5M" trend="+22%" icon={ShieldCheck} />
       <AnalyticsCard title="Équipes actives > 5 Mb" value="84" trend="+5%" icon={Trophy} />
       <AnalyticsCard title="Top Recruteur" value="142" trend="+12%" icon={Crown} />
    </div>
    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
       <h3 className="text-xs font-bold text-neutral-400 uppercase mb-4">Vitesse de croissance globale</h3>
       <GraphicPlaceholder height={250} type="bar" color="blue" />
    </div>
  </div>
);

// CHALLENGES ANALYTICS
export const ChallengesAnalytics = () => (
  <div className="p-8 space-y-8 h-full overflow-y-auto">
    <div className="flex flex-col gap-2">
       <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
          <Target className="text-purple-400" /> Analyse Défis & Missions
       </h2>
       <p className="text-neutral-400 text-xs">Mesurez la difficulté et le taux de complétion de vos défis d'onboarding.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       <AnalyticsCard title="Défis démarrés" value="5,892" trend="+34%" icon={Target} />
       <AnalyticsCard title="Taux de réussite global" value="62%" trend="+4%" icon={Award} />
       <AnalyticsCard title="Abandons au Jour 1" value="28%" trend="-5%" icon={CircleSlash} invertTrendColors />
       <AnalyticsCard title="Temps moyen complétion" value="14h 22m" trend="-1h" icon={Flag} />
    </div>
    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
       <h3 className="text-xs font-bold text-neutral-400 uppercase mb-4">Chute de conversion (Entonnoir des 3 Jours)</h3>
       <GraphicPlaceholder height={250} type="funnel" color="purple" />
    </div>
  </div>
);

// AXIS ANALYTICS
export const AxisAnalytics = () => (
  <div className="p-8 space-y-8 h-full overflow-y-auto">
    <div className="flex flex-col gap-2">
       <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
          <Bot className="text-cyan-400" /> Analyse intelligence Axis IA
       </h2>
       <p className="text-neutral-400 text-xs">Analysez comment l'IA interagit avec vos utilisateurs et résout leurs problèmes.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       <AnalyticsCard title="Questions traitées (24h)" value="12,405" trend="+45%" icon={MessageSquare} />
       <AnalyticsCard title="Taux de satisfaction estimé" value="94%" trend="+2%" icon={Zap} />
       <AnalyticsCard title="Frustration détectée" value="3.2%" trend="-0.8%" icon={AlertCircle} invertTrendColors />
       <AnalyticsCard title="Demandes d'humain" value="1.5%" trend="-1.2%" icon={Bot} invertTrendColors />
    </div>
    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
       <h3 className="text-xs font-bold text-neutral-400 uppercase mb-4">Volume d'interaction par heure</h3>
       <GraphicPlaceholder height={250} type="line" color="emerald" />
    </div>
  </div>
);

// ENGAGEMENT ANALYTICS
export const EngagementAnalytics = () => (
   <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex flex-col gap-2">
         <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <HeartHandshake className="text-pink-400" /> Analyse Engagement
         </h2>
         <p className="text-neutral-400 text-xs">Observez la fidélité et la fréquence d'utilisation de l'application.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <AnalyticsCard title="Utilisateurs Actifs (DAU)" value="4,890" trend="+8%" icon={Users2} />
         <AnalyticsCard title="Connexions / Semaine" value="4.2" trend="+0.5" icon={LogIn} />
         <AnalyticsCard title="Sessions Longues (>10m)" value="1,240" trend="+15%" icon={Clock} />
         <AnalyticsCard title="Inactifs (Risque de Churn)" value="890" trend="-12%" icon={Zap} invertTrendColors />
      </div>
      <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
         <h3 className="text-xs font-bold text-neutral-400 uppercase mb-4">Courbe de Rétention (Cohortes mensuelles)</h3>
         <GraphicPlaceholder height={250} type="line" color="purple" />
      </div>
   </div>
);

// REVENUE ANALYTICS
export const RevenueAnalytics = () => (
   <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex flex-col gap-2">
         <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <DollarSign className="text-emerald-400" /> Analyse Revenus
         </h2>
         <p className="text-neutral-400 text-xs">Suivi macro et micro de la monétisation de la plateforme.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <AnalyticsCard title="Revenu Global" value="18.5M" trend="+14%" icon={DollarSign} />
         <AnalyticsCard title="Paiements Premium" value="12.2M" trend="+20%" icon={Crown} />
         <AnalyticsCard title="Récompenses distribuées" value="2.1M" trend="+5%" icon={Wallet} invertTrendColors />
         <AnalyticsCard title="Utilisateurs Rentables (ROI > 0)" value="34%" trend="+2%" icon={TrendingDown} />
      </div>
      <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
         <h3 className="text-xs font-bold text-neutral-400 uppercase mb-4">Évolution des Flux Monétaires Nets</h3>
         <GraphicPlaceholder height={250} type="bar" color="emerald" />
      </div>
   </div>
);

// GLOBAL ANALYTICS
export const GlobalAnalytics = () => (
   <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex flex-col gap-2">
         <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <Globe className="text-blue-400" /> Analyse Mondiale
         </h2>
         <p className="text-neutral-400 text-xs">Identifiez vos marchés les plus forts et les opportunités géographiques.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <AnalyticsCard title="Pays actifs" value="18" trend="+2" icon={Globe} />
         <AnalyticsCard title="Région Dominante" value="Afr. de l'Ouest" trend="+12%" icon={MapPin} />
         <AnalyticsCard title="Nouvelles incursions" value="3 Pays" trend="+1" icon={Target} />
         <AnalyticsCard title="Localisation de l'engagement" value="Côte d'Ivoire" trend="+40%" icon={ShieldCheck} />
      </div>
      <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
         <h3 className="text-xs font-bold text-neutral-400 uppercase mb-4">Répartition Démographique par zone active</h3>
         <GraphicPlaceholder height={250} type="heatmap" color="blue" />
      </div>
   </div>
);

// ISSUE DETECTION ANALYTICS
export const IssueDetectionAnalytics = () => (
   <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex flex-col gap-2">
         <h2 className="text-xl font-black text-rose-500 uppercase tracking-wider flex items-center gap-3">
            <AlertTriangle className="text-rose-500" /> Prévention & Détection
         </h2>
         <p className="text-neutral-400 text-xs">Identifiez les frictions et les anomalies avant qu'elles n'affectent vos utilisateurs.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <AnalyticsCard title="Bugs Signalés" value="12" trend="-4" icon={Bug} invertTrendColors />
         <AnalyticsCard title="Taux d'erreur API" value="0.04%" trend="-0.01%" icon={AlertCircle} invertTrendColors />
         <AnalyticsCard title="Pages Lentes (>2s)" value="2" trend="-1" icon={Clock} invertTrendColors />
         <AnalyticsCard title="Blocages Paiement" value="0.1%" trend="-0.2%" icon={ShieldCheck} invertTrendColors />
      </div>
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6">
         <h3 className="text-xs font-bold text-rose-400 uppercase mb-4 flex items-center gap-2"><AlertCircle size={16} /> Zones sous tension (Live)</h3>
         <div className="space-y-3">
            <div className="bg-black/40 border border-rose-500/10 rounded-xl p-4 flex justify-between items-center">
               <div>
                  <h4 className="text-white text-sm font-bold">Lenteur sur chargement vidéo "Formation 2"</h4>
                  <p className="text-[10px] text-neutral-500 mt-1">L'API de streaming met plus de 3.5s à répondre pour 15% des utilisateurs.</p>
               </div>
               <span className="text-rose-400 font-bold text-xs bg-rose-500/10 px-3 py-1 rounded-full">Non Critique</span>
            </div>
            <div className="bg-black/40 border border-amber-500/10 rounded-xl p-4 flex justify-between items-center">
               <div>
                  <h4 className="text-white text-sm font-bold">Abandon inhabituel page d'inscription</h4>
                  <p className="text-[10px] text-neutral-500 mt-1">Hausse de 5% du taux d'abandon au niveau du champ Numéro de Téléphone (dernier iPad).</p>
               </div>
               <span className="text-amber-400 font-bold text-xs bg-amber-500/10 px-3 py-1 rounded-full">Surveillance</span>
            </div>
         </div>
      </div>
   </div>
);
