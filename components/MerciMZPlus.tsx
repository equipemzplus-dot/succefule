import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShoppingBag, ExternalLink, ShieldCheck, Sparkles, Award, Star, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { PurchaseSyncService } from '../services/PurchaseSyncService';
import { supabase } from '../services/supabase';
import { CurrencyDisplay } from './ui/CurrencyDisplay';

interface MerciMZPlusProps {
  saleId: string;
  referrerId?: string;
  productId: string;
  onContinue: () => void;
}

export const MerciMZPlus: React.FC<MerciMZPlusProps> = ({
  saleId,
  referrerId,
  productId,
  onContinue
}) => {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | 'already_processed'>('success');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function initAndSync() {
      try {
        console.log('[MerciMZPlus] Starting auto-detection and reward distribution system for sale:', saleId);

        // 1. Fetch the product details for the page display
        const { data: prod, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .maybeSingle();

        if (prodError || !prod) {
          throw new Error('Produit introuvable lors de l’initialisation de la page de confirmation.');
        }
        setProduct(prod);

        // 2. Synchronize purchase in real-time (commissions, XP, leaderboard points, stats)
        const syncResult = await PurchaseSyncService.syncPurchase(saleId, referrerId || '', productId);

        if (syncResult.success) {
          if (syncResult.alreadyProcessed) {
            setSyncStatus('already_processed');
            setMessage('Cette vente a déjà été détectée et créditée avec succès.');
          } else {
            setSyncStatus('success');
            setMessage('Votre achat a été traité. La commission de l’ambassadeur, ses points et sa progression ont été mis à jour en temps réel !');
          }
        } else {
          setSyncStatus('error');
          setMessage(syncResult.message || 'La vente n’a pas pu être créditée automatiquement.');
        }

      } catch (err: any) {
        console.error('[MerciMZPlus] Sync process error:', err);
        setSyncStatus('error');
        setMessage(err.message || 'Une erreur est survenue lors de la finalisation.');
      } finally {
        setLoading(false);
      }
    }

    if (saleId && productId) {
      initAndSync();
    } else {
      setLoading(false);
      setSyncStatus('error');
      setMessage('Paramètres de transaction manquants.');
    }
  }, [saleId, referrerId, productId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[500] bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-6"></div>
        <Sparkles className="text-yellow-500 animate-pulse mb-2" size={24} />
        <h2 className="text-2xl font-black uppercase tracking-widest text-white">Sécurisation et Validation...</h2>
        <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mt-2 max-w-sm">
          Nous détectons votre transaction Chariow et créditons les récompenses d’affiliation en temps réel.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[400] bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto selection:bg-yellow-500 selection:text-black font-sans">
      {/* Background visual halo effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-yellow-500/10 blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-neutral-900 border border-white/10 rounded-[3rem] p-8 sm:p-10 shadow-3xl text-center space-y-8 relative overflow-hidden"
      >
        {/* Confirmed Order Badge */}
        <div className="mx-auto w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.15)] animate-bounce">
          <CheckCircle2 size={48} />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.2em]">Ascension Validée • MZ+ Direct</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Félicitations !</h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Votre commande a été traitée avec succès et de manière entièrement sécurisée.
          </p>
        </div>

        {/* Product Details Recap Card */}
        {product && (
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl text-left flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[8px] text-yellow-500 font-extrabold uppercase bg-yellow-500/10 px-2 py-0.5 rounded">Achat direct</span>
                <h4 className="text-white font-extrabold text-sm">{product.name}</h4>
                <p className="text-zinc-400 font-mono text-[10px] uppercase mt-0.5">ID: {saleId.substring(0, 15)}...</p>
              </div>
            </div>
            <div className="text-right font-mono font-black text-white shrink-0">
              <CurrencyDisplay amount={product.price} />
            </div>
          </div>
        )}

        {/* Sync notification message */}
        <div className={`p-4 rounded-2xl border text-xs flex gap-3 text-left ${
          syncStatus === 'success' || syncStatus === 'already_processed'
            ? 'bg-green-500/5 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {syncStatus === 'success' || syncStatus === 'already_processed' ? (
            <ShieldCheck size={20} className="shrink-0 text-green-500" />
          ) : (
            <RefreshCw size={20} className="shrink-0 text-red-500 animate-spin" />
          )}
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider block">Intégration d'Écosystème MZ+</span>
            <p className="font-medium text-zinc-300">{message}</p>
          </div>
        </div>

        {/* Access link & actions */}
        <div className="pt-2 flex flex-col gap-3">
          {product?.final_link && (
            <a
              href={product.final_link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white hover:bg-zinc-200 text-black py-4.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[0_15px_30px_rgba(255,255,255,0.06)] active:scale-95 transition-all"
            >
              Accéder au produit maintenant
              <ExternalLink size={14} />
            </a>
          )}

          <button
            onClick={onContinue}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white py-4 rounded-xl font-extrabold uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5 transition-all"
          >
            Fermer et retourner dans l'univers MZ+
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Security / trust seals */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-8 opacity-40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400">
            <ShieldCheck size={14} className="text-yellow-500" /> Secure
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400">
            <Award size={14} className="text-yellow-500" /> Premium
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400">
            <Star size={14} className="text-yellow-500" /> Verified
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default MerciMZPlus;
