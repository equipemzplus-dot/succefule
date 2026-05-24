import React from 'react';
import { useAxis } from './AxisProvider.tsx';
import { GoldBorderCard, SectionTitle } from '../../UI.tsx';

export const AxisTestAdmin = () => {
  const { hideAxis } = useAxis();

  return (
    <div className="space-y-6">
      <SectionTitle title="Système Axis" subtitle="Panel de test" />
      
      <GoldBorderCard>
        <div className="space-y-6 p-4">
          <div className="flex gap-4 flex-wrap">
             <button
              onClick={() => hideAxis()}
              className="px-6 py-3 bg-red-500/20 text-red-500 rounded-xl font-bold border border-red-500/50 hover:bg-red-500/30 transition-all"
             >
               Forcer la disparition
             </button>
             <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mz-reset-challenge'));
                window.dispatchEvent(new CustomEvent('mz-navigate-dashboard'));
                setTimeout(() => window.dispatchEvent(new CustomEvent('mz-force-welcome-guide')), 100);
              }}
              className="px-6 py-3 bg-indigo-500/20 text-indigo-400 rounded-xl font-bold border border-indigo-500/50 hover:bg-indigo-500/30 transition-all"
             >
               Tester le Guide d'Accueil (Bot)
             </button>
             <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mz-trigger-3j-challenge'));
              }}
              className="px-6 py-3 bg-amber-500/20 text-[var(--color-gold-main)] rounded-xl font-bold border border-[var(--color-gold-main)]/50 hover:bg-[var(--color-gold-main)]/20 transition-all"
             >
               Défi 3 Jours
             </button>
             <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mz-trigger-3j-celebration'));
              }}
              className="px-6 py-3 bg-green-500/20 text-green-400 rounded-xl font-bold border border-green-500/50 hover:bg-green-500/30 transition-all"
             >
               Tester Victoire Défis (J1)
             </button>
             <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mz-trigger-3j-day2'));
              }}
              className="px-6 py-3 bg-blue-500/20 text-blue-400 rounded-xl font-bold border border-blue-500/50 hover:bg-blue-500/30 transition-all"
             >
               Tester Intro Jour 2
             </button>
             <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mz-trigger-3j-day3'));
              }}
              className="px-6 py-3 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl font-bold border border-fuchsia-500/50 hover:bg-fuchsia-500/30 transition-all"
             >
               Tester Intro Jour 3
             </button>
             <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mz-new-sale'));
              }}
              className="px-6 py-3 bg-purple-500/20 text-purple-400 rounded-xl font-bold border border-purple-500/50 hover:bg-purple-500/30 transition-all"
             >
               Simuler une vente (Valide J2 ou J3)
             </button>
          </div>
        </div>
      </GoldBorderCard>
    </div>
  );
};

