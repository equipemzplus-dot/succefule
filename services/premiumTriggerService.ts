import { TRIGGER_PRIORITIES } from '../src/constants/triggerPriorities';
import { supabase } from './supabase';

export type TriggerType = 'popup' | 'axis' | 'push';
export type Scenario = 'mission_complete' | 'click_spike' | 'fallback' | 'streak_3d';

export interface ScenicMessage {
  type: TriggerType;
  message: string;
  priority?: number;
}

interface TriggerMessage {
  scenario: Scenario;
  type: TriggerType;
  messages: string[];
  ctas?: string[];
}

const MESSAGE_BANK: TriggerMessage[] = [
  {
    scenario: 'mission_complete',
    type: 'popup',
    messages: [
      "Félicitations pour cette étape. Mais soyons honnêtes : travailler dur manuellement ne suffit plus. L'automatisation Premium vous libère des tâches répétitives pour vous concentrer sur l'essentiel : encaisser en automatique. Ne sacrifiez plus votre temps précieux.",
      "Mission validée avec succès. Vous avez le potentiel, mais pourquoi continuer à brider vos résultats avec un système standard ? Sans l'arsenal Premium, vous laissez d'autres capturer l'audience que vous bâtissez. Prenez enfin le contrôle de vos gains.",
      "Félicitations. Vous progressez, mais rouler avec le frein à main serré limite vos gains. L'énergie que vous déployez mérite d'être récompensée à sa juste valeur. Passez Premium pour transformer chaque effort en un flux de revenus durable."
    ],
    ctas: [
      "Activer l'automatisation 💰",
      "Passer au niveau Elite 🏆",
      "Libérer mes commissions 🚀"
    ]
  },
  {
    scenario: 'mission_complete',
    type: 'axis',
    messages: [
      "Félicitations pour cette étape ! Mais pose-toi la question : veux-tu continuer à trimer manuellement pour des miettes, ou laisser l'automation Premium générer tes gains pendant ton sommeil ?",
      "Mission validée ! Tu as le profil idéal pour faire partie du cercle privé des 1% qui vivent de leur boutique. Ne reste pas bloqué au niveau amateur, passe Premium.",
      "Tu progresses vite, mais tes commissions actuelles ne récompensent pas tes efforts à leur juste valeur. Prends ta place légitime parmi l'élite !"
    ],
    ctas: [
      "Automatiser mes revenus 💤",
      "Rejoindre le Club Elite 💎",
      "Multiplier mes gains 📈"
    ]
  },
  {
    scenario: 'mission_complete',
    type: 'push',
    messages: [
      "🔥 Mission validée ! Ton niveau stagne alors que ton potentiel est énorme. Active Premium maintenant.",
      "🚀 Très bon travail ! L'élite MZ+ t'attend de l'autre côté pour débloquer tes gains réels.",
      "⚡ Tu as fait le plus dur. Déforce tes freins et active le multiplicateur de gains Premium."
    ]
  },
  {
    scenario: 'click_spike',
    type: 'popup',
    messages: [
      "🚨 ALERTE : Vos liens saturent ! Les visites s'accumulent, mais sans l'infrastructure de conversion Premium, vous laissez filer plus de 90 % de vos acheteurs. Sécurisez votre trafic et transformez ces clics en commissions immédiates.",
      "📈 Vos statistiques grimpent en flèche. C'est le carrefour décisif : allez-vous laisser ce pic de trafic s'éteindre bêtement ou le convertir en virement bancaire ? Activez vos funnels Premium automatisés dès maintenant.",
      "💡 Signal critique : Votre audience s'emballe ! Mais un trafic non converti est une perte d'argent invisible mais bien réelle. Donnez enfin à vos clics la puissance d'un système de conversion professionnel."
    ],
    ctas: [
      "Verrouiller mes ventes 🔒",
      "Activer mon funnel Premium ⚡",
      "Capturer mes commissions 🚀"
    ]
  },
  {
    scenario: 'click_spike',
    type: 'axis',
    messages: [
      "🔥 Tes liens prennent feu ! Chaque seconde perdue est une commission qui s'évapore et enrichit tes concurrents Premium. Sécurise-les vite !",
      "📈 Alerte trafic ! Tu as l'audience que tout le monde envie. Ne gâche pas cette opportunité unique, passe en conversion maximale Premium.",
      "⚡ Pic d'activité détecté ! C'est le signal clair que tu attendais. Rejoins l'excellence MZ+ pour valider tes premiers gros virements."
    ],
    ctas: [
      "Intercepter mes gains ⚡",
      "Activer la conversion max 📈",
      "Débloquer mes virements 💳"
    ]
  },
  {
    scenario: 'click_spike',
    type: 'push',
    messages: [
      "🚨 Alerte trafic : Tes liens chauffent ! Ne laisse plus tes commissions s'envoler chez d'autres.",
      "📈 Tes statistiques explosent ! Rejoins MZ+ Premium pour sceller tes gains avant qu'il ne soit trop tard.",
      "💰 Pic de clics détecté ! C'est l'instant parfait pour activer tes funnels Premium ultra-rentables."
    ]
  },
  {
    scenario: 'fallback',
    type: 'axis',
    messages: [
      "💡 Pourquoi continuer à stagner et galérer face à des algorithmes de plus en plus durs ? MZ+ Premium fait sauter les barrières et libère tes ventes.",
      "💎 Chaque jour passé sans le statut Premium est un manque à gagner invisible mais dramatique. Choisis d'automatiser et respire enfin.",
      "🚀 Tu mérites une vie libre, sans patron toxique et sans stress financier au quotidien. Fais confiance à tes clics et rejoins l'Elite."
    ],
    ctas: [
      "Faire sauter les barrières 🔓",
      "Respirer & Encaisser 🕊️",
      "Accéder à l'Elite 💎"
    ]
  },
  {
    scenario: 'streak_3d',
    type: 'popup',
    messages: [
      "🔥 Tu es actif dans la MZ+ depuis plusieurs jours maintenant… mais parfois, travailler dur sans les bonnes stratégies ralentit les résultats.\n\nC’est exactement pourquoi les membres premium évoluent plus vite. 👑🚀",
      "⏳ Tu avances, tu restes motivé et tu continues malgré l’absence de revenus… mais imagine ce que tu pourrais faire avec un meilleur accompagnement et les outils premium.\n\nParfois, passer au niveau supérieur change tout. 💎🔥",
      "🚀 Beaucoup abandonnent après quelques jours… toi, tu continues d’avancer dans la MZ+.\n\nMais pour obtenir des résultats différents, il faut parfois accéder à un niveau différent. Les membres premium ont justement cet avantage. 👑💎",
      "📈 3 jours de présence non-stop ! Ta discipline est remarquable. Mais sans outils de conversion d'élite, tu limites tes propres opportunités. Active MZ+ Premium dès aujourd'hui.",
      "💎 3 jours d'activité intense validés. Mais la régularité sans l'automation mène à la fatigue. Laisse l'infrastructure Premium travailler à ta place et encaisse en pilote automatique."
    ],
    ctas: [
      "Activer mon système premium 👑",
      "Voir ce que je peux débloquer 💎",
      "Accéder à l'avantage Premium 🚀",
      "Multiplier mes efforts 📈",
      "Passer en automatique 💤"
    ]
  },
  {
    scenario: 'streak_3d',
    type: 'axis',
    messages: [
      "🔥 Actif depuis 3 jours ! Ta constance est ta plus grande force, mais sans automatisation Premium, tu travailles deux fois plus pour deux fois moins.",
      "🚀 Félicitations pour ces 3 jours ! Tu as prouvé ta motivation. Maintenant, passe en vitesse supérieure avec les tunnels Elite.",
      "💡 3e jour de présence d'affilée. C'est le signal pour arrêter de faire tout manuellement et laisser le système Premium tourner en arrière-plan."
    ],
    ctas: [
      "Devenir Premium 👑",
      "Prendre mon raccourci 🚀",
      "Débloquer l'automation ⚡"
    ]
  },
  {
    scenario: 'streak_3d',
    type: 'push',
    messages: [
      "🔥 Activité de 3 jours : ta persévérance mérite d'être décuplée par les outils Premium !",
      "👑 3 jours non-stop : l'accompagnement d'élite n'attend plus que toi pour transformer tes efforts.",
      "🚀 Fier de tes 3 jours ? Imagine tes résultats s'ils étaient propulsés par MZ+ Premium."
    ]
  }
];

