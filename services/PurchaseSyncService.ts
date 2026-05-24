import { supabase } from './supabase';
import { AffiliateRewardEngine } from './AffiliateRewardEngine';

export class PurchaseSyncService {
  /**
   * Syncs and records a Chariow purchase into MZ+, checking for duplicates,
   * triggering commissions, points, progression, and real-time updates.
   */
  static async syncPurchase(
    saleId: string,
    referrerId: string,
    productId: string
  ): Promise<{ success: boolean; alreadyProcessed: boolean; message?: string }> {
    try {
      console.log('[PurchaseSyncService] Syncing purchase on return page:', { saleId, referrerId, productId });

      if (!saleId || saleId.includes('{sale_id}')) {
        return {
          success: false,
          alreadyProcessed: false,
          message: 'Sale ID invalide ou incomplet.'
        };
      }

      // 1. Double-crediting check using localStorage to avoid re-triggering on accidental page refreshes
      const storageKey = `mz_processed_sale_${saleId}`;
      if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) {
        console.log('[PurchaseSyncService] Sale already credited (detected in local cache):', saleId);
        return {
          success: true,
          alreadyProcessed: true,
          message: 'Cette vente a déjà été enregistrée.'
        };
      }

      // 2. Load product details to calculate commission and log visual stats
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (prodErr || !product) {
        console.error('[PurchaseSyncService] Product info could not be fetched for sync:', prodErr);
        return {
          success: false,
          alreadyProcessed: false,
          message: 'Produit introuvable lors de la synchronisation.'
        };
      }

      // 3. Register click / purchase count on product_stats to update stats in real-time
      if (referrerId) {
        try {
          // Increment sale count or statistics in Supabase
          const { data: stats, error: statsError } = await supabase
            .from('product_stats')
            .select('*')
            .eq('user_id', referrerId)
            .eq('product_id', productId)
            .maybeSingle();

          if (!statsError) {
            if (stats) {
              await supabase
                .from('product_stats')
                .update({ clicks: (stats.clicks || 0) + 1 })
                .eq('user_id', referrerId)
                .eq('product_id', productId);
            } else {
              await supabase
                .from('product_stats')
                .insert([{ user_id: referrerId, product_id: productId, clicks: 1 }]);
            }
          }
        } catch (err) {
          console.warn('[PurchaseSyncService] Failed to record product stats:', err);
        }
      }

      // 4. Distribute commission, XP, and community updates via AffiliateRewardEngine
      if (referrerId) {
        const rewardResult = await AffiliateRewardEngine.processAffiliateRewards({
          productId: product.id,
          productName: product.name,
          price: product.price,
          commissionAmount: product.commission_amount,
          referrerId: referrerId,
          saleId: saleId
        });

        if (!rewardResult.success) {
          console.error('[PurchaseSyncService] Failed to distribute affiliate rewards:', rewardResult.message);
          return {
            success: false,
            alreadyProcessed: false,
            message: rewardResult.message
          };
        }
      }

      // 5. Mark as successfully synced in local browser cache to prevent double-crediting
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify({
          syncedAt: new Date().toISOString(),
          productId,
          referrerId
        }));
      }

      return {
        success: true,
        alreadyProcessed: false,
        message: 'Achat Chariow synchronisé avec succès !'
      };
    } catch (err: any) {
      console.error('[PurchaseSyncService] Exception in syncPurchase:', err);
      return {
        success: false,
        alreadyProcessed: false,
        message: err.message || 'Erreur inconnue de synchronisation'
      };
    }
  }
}
