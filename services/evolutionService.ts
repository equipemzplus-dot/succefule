import { supabase } from './supabase';

export interface MemberEvolution {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  old_level?: string;
  new_level?: string;
  type: 'level_up' | 'formation_completed' | 'achievement_unlocked';
  achievement_title?: string;
  message: string;
  created_at: string;
  reactions: Record<string, number>;
  user_reactions?: Record<string, Record<string, boolean>>; // userId -> { type: true }
  comment_count: number;
}

const EVOLUTIONS_TABLE = 'member_evolutions';

export const shareEvolution = async (evolution: Omit<MemberEvolution, 'id' | 'created_at' | 'reactions' | 'comment_count'>) => {
  try {
    const { data, error } = await supabase
      .from(EVOLUTIONS_TABLE)
      .insert({
        ...evolution,
        reactions: {},
        user_reactions: {},
        comment_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Check if we should trigger background notifications for other users
    const isSale = (
      evolution.type === 'achievement_unlocked' &&
      (
        evolution.achievement_title?.toLowerCase().includes('commission') ||
        evolution.achievement_title?.toLowerCase().includes('vente') ||
        evolution.new_level?.toLowerCase().includes('commission') ||
        evolution.new_level?.toLowerCase().includes('vente') ||
        evolution.message?.toLowerCase().includes('commission') ||
        evolution.message?.toLowerCase().includes('vente')
      )
    );

    const isLegende = (
      evolution.type === 'level_up' &&
      (
        evolution.new_level?.toLowerCase() === 'légende' ||
        evolution.new_level?.toLowerCase() === 'legende' ||
        evolution.new_level?.toLowerCase().includes('légende') ||
        evolution.new_level?.toLowerCase().includes('legende')
      )
    );

    if (isSale || isLegende) {
      // Execute notification dispatch block asynchronously in background without blocking return
      (async () => {
        try {
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
          
          // 1. Fetch recipient IDs from background notification log in the last 3 days
          const { data: recentLogs } = await supabase
            .from('mz_background_notifications_log')
            .select('user_id')
            .in('notif_type', ['evolution_broadcast_sale', 'evolution_broadcast_legende'])
            .gt('sent_at', threeDaysAgo);

          const usersOnCooldown = new Set((recentLogs || []).map(r => r.user_id));

          // 2. Fetch all other users with non-null FCM tokens
          const { data: allOtherUsers } = await supabase
            .from('users')
            .select('id, fcm_token')
            .neq('id', evolution.user_id)
            .not('fcm_token', 'is', null);

          if (allOtherUsers && allOtherUsers.length > 0) {
            // Filter recipients who are NOT on 3-day cooldown
            const eligibleRecipients = allOtherUsers.filter(u => u.id && u.fcm_token && !usersOnCooldown.has(u.id));

            if (eligibleRecipients.length > 0) {
              const userName = evolution.user_name || 'Un membre';
              
              let title = '';
              let body = '';
              const icon = isSale ? '/icon.png' : '/icon.png';
              
              if (isSale) {
                const saleTitles = [
                  `💰 MZ+ ça paye de feu ! (+1 commission)`,
                  `🔥 L'affiliation MZ+ en pleine action !`,
                  `💸 Une nouvelle commission validée !`,
                  `💎 Preuve que la méthode fonctionne !`,
                  `🚀 Encore des gains encaissés sur MZ+ !`
                ];
                
                const saleBodies = [
                  `💰 C'est prouvé, l'affiliation MZ+ fonctionne à merveille ! ${userName} vient d'encaisser sa commission. C'est à ton tour de faire des ventes ! Félicite-le !`,
                  `💸 Boom ! Nouvelle vente validée pour ${userName} ! L'affiliation MZ+ paye chaque jour ceux qui passent à l'action. Rejoins la vague de ventes ! Félicite-le !`,
                  `🔥 Incroyable réussite ! ${userName} prouve encore une fois que tout le monde peut vendre et encaisser sur MZ+. Passe à l'action toi aussi ! Félicite-le !`,
                  `⚡️ La méthode MZ+ ne ment jamais ! Nouvelle vente et nouvelle commission créditée pour ${userName}. Inspire-toi de son succès et encaisse toi aussi ! Félicite-le !`,
                  `💎 Encore une vente réussie ! ${userName} enchaîne les commissions d'affiliation sur MZ+. C'est la preuve ultime que ça marche ! Lance tes campagnes ! Félicite-le !`
                ];
                
                title = saleTitles[Math.floor(Math.random() * saleTitles.length)];
                body = saleBodies[Math.floor(Math.random() * saleBodies.length)];
              } else {
                const legendeTitles = [
                  `👑 Le sommet MZ+ est atteint ! (Grade Légende)`,
                  `🏆 Preuve ultime de réussite : Grade Légende !`,
                  `⭐ L'excellence MZ+ récompensée !`,
                  `🚀 Un nouveau leader passe Légende !`,
                  `💥 Historique : Le rang suprême est débloqué !`
                ];
                
                const legendeBodies = [
                  `👑 Énorme réussite ! ${userName} atteint le rang suprême de Légende et prouve que l'affiliation MZ+ mène au sommet. Tu peux le faire toi aussi ! Félicite-le !`,
                  `🔥 C'est historique ! ${userName} passe au grade ultime de Légende. La preuve absolue que la persévérance et la méthode MZ+ payent de fou. C'est ton tour d'exploser ! Félicite-le !`,
                  `🏆 Ascension légendaire ! ${userName} s'élève au rang de Légende sur MZ+. Un modèle de réussite qui montre que la liberté financière est accessible. Passe à l'attaque ! Félicite-le !`,
                  `⚡️ Incroyable distinction ! ${userName} décroche le précieux statut de Légende. C'est la preuve ultime que notre système crée des leaders d'affiliation. Vends de suite ! Félicite-le !`,
                  `💎 Objectif suprême validé par ${userName} qui devient Légende ! Si un membre y arrive, tu as toutes les cartes en main pour le faire aussi. Lance-toi ! Félicite-le !`
                ];
                
                title = legendeTitles[Math.floor(Math.random() * legendeTitles.length)];
                body = legendeBodies[Math.floor(Math.random() * legendeBodies.length)];
              }

              // Click action URL: Redirects to Evolution tab and focuses on the new post dynamically
              const clickUrl = `${window.location.origin}/?tab=evolution&scroll_to_post=${data.id}`;
              const tokensToSend = eligibleRecipients.map(r => r.fcm_token) as string[];

              // 3. Post to send-push server route to trigger multicast FCM background notifications
              const pushResponse = await fetch('/api/send-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tokens: tokensToSend,
                  title: title,
                  body: body,
                  url: clickUrl,
                  icon: icon
                })
              });

              if (!pushResponse.ok) {
                console.error("Failed to trigger FCM background push notifications via API status:", pushResponse.status);
              } else {
                console.log(`Successfully dispatched FCM background notifications to ${eligibleRecipients.length} users!`);
              }

              // 4. Create in-app notification in database for cloche icon as a fallback
              const fallbackNotifications = eligibleRecipients.map(r => ({
                recipient_id: r.id,
                sender_id: evolution.user_id,
                type: 'evolution_broadcast',
                title: title,
                message: body,
                is_read: false,
                metadata: {
                  icon_type: isSale ? 'money' : 'premium_upsell',
                  type: 'evolution_broadcast_notif',
                  target_tab: 'evolution',
                  post_id: data.id
                }
              }));
              await supabase.from('internal_notifications').insert(fallbackNotifications);

              // 5. Always record logs to enforce 3-day rate limiting logic
              const limitLogs = eligibleRecipients.map(r => ({
                user_id: r.id,
                notif_type: isSale ? 'evolution_broadcast_sale' : 'evolution_broadcast_legende'
              }));
              await supabase.from('mz_background_notifications_log').insert(limitLogs);
            }
          }
        } catch (err) {
          console.error("Error in evolution background notifier:", err);
        }
      })();
    }

    return data.id;
  } catch (error) {
    console.error("Error sharing evolution:", error);
    throw error;
  }
};