const TRIGGER_HISTORY_LIMIT = 10;
const COOLDOWN_HOURS = 3;

export class PremiumTriggerEngine {
  static async trigger(userId: string, scenario: Scenario, forceType?: TriggerType) {
    const priority = TRIGGER_PRIORITIES[scenario];

    // 1. Récupérer les données de l'utilisateur (niveau et dernier trigger)
    const { data: profile, error } = await supabase
      .from('users')
      .select('user_level, last_premium_trigger_at, premium_trigger_history')
      .eq('id', userId)
      .single();

    if (error || !profile || profile.user_level === 'niveau_mz_plus') return null;

    // 2. Vérification du Cooldown (3h entre chaque trigger)
    // Tous les triggers principaux (y compris click_spike et mission_complete) doivent respecter le cooldown de 3h
    if (profile.last_premium_trigger_at && scenario !== 'fallback') {
      const lastTrigger = new Date(profile.last_premium_trigger_at).getTime();
      const diff = Date.now() - lastTrigger;
      
      if (diff < COOLDOWN_HOURS * 60 * 60 * 1000) {
        console.log(`[PremiumTrigger] Cooldown active (Lvl ${priority}). Next possible in ${Math.round((COOLDOWN_HOURS * 60 * 60 * 1000 - diff) / 60000)} mins`);
        return null;
      }
    }

    // 3. Logique de sélection
    const types: TriggerType[] = ['popup', 'axis'];
    const selectedType = forceType || types[Math.floor(Math.random() * types.length)];
    
    const bankEntry = MESSAGE_BANK.find(m => m.scenario === scenario && m.type === selectedType);
    if (!bankEntry) return null;

    const messageIndex = Math.floor(Math.random() * bankEntry.messages.length);
    const message = bankEntry.messages[messageIndex];
    const cta = bankEntry.ctas ? bankEntry.ctas[messageIndex] : undefined;

    // 4. Enregistrer dans la base de données avec le niveau de priorité
    const newHistory = [
      { scenario, type: selectedType, priority, timestamp: new Date().toISOString() },
      ...(profile.premium_trigger_history || [])
    ].slice(0, TRIGGER_HISTORY_LIMIT);

    await supabase.from('users').update({
      last_premium_trigger_at: new Date().toISOString(),
      premium_trigger_history: newHistory
    }).eq('id', userId);

    return { type: selectedType, message, priority, cta };
  }

