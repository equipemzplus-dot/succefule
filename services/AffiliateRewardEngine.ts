import { supabase } from './supabase';
import { rewardUserXP } from './gamification';
import { shareEvolution } from './evolutionService';

export class AffiliateRewardEngine {
  /**
   * Distributes commissions, XP, internal notifications, and community evolution feed updates
   * for a successful closing of a Chariow product sale.
   */
  static async processAffiliateRewards(params: {
    productId: string;
    productName: string;
    price: number;
    commissionAmount: number;
    referrerId: string;
    saleId: string;
    customerEmail?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('[AffiliateRewardEngine] Distributing direct rewards for sale:', params.saleId);

      // 1. Fetch the advocate/referring user profile to customize message
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', params.referrerId)
        .maybeSingle();

      if (profileErr) {
        console.error('[AffiliateRewardEngine] Referrer profile not found:', profileErr);
      }

      const referrerName = profile?.full_name || 'Un ambassadeur';

      // 2. Insert Commission as AUTOMATICALLY APPROVED (No manual validation!)
      const { data: commData, error: commError } = await supabase
        .from('commissions')
        .insert([{
          user_id: params.referrerId,
          product_id: params.productId,
          amount: params.commissionAmount,
          status: 'approved' // Automatically approved! No manual validation!
        }])
        .select()
        .single();

      if (commError) {
        console.error('[AffiliateRewardEngine] Fail to record approved commission:', commError);
      } else {
        console.log('[AffiliateRewardEngine] Approved commission successfully recorded in Supabase!');
      }

      // 3. Award XP to the referrer for successful sales closure (e.g., 150 XP)
      const xpRewardAmount = 150;
      const xpSuccess = await rewardUserXP(params.referrerId, xpRewardAmount);
      console.log('[AffiliateRewardEngine] XP reward outcome:', xpSuccess ? 'Success' : 'Ignored or columns missing');

      // 4. Send Internal Notification to the affiliate vendor
      const notificationMsg = `🎉 Vente de "${params.productName}" confirmée ! Vous encaissez une commission de ${params.commissionAmount}€ directement dans votre portefeuille, ainsi que +${xpRewardAmount} XP d'ascension ! 🚀`;
      
      const { error: notifErr } = await supabase
        .from('internal_notifications')
        .insert([{
          recipient_id: params.referrerId,
          sender_id: '00000000-0000-0000-0000-000000000000', // system/admin sender uuid
          type: 'commission',
          message: notificationMsg,
          is_read: false
        }]);

      if (notifErr) {
        console.warn('[AffiliateRewardEngine] Could not insert internal notification:', notifErr);
      }

      // 5. Publish to local community Evolution Feed (all users can see it and comment)
      try {
        await shareEvolution({
          user_id: params.referrerId,
          user_name: referrerName,
          user_avatar: profile?.avatar_url || '',
          type: 'achievement_unlocked',
          achievement_title: 'Closing Chariow Validé',
          message: `🔥 ${referrerName} vient de closer la vente du produit "${params.productName}" en direct de sa boutique MZ+ ! Il encaisse une commission immédiate approuvée de ${params.commissionAmount}€ 💰 ainsi que +${xpRewardAmount} XP ! Félicitations ! 🎉`
        });
        console.log('[AffiliateRewardEngine] Evolution shared on the feed successfully!');
      } catch (evoErr) {
        console.warn('[AffiliateRewardEngine] Error sharing community evolution:', evoErr);
      }

      // 6. Post custom event so any active local UI updates immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mz-new-sale', {
          detail: {
            referrerId: params.referrerId,
            productId: params.productId,
            commissionAmount: params.commissionAmount,
            productName: params.productName
          }
        }));
      }

      return {
        success: true,
        message: 'Toutes les récompenses directes, commissions approuvées et points de fidélité ont été attribués avec succès.'
      };
    } catch (err: any) {
      console.error('[AffiliateRewardEngine] Exception in processAffiliateRewards:', err);
      return {
        success: false,
        message: err.message || "Erreur interne lors de l'attribution des commissions."
      };
    }
  }
}