export const subscribeToEvolutions = (callback: (evolutions: MemberEvolution[]) => void) => {
  // Initial fetch
  const fetchEvolutions = async () => {
    const { data, error } = await supabase
      .from(EVOLUTIONS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      callback(data as MemberEvolution[]);
    }
  };

  fetchEvolutions();

  // Real-time subscription
  const subscription = supabase
    .channel('member_evolutions_realtime')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: EVOLUTIONS_TABLE 
    }, () => {
      fetchEvolutions(); // Refresh on any change
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const checkIfLevelShared = async (userId: string, levelName: string) => {
  if (!userId) return false;
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  try {
    const { data, error } = await supabase
      .from(EVOLUTIONS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('new_level', levelName)
      .eq('type', 'level_up')
      .maybeSingle();
    
    if (error) return false;
    return !!data;
  } catch (error) {
    console.error("Error checking shared level:", error);
    return false;
  }
};

export const checkIfAchievementShared = async (userId: string, achievementTitle: string) => {
  if (!userId) return false;
  
  // Check session validity first
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // If no session, we can't check authenticated records, but we don't want to throw invalid_token
    return false;
  }

  try {
    const { data, error } = await supabase
      .from(EVOLUTIONS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('new_level', achievementTitle)
      .eq('type', 'achievement_unlocked')
      .maybeSingle();
    
    if (error) {
      if (error.message?.includes('JWT') || error.message?.includes('token')) {
        console.warn("Auth token invalid while checking achievement share status.");
      }
      return false;
    }
    return !!data;
  } catch (err) {
    console.error("Error checking shared achievement:", err);
    return false;
  }
};

export const reactToEvolution = async (evolutionId: string, userId: string, reactionType: string) => {
  try {
    const { data: current, error: fetchError } = await supabase
      .from(EVOLUTIONS_TABLE)
      .select('reactions, user_reactions, user_id')
      .eq('id', evolutionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST204') {
        console.warn("Column user_reactions missing. Please run the migration script.");
      }
      throw fetchError;
    }

    const userReactions = current?.user_reactions ? { ...current.user_reactions } : {};
    const reactions = current?.reactions ? { ...current.reactions } : {};

    if (!userReactions[userId]) {
      userReactions[userId] = {};
    }

    const hasThisReaction = userReactions[userId][reactionType];
    
    if (hasThisReaction) {
      // Toggle off
      delete userReactions[userId][reactionType];
      reactions[reactionType] = Math.max(0, (reactions[reactionType] || 1) - 1);
    } else {
      // Toggle on
      userReactions[userId][reactionType] = true;
      reactions[reactionType] = (reactions[reactionType] || 0) + 1;
    }

    const { error: updateError } = await supabase
      .from(EVOLUTIONS_TABLE)
      .update({ 
        reactions,
        user_reactions: userReactions 
      })
      .eq('id', evolutionId);

    if (updateError) throw updateError;

    // Track the individual reaction for the notification system
    if (!hasThisReaction) {
      await supabase.from('evolution_reactions').upsert({
        user_id: userId,
        post_id: evolutionId,
        reaction_type: reactionType
      }, { onConflict: 'user_id,post_id,reaction_type' });

      // Notify the author of the post (if they are not the reactor themselves)
      if (current && current.user_id && current.user_id !== userId) {
        try {
          let reactorName = 'Un partenaire';
          const { data: userData } = await supabase.from('users').select('full_name').eq('id', userId).single();
          if (userData?.full_name) {
            reactorName = userData.full_name;
          }
          
          await supabase.from('internal_notifications').insert({
            recipient_id: current.user_id,
            sender_id: userId,
            type: 'evolution_reaction',
            message: `${reactorName} a réagi à ta publication d'évolution.`,
            is_read: false,
            title: 'Vibe de soutien ! 🔥',
            metadata: {
              post_id: evolutionId,
              reaction_type: reactionType,
              icon_type: 'reaction'
            }
          });
        } catch (notifErr) {
          console.error("Error inserting evolution_reaction notification:", notifErr);
        }
      }
    } else {
      // If toggling off, remove the record
      await supabase.from('evolution_reactions')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', evolutionId)
        .eq('reaction_type', reactionType);
    }
  } catch (error) {
    console.error("Error in reactToEvolution:", error);
  }
};

export const getRandomMessage = (type: 'level_up' | 'challenge' | 'mission', data: { userName?: string; levelName?: string; day?: number; missionTitle?: string }) => {
  const levelUpMessages = [
    `🔥 ENFIN ! Je viens de franchir un cap énorme et je passe officiellement au niveau ${data.levelName} sur MZ+ ! L'ascension continue.`,
    `💎 Je n'en reviens pas, niveau ${data.levelName} atteint ! Fier de ma progression et de ne rien avoir lâché sur MZ+.`,
    `🚀 Nouvelle étape validée ! J'atteins le niveau ${data.levelName} et je sens que je passe enfin un cap supérieur.`,
    `🌟 C'est fait ! Ma détermination paye enfin, je rejoins le rang ${data.levelName}. On ne s'arrête plus maintenant !`,
    `💪 Tellement fier d'annoncer que je suis désormais niveau ${data.levelName} ! MZ+ change vraiment la donne pour moi.`,
    `⚡️ Boom ! Niveau ${data.levelName} dans la poche. Je monte en puissance de jour en jour !`,
    `🎯 Objectif atteint : je suis officiellement au niveau ${data.levelName}. La route a été intense mais ça en valait la peine !`,
    `👑 Nouveau statut débloqué : ${data.levelName}. Fier de voir mon travail acharné porter ses fruits sur MZ+ !`
  ];

  const challengeMessages = [
    `🔥 Jour ${data.day} du Défi 3 Jours VALIDÉ ! Je ne lâche rien, la discipline paye. 🚀`,
    `💪 Encore une étape franchie ! Mon Défi Jour ${data.day} est dans la poche. Objectif 100% de réussite !`,
    `🚀 Le Jour ${data.day} de mon défi MZ+ est terminé. Je sens que je progresse chaque jour un peu plus !`,
    `⚡️ Pas d'excuses, juste des résultats. Jour ${data.day} du défi complété avec succès sur MZ+ !`,
    `🎯 Défi Jour ${data.day} validé ! L'élan est là, je fonce vers la ligne d'arrivée. 🔥`,
    `🌟 Quelle satisfaction ! Je viens de finir le Jour ${data.day} du défi 3 jours. On continue !`
  ];

  const missionMessages = [
    `🔥 Mission accomplie : ${data.missionTitle} ! Je monte en puissance sur MZ+. 🚀`,
    `💎 Une victoire de plus ! Je viens de terminer la mission "${data.missionTitle}". On ne s'arrête pas !`,
    `⚡️ Mission "${data.missionTitle}" validée ! Le travail finit toujours par payer. 💪`,
    `🎯 Objectif rempli pour la mission ${data.missionTitle}. Fier de mon avancée sur la plateforme !`,
    `🚀 Boom ! Mission ${data.missionTitle} dans la poche. L'ascension MZ+ continue !`,
    `🌟 C'est fait ! Je viens de boucler la mission "${data.missionTitle}". Fier de mon focus !`
  ];

  let pool = levelUpMessages;
  if (type === 'challenge') pool = challengeMessages;
  if (type === 'mission') pool = missionMessages;

  return pool[Math.floor(Math.random() * pool.length)];
};

export const getEvolutionMessages = (_userName: string, levelName: string) => {
  // Maintaining compatibility for level_up shares
  const allPossible = [
    `🔥 ENFIN ! Je viens de franchir un cap énorme et je passe officiellement au niveau ${levelName} sur MZ+ ! L'ascension continue.`,
    `💎 Je n'en reviens pas, niveau ${levelName} atteint ! Fier de ma progression et de ne rien avoir lâché sur MZ+.`,
    `🚀 Nouvelle étape validée ! J'atteins le niveau ${levelName} et je sens que je passe enfin un cap supérieur.`,
    `🌟 C'est fait ! Ma détermination paye enfin, je rejoins le rang ${levelName}. On ne s'arrête plus maintenant !`,
    `💪 Tellement fier d'annoncer que je suis désormais niveau ${levelName} ! MZ+ change vraiment la donne pour moi.`,
    `⚡️ Boom ! Niveau ${levelName} dans la poche. Je monte en puissance de jour en jour !`
  ];
  return allPossible;
};

export const generateWhatsAppLink = (message: string) => {
  const appUrl = window.location.origin;
  const encodedMessage = encodeURIComponent(`${message}\n\nVoir mon évolution sur MZ+ : ${appUrl}?tab=community`);
  return `https://wa.me/?text=${encodedMessage}`;
};
