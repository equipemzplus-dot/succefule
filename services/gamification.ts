import { supabase } from './supabase';

export const rewardUserXP = async (userId: string, xpAmount: number) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('xp, weekly_xp, monthly_xp, last_xp_update, rank_id')
      .eq('id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === '42703') {
        console.warn("L'XP n'a pas pu être ajoutée car les colonnes requises n'existent pas dans la table 'users'. Lancez la commande SQL fournie pour les ajouter.");
        return false;
      }
      throw fetchError;
    }

    const currentXp = user?.xp || 0;
    let currentWeeklyXp = user?.weekly_xp || 0;
    let currentMonthlyXp = user?.monthly_xp || 0;
    const lastXpUpdate = user?.last_xp_update ? new Date(user.last_xp_update) : new Date(0);
    
    // Check if last_xp_update is from a previous week
    const now = new Date();
    // Get Monday of the current week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
    startOfWeek.setHours(0, 0, 0, 0);

    if (lastXpUpdate < startOfWeek) {
      currentWeeklyXp = 0; // Reset weekly XP
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    if (lastXpUpdate < startOfMonth) {
      currentMonthlyXp = 0; // Reset monthly XP
    }

    const newXp = currentXp + xpAmount;
    
    // Calculate new rank
    const PROGRESSION_LEVELS = [
      { id: 'debutant', name: 'Débutant', xp: 0 },
      { id: 'expert', name: 'Expert', xp: 120 },
      { id: 'legende', name: 'Légende', xp: 250 },
      { id: 'pro', name: 'Pro', xp: 700 },
      { id: 'elite', name: 'Élite', xp: 1500 },
    ];

    let newRankId = 1; // Default to 1 (Débutant)
    let newRankName = PROGRESSION_LEVELS[0].name;
    for (let i = 0; i < PROGRESSION_LEVELS.length; i++) {
      if (newXp >= PROGRESSION_LEVELS[i].xp) {
        newRankId = i + 1; // Rank 1-indexed to match App.tsx
        newRankName = PROGRESSION_LEVELS[i].name;
      }
    }

    const currentRankId = user?.rank_id || 1;

    const updateData: Record<string, any> = { 
      xp: newXp,
      weekly_xp: (currentWeeklyXp || 0) + xpAmount,
      monthly_xp: (currentMonthlyXp || 0) + xpAmount,
      last_xp_update: new Date().toISOString(),
      rank_id: newRankId
    };

    // Try update with rank_name first, but be ready for PGRST204 or 42703 (missing column)
    let { error: updateError } = await supabase
      .from('users')
      .update({ ...updateData, rank_name: newRankName })
      .eq('id', userId);

    // Handle common errors: missing column (42703), schema cache (PGRST204), or foreign key (23503)
    if (updateError && (updateError.code === '42703' || updateError.code === 'PGRST204' || updateError.code === '23503')) {
       console.warn(`[XP] Retrying update due to error ${updateError.code}. Removing rank fields.`);
       
       const safeUpdateData = { ...updateData };
       // If it fails, remove the rank-specific columns to ensure XP is saved at least
       delete (safeUpdateData as any).rank_id;
       delete (safeUpdateData as any).rank_name;

       const { error: fallbackError } = await supabase
         .from('users')
         .update(safeUpdateData)
         .eq('id', userId);
         
       updateError = fallbackError;
    }

    if (updateError) {
      console.error("[XP] Error finalizing XPReward update:", JSON.stringify(updateError));
      throw updateError;
    }

    if (!updateError && newRankId > currentRankId) {
      window.dispatchEvent(new CustomEvent('mz-rank-up-detected', { 
        detail: { rankId: newRankId, rankName: newRankName, oldXp: currentXp, newXp: newXp } 
      }));
    }

    if (updateError) {
      if (updateError.code === '42703') {
        console.warn("L'XP n'a pas pu être ajoutée car les colonnes n'existent pas dans la table 'users'. Lancez la commande SQL fournie.");
        return false;
      }
      throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error("Error rewarding XP:", error);
    return false;
  }
};