  static async registerPushTrigger(userId: string, scenario: Scenario) {
    const { data: profile } = await supabase.from('users').select('user_level').eq('id', userId).single();
    if (profile?.user_level === 'niveau_mz_plus') return;

    const bankEntry = MESSAGE_BANK.find(m => m.scenario === scenario && m.type === 'push');
    if (!bankEntry) return;

    const message = bankEntry.messages[Math.floor(Math.random() * bankEntry.messages.length)];

    try {
      const { error: insErr } = await supabase.from('internal_notifications').insert({
        recipient_id: userId,
        sender_id: userId, // Avoids 'system' UUID type casting error
        type: 'premium_upsell',
        message: message,
        is_read: false,
        metadata: { scenario }
      });

      if (insErr) {
        console.warn("[PremiumTrigger] Failed to insert with metadata, retrying with fallback schema:", insErr.message);
        await supabase.from('internal_notifications').insert({
          recipient_id: userId,
          sender_id: userId,
          type: 'premium_upsell',
          message: message,
          is_read: false
        });
      }
    } catch (e) {
      console.error("[PremiumTrigger] Error in registerPushTrigger:", e);
    }
  }

  static async reportActivity(userId: string) {
    const nowISO = new Date().toISOString();
    // Update local active time first
    await supabase.from('users').update({ last_active_at: nowISO }).eq('id', userId);

    try {
      // Fetch user profile for checking premium level, cooldown, and fallback preferences
      const { data: profile, error } = await supabase
        .from('users')
        .select('user_level, last_premium_trigger_at, store_preferences')
        .eq('id', userId)
        .single();

      if (error || !profile || profile.user_level === 'niveau_mz_plus') return;

      const todayStr = new Date().toISOString().split('T')[0];
      const prefs = profile.store_preferences || {};

      let streakData: { consecutive_days: number; last_active_date: string; streak_3d_triggered_at: string | null } | null = null;
      let useDatabaseTable = true;

      // Try fetching from the custom table
      try {
        const { data: streak, error: streakErr } = await supabase
          .from('user_activity_streaks')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (streakErr) {
          useDatabaseTable = false;
        } else if (streak) {
          streakData = {
            consecutive_days: streak.consecutive_days || 0,
            last_active_date: streak.last_active_date || '',
            streak_3d_triggered_at: streak.streak_3d_triggered_at || null
          };
        }
      } catch (err) {
        useDatabaseTable = false;
      }

      // If custom table is not created or query failed, fall back to store_preferences.activity_streak
      if (!useDatabaseTable) {
        const fallbackStreak = prefs.activity_streak || {};
        streakData = {
          consecutive_days: typeof fallbackStreak.consecutive_days === 'number' ? fallbackStreak.consecutive_days : 0,
          last_active_date: fallbackStreak.last_active_date || '',
          streak_3d_triggered_at: fallbackStreak.streak_3d_triggered_at || null
        };
      }

      if (!streakData) {
        streakData = {
          consecutive_days: 0,
          last_active_date: '',
          streak_3d_triggered_at: null
        };
      }

      const lastActiveStr = streakData.last_active_date;
      let newConsecutive = streakData.consecutive_days;
      let newTriggeredAt = streakData.streak_3d_triggered_at;

      if (lastActiveStr === '') {
        // Initial entry
        newConsecutive = 1;
      } else if (lastActiveStr !== todayStr) {
        const todayDate = new Date(todayStr);
        const lastDate = new Date(lastActiveStr);
        const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newConsecutive += 1;
        } else if (diffDays > 1) {
          newConsecutive = 1;
          newTriggeredAt = null; // Reset milestone trigger if streak was broken and restarted
        }
      }

      // We trigger the notification if consecutive days reached >= 3 and hasn't been triggered yet code
      const shouldTriggerStreak3D = newConsecutive >= 3 && !newTriggeredAt;

      if (shouldTriggerStreak3D) {
        // Respect Premium Level 1: check 3h cooldown between notification popups
        let cooldownActive = false;
        if (profile.last_premium_trigger_at) {
          const lastTrigger = new Date(profile.last_premium_trigger_at).getTime();
          const diff = Date.now() - lastTrigger;
          if (diff < COOLDOWN_HOURS * 60 * 60 * 1000) {
            cooldownActive = true;
          }
        }

        if (!cooldownActive) {
          // Send internal notification push
          const bankEntry = MESSAGE_BANK.find(m => m.scenario === 'streak_3d' && m.type === 'push');
          if (bankEntry) {
            const messageIndex = Math.floor(Math.random() * bankEntry.messages.length);
            const message = bankEntry.messages[messageIndex];
            
            const ctas = MESSAGE_BANK.find(m => m.scenario === 'streak_3d' && m.type === 'popup')?.ctas || ['Activer mon système premium 👑'];
            const cta = ctas[Math.floor(Math.random() * ctas.length)];

            try {
              const { error: insErr } = await supabase.from('internal_notifications').insert({
                recipient_id: userId,
                sender_id: userId, // Avoids 'system' UUID type casting error
                type: 'premium_upsell',
                message: message,
                is_read: false,
                metadata: { 
                  scenario: 'streak_3d', 
                  is_blink: true, 
                  cta_label: cta 
                }
              });

              if (insErr) {
                console.warn("[PremiumTrigger] Failed to insert 3D streak with metadata, retrying with fallback schema:", insErr.message);
                await supabase.from('internal_notifications').insert({
                  recipient_id: userId,
                  sender_id: userId,
                  type: 'premium_upsell',
                  message: message,
                  is_read: false
                });
              }
            } catch (e) {
              console.error("[PremiumTrigger] Error inserting streak_3d notification:", e);
            }

            newTriggeredAt = nowISO;

            // Mark cooldown update
            await supabase.from('users').update({
              last_premium_trigger_at: nowISO
            }).eq('id', userId);

            console.log(`[StreakTrigger] Successfully created 3D streak internal notification for user ${userId}`);
          }
        } else {
          console.log(`[StreakTrigger] 3D streak criteria met, but delayed by 3h general Premium Level 1 cooldown.`);
        }
      }

      // Save updated streak state
      if (useDatabaseTable) {
        await supabase.from('user_activity_streaks').upsert({
          user_id: userId,
          consecutive_days: newConsecutive,
          last_active_date: todayStr,
          streak_3d_triggered_at: newTriggeredAt,
          updated_at: nowISO
        });
      } else {
        const newPrefs = {
          ...prefs,
          activity_streak: {
            consecutive_days: newConsecutive,
            last_active_date: todayStr,
            streak_3d_triggered_at: newTriggeredAt,
            updated_at: nowISO
          }
        };
        await supabase.from('users').update({ store_preferences: newPrefs }).eq('id', userId);
      }

    } catch (err) {
      console.warn('[StreakTrigger] Failed to calculate or record activity streak:', err);
    }
  }
}
