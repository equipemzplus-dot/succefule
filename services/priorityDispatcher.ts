import { createClient } from '@supabase/supabase-js';
import { sendPush } from '../notifications.js';

const RAW_URL = process.env.VITE_SUPABASE_URL || 'https://ydkicdhcylpdffuzgdvm.supabase.co';
const SUPABASE_URL = RAW_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for backend bypass

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');

export async function runPriorityDispatcher() {
    console.log('[Dispatcher] Checking for pending background notifications...');
    
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;
    const SUPABASE_URL_ENV = process.env.VITE_SUPABASE_URL;
    
    if (!SUPABASE_SERVICE_ROLE && !SUPABASE_ANON) {
        console.error('[Dispatcher] CRITICAL: No Supabase keys found in environment variables. Check SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_ANON_KEY.');
        return;
    }

    if (!SUPABASE_URL_ENV) {
        console.error('[Dispatcher] CRITICAL: VITE_SUPABASE_URL is missing.');
        return;
    }

    try {
        // 1. Fetch users with active challenges
        const fetchChallenges = async () => {
            try {
                const { data, error } = await supabase
                    .from('mz_challenge_3j_state')
                    .select('user_id')
                    .eq('presented', true)
                    .eq('cancelled', false)
                    .eq('j3_completed', false);

                if (error) {
                    if (error.code === '42P01') {
                        console.warn('[Dispatcher] Table mz_challenge_3j_state not found. Skipping challenge-based notifications.');
                        return { data: [], error: null };
                    }
                    return { data: null, error };
                }
                return { data, error: null };
            } catch (e) {
                console.error('[Dispatcher] Unexpected error querying mz_challenge_3j_state:', e);
                return { data: [], error: null };
            }
        };

        const { data: challengeUsers, error: challengeError } = await fetchChallenges();
        if (challengeError) {
            console.error('[Dispatcher] challengeError:', JSON.stringify(challengeError));
            return;
        }

        const activeChallengeUserIds = new Set(challengeUsers?.map(c => c.user_id) || []);

        // 2. Fetch ALL activity tracking to compute precise last ping dates globally
        const { data: allPings, error: pingsError } = await supabase
            .from('mz_rewards_time_tracking')
            .select('user_id, last_ping')
            .order('last_ping', { ascending: false });

        if (pingsError && pingsError.code !== '42P01') {
            console.error('[Dispatcher] pingsError fetching activity:', pingsError);
        }

        const lastPingMap = new Map<string, string>();
        if (allPings) {
            for (const p of allPings) {
                if (!lastPingMap.has(p.user_id) && p.last_ping) {
                    lastPingMap.set(p.user_id, p.last_ping);
                }
            }
        }

        // 3. Fetch user data for ALL registrants
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, fcm_token, full_name, last_active_at, created_at, store_preferences');

        if (usersError) {
            console.error('[Dispatcher] usersError:', usersError);
            throw usersError;
        }

        console.log(`[Dispatcher] Found ${usersData?.length || 0} registered users. Evaluating triggers...`);
        const today = new Date().toISOString().split('T')[0];

        for (const userData of (usersData || [])) {
            const userId = userData.id;
            try {
                const hasActiveChallenge = activeChallengeUserIds.has(userId);
                
                let notifType: string | null = null;
                let title = '';
                let body = '';
                let url = '/';
                let inactivityNeeded = 60; // Default

                if (hasActiveChallenge) {
                    // --- FLOW 1: EXISTING 3-DAY CHALLENGE INACTIVITY AND SCENARIOS ---
                    const todayStr = new Date().toISOString().split('T')[0];
                    const userPingToday = allPings?.find(t => t.user_id === userId && t.last_ping && t.last_ping.startsWith(todayStr));
                    const lastActivityDate = userPingToday?.last_ping ? new Date(userPingToday.last_ping) : new Date(0);
                    const secondsSinceLastActivity = (Date.now() - lastActivityDate.getTime()) / 1000;

                    const { data: challenge, error: stateError } = await supabase
                        .from('mz_challenge_3j_state')
                        .select('*')
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (stateError || !challenge) continue;

                    const isChallengeActiveDoubleCheck = !challenge.cancelled && !challenge.j3_completed;
                    if (!isChallengeActiveDoubleCheck) continue;

                    inactivityNeeded = 60; // Default for challenge

                    if (secondsSinceLastActivity >= 86400) {
                        // Level 3 — Inactivité prolongée (72h+)
                        if (secondsSinceLastActivity >= 259200) {
                            notifType = 'inactivity_l3';
                            inactivityNeeded = 259200;
                            const msgs = [
                                { t: "⚠️ Ton accès au défi expire bientôt", b: "On n'aime pas voir un talent s'éteindre. Ta place dans le groupe est menacée par ton inactivité. Reviens sauver ton projet." },
                                { t: "🤔 On a presque cru que tu aviez réussi !", b: "On s'attendait à voir ta commission tomber comme les autres... mais le tableau de bord est vide. Un souci technique ?" },
                                { t: "🛑 Dernier rappel pour ton objectif", b: "Tu avais un plan clair il y a 3 jours. Le quotidien a repris le dessus ? Ne laisse pas tes rêves de liberté s'évaporer." }
                            ];
                            const pick = msgs[Math.floor(Math.random() * msgs.length)];
                            title = pick.t;
                            body = pick.b;
                            url = '/dashboard';
                        }
                        // Level 2 — Ignore la première notification (48h+)
                        else if (secondsSinceLastActivity >= 172800) {
                            notifType = 'inactivity_l2';
                            inactivityNeeded = 172800;
                            const msgs = [
                                { t: "🔍 Alima a commencé en même temps que toi...", b: "Elle vient de valider sa première commission. Tu as tout ce qu'il faut pour faire de même, reviens vite !" },
                                { t: "📍 Quelqu'un près de chez toi a réussi", b: "Un membre de ta région vient de terminer le défi 3 jours. Et toi, où en es-tu dans ta progression ?" },
                                { t: "💬 « Je n'y croyais pas, et pourtant... »", b: "C'est le message qu'on a reçu d'un membre qui était bloqué au même stade que toi. Reprends ton élan." }
                            ];
                            const pick = msgs[Math.floor(Math.random() * msgs.length)];
                            title = pick.t;
                            body = pick.b;
                            url = '/dashboard';
                        }
                        // Level 1 — Première absence (24h+)
                        else {
                            notifType = 'inactivity_l1';
                            inactivityNeeded = 86400;
                            const msgs = [
                                { t: "👋 Hey, ton défi t'attend toujours 🔥", b: "Chaque jour compte dans ton évolution. Reviens continuer là où tu t'es arrêté." },
                                { t: "🚀 Ton élan est précieux", b: "Tu étais bien parti... ne casse pas cette dynamique maintenant. Ton futur toi te remerciera." },
                                { t: "⚡ Ne laisse pas le chrono gagner", b: "Ton Jour 2 ou 3 est prêt. Connecte-toi pour valider l'étape et passer au niveau supérieur." }
                            ];
                            const pick = msgs[Math.floor(Math.random() * msgs.length)];
                            title = pick.t;
                            body = pick.b;
                            url = '/dashboard';
                        }
                    }

                    // --- CHALLENGE SPECIFIC NOTIFICATIONS (ONLY IF < 24H INACTIVE OR NO INACTIVITY TRIGGERED) ---
                    if (!notifType) {
                        const startedAtDate = challenge.started_at ? new Date(challenge.started_at).toISOString().split('T')[0] : null;
                        const isNextDayPlus = startedAtDate && startedAtDate < today;

                        const dateObj = new Date();
                        const dayBeforeYesterday = new Date(dateObj);
                        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
                        const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split('T')[0];
                        const isDay3Strict = startedAtDate && startedAtDate <= dayBeforeYesterdayStr;

                        const j2CompAt = challenge.j2_completed_at ? new Date(challenge.j2_completed_at).toISOString().split('T')[0] : null;
                        const isDay3TimeAfterJ2 = j2CompAt && j2CompAt < today;

                        // CAS : Jour 3 mais Jour 2 non complété (Upsell Premium après 5 min)
                        if (isDay3Strict && !challenge.j2_completed) {
                            notifType = 'challenge_j2_late_j3_upsell';
                            title = "👋 Hey, c’est Axis.";
                            body = "🔥 Je vois que tu n’as pas encore généré tes premiers revenus. 👑 Beaucoup de membres Premium l’ont déjà fait. 🚀 Il est peut-être temps de passer au niveau supérieur.";
                            url = '/dashboard?tab=flash_offer';
                            inactivityNeeded = 300; // 5 MINUTES (300 secondes) pour ce cas précis
                        }
                        // Message du Jour 3 (Si J2 complété hier ou avant)
                        else if (isDay3TimeAfterJ2 && !challenge.j3_presented && !challenge.j3_completed) {
                             notifType = 'challenge_j3_start';
                             title = "👑 Le grand final, c'est aujourd'hui !";
                             body = "C'est ton Jour 3. Tu es à deux doigts de l'apothéose. Finis ce que tu as commencé en beauté, je t'attends.";
                             url = '/dashboard';
                        }
                        // Rappel Jour 2 (Si commencé mais pas fini)
                        else if (challenge.j2_started_at && !challenge.j2_completed) {
                            notifType = 'challenge_j2_reminder';
                            title = "✨ Ne t'arrête pas en si bon chemin...";
                            body = "Tu as déjà commencé le Jour 2, c'est le plus gros du travail ! Reprends ton élan, tu vas y arriver.";
                            url = '/dashboard';
                        }
                        // Message du Jour 2 (Automatique le lendemain, si pas encore commencé)
                        else if (isNextDayPlus && !challenge.j2_started_at && !challenge.j2_completed && !challenge.j3_presented) {
                            notifType = 'challenge_j2_start';
                            title = "🌅 Nouvelle journée, nouvelle étape.";
                            body = "Coucou ! Prêt pour le Jour 2 ? On monte d'un cran aujourd'hui. Connecte-toi pour découvrir ta mission.";
                            url = '/dashboard';
                        }
                        // Rappel Jour 1 (Seulement le jour même du début)
                        else if (!isNextDayPlus && challenge.started_at && !challenge.j1_completed) {
                            notifType = 'challenge_j1_reminder';
                            title = "🚀 On commence ensemble ?";
                            body = "Ton défi est lancé et le chrono tourne. Je sais que tu as ce qu'il faut pour valider ce Jour 1. Go !";
                            url = '/dashboard';
                        } 
                        // Succès Jour 1 (Félicitations immédiates après inactivité)
                        else if (challenge.j1_completed && !challenge.j2_presented) {
                            notifType = 'challenge_j1_success';
                            title = "🌟 Fier de toi !";
                            body = "Le Jour 1 est dans la poche. Repose-toi bien, demain on attaque la suite. Tu as déjà fait le plus dur : commencer.";
                            url = '/dashboard';
                        }
                    }

                    // CHECK INACTIVITY DURATION FOR CHALLENGE NOTIFS
                    if (notifType && secondsSinceLastActivity < inactivityNeeded) {
                        console.log(`[Dispatcher] Challenge User ${userId} matches ${notifType} but only inactive for ${Math.round(secondsSinceLastActivity)}s (Needs ${inactivityNeeded}s). Skipping.`);
                        notifType = null;
                    }

                } else {
                    // --- FLOW 2: GLOBAL INACTIVITY SYSTEM (WHEN 3-DAY CHALLENGE IS NOT ACTIVE) ---
                    let lastActivityDate: Date | null = null;
                    
                    const userPingStr = lastPingMap.get(userId);
                    if (userPingStr) {
                        lastActivityDate = new Date(userPingStr);
                    }
                    
                    if (userData.last_active_at) {
                        const fieldDate = new Date(userData.last_active_at);
                        if (!lastActivityDate || fieldDate > lastActivityDate) {
                            lastActivityDate = fieldDate;
                        }
                    }
                    
                    if (!lastActivityDate && userData.created_at) {
                        lastActivityDate = new Date(userData.created_at);
                    }
                    
                    const finalLastActivity = lastActivityDate || new Date(0);
                    const secondsSinceLastActive = (Date.now() - finalLastActivity.getTime()) / 1000;

                    // Levels of global inactivity (72h+, 48h+, 24h+)
                    if (secondsSinceLastActive >= 259200) { // 72h+ (Level 3 - Provocative / Electrostim)
                        notifType = 'global_inactivity_l3';
                        inactivityNeeded = 259200;
                        const msgs = [
                            { t: "🛑 Tu abandonnes déjà tes rêves ?", b: "Le succès demande de la discipline. Seuls ceux qui s'accrochent obtiennent des résultats. Reviens agir !" },
                            { t: "🤔 Est-ce que tu es vraiment sérieux ?", b: "Si tu n'agis pas pour tes objectifs, personne ne le fera à ta place. Reviens faire ta différence." },
                            { t: "👑 Réveille l'entrepreneur en toi !", b: "L'inactivité est le pire ennemi de tes revenus. Reprends le contrôle et accède à ton espace privé." }
                        ];
                        const pick = msgs[Math.floor(Math.random() * msgs.length)];
                        title = pick.t;
                        body = pick.b;
                        url = '/dashboard';
                    } else if (secondsSinceLastActive >= 172800) { // 48h+ (Level 2 - Communities)
                        notifType = 'global_inactivity_l2';
                        inactivityNeeded = 172800;
                        const msgs = [
                            { t: "🔥 Ça bouge fort dans la communauté !", b: "Plusieurs membres viennent de valider de nouvelles commissions d'affiliation. Ne reste pas à la traîne !" },
                            { t: "⏳ Le temps passe, ton projet avance-t-il ?", b: "Deux jours d'absence, c'est deux jours d'opportunités de revenus manquées. Reprends ton élan." },
                            { t: "💡 De nouvelles stratégies d'affiliation", b: "L'élite de la MZ+ partage ses secrets. Connecte-toi vite pour découvrir la suite." }
                        ];
                        const pick = msgs[Math.floor(Math.random() * msgs.length)];
                        title = pick.t;
                        body = pick.b;
                        url = '/dashboard';
                    } else if (secondsSinceLastActive >= 86400) { // 24h+ (Level 1 - Sweet / Caring)
                        notifType = 'global_inactivity_l1';
                        inactivityNeeded = 86400;
                        const msgs = [
                            { t: "👋 Tu nous manques sur MZ+ !", b: "La constance est la clé pour automatiser tes revenus. Reviens faire un tour sur ton tableau de bord." },
                            { t: "🚀 Ton business n'attend que toi", b: "Même 5 minutes par jour font toute la différence. Connecte-toi pour garder le rythme !" },
                            { t: "✨ Un pas de plus vers tes objectifs", b: "Prends un instant aujourd'hui pour faire évoluer tes commissions d'affiliation." }
                        ];
                        const pick = msgs[Math.floor(Math.random() * msgs.length)];
                        title = pick.t;
                        body = pick.b;
                        url = '/dashboard';
                    }

                    // Check if this notification has been sent SINCE the user's last activity
                    if (notifType) {
                        try {
                            const { data: logs, error: logError } = await supabase
                                .from('mz_background_notifications_log')
                                .select('sent_at')
                                .eq('user_id', userId)
                                .eq('notif_type', notifType)
                                .order('sent_at', { ascending: false })
                                .limit(1);

                            if (logError && logError.code !== '42P01') {
                                console.error(`[Dispatcher] Error checking log for global inactivity of user ${userId}:`, logError);
                            } else if (logs && logs.length > 0) {
                                const lastSentAt = new Date(logs[0].sent_at);
                                if (lastSentAt.getTime() > finalLastActivity.getTime()) {
                                    console.log(`[Dispatcher] User ${userId} matches global ${notifType} but has already been notified on ${lastSentAt.toISOString()} which is after last activity ${finalLastActivity.toISOString()}. Skipping to avoid spam.`);
                                    notifType = null;
                                }
                            }
                        } catch (e) {
                            console.error('[Dispatcher] Unexpected error checking global inactivity log:', e);
                        }
                    }
                }

                if (notifType) {
                    // Check log to avoid duplicate notifications
                    let hasBeenSent = false;
                    try {
                        const { data: log, error: logError } = await supabase
                            .from('mz_background_notifications_log')
                            .select('id')
                            .eq('user_id', userId)
                            .eq('notif_type', notifType)
                            .maybeSingle();

                        if (logError && logError.code !== '42P01') {
                            console.error(`[Dispatcher] Error checking log for ${userId}:`, logError);
                            continue;
                        }
                        if (log) hasBeenSent = true;
                    } catch (e) {
                        console.error('[Dispatcher] Unexpected error checking notification log:', e);
                    }

                    if (!hasBeenSent) {
                        // 1. Create Internal Notification inside database for in-app cloche
                        try {
                            const isPremiumUpsell = notifType.includes('upsell') || notifType.includes('inactivity');
                            const { error: insErr } = await supabase.from('internal_notifications').insert({
                                recipient_id: userId,
                                sender_id: userId, // Avoids 'system' UUID type casting error
                                type: notifType,
                                message: body,
                                is_read: false,
                                title: title,
                                metadata: { 
                                    title: title,
                                    scenario: notifType, 
                                    is_blink: isPremiumUpsell,
                                    icon_type: isPremiumUpsell ? 'premium_upsell' : (notifType.includes('success') ? 'success' : 'default'),
                                    cta_label: isPremiumUpsell ? 'Profiter de l\'offre ⚡' : undefined
                                }
                            });

                            if (insErr) {
                                console.warn('[Dispatcher] Failed to insert with complete schema, retrying with basic fallback schema:', insErr.message);
                                await supabase.from('internal_notifications').insert({
                                    recipient_id: userId,
                                    sender_id: userId,
                                    type: notifType,
                                    message: body,
                                    is_read: false
                                });
                            }
                            console.log(`[Dispatcher] Successfully created internal notification in DB for ${userId}: ${notifType}`);
                        } catch (dbErr) {
                            console.error(`[Dispatcher] Error creating internal database notification:`, dbErr);
                        }

                        // 2. Perform the traditional Background Push Notification (FCM) if a token exists
                        if (userData.fcm_token) {
                            const tokenStart = userData.fcm_token.substring(0, 10);
                            console.log(`[Dispatcher] Attempting to send ${notifType} to user ${userId} (Token start: ${tokenStart}...)`);
                            try {
                                const sendResult = await sendPush(userData.fcm_token, title, body, { url });
                                console.log(`[Dispatcher] sendPush result for ${userId}:`, sendResult);
                            } catch (pushErr) {
                                console.error(`[Dispatcher] Failed to send push to ${userId}:`, pushErr);
                            }
                        } else {
                            console.log(`[Dispatcher] Skipping native push for ${userId} (no FCM token registered)`);
                        }

                        // Always log to avoid duplicate triggers
                        try {
                            const { error: insErr } = await supabase.from('mz_background_notifications_log').insert([{
                                user_id: userId,
                                notif_type: notifType
                            }]);
                            
                            if (insErr && insErr.code !== '42P01') {
                                console.error('[Dispatcher] Error logging notification:', insErr);
                            }

                            // Mark state as presented in challenge table to sync UI
                            if (notifType === 'challenge_j1_success') {
                                await supabase.from('mz_challenge_3j_state')
                                    .update({ j2_presented: true })
                                    .eq('user_id', userId);
                            }
                        } catch (logErr) {
                            console.error('[Dispatcher] Error executing notification bookkeeping:', logErr);
                        }
                    }
                }
            } catch (err: unknown) {
                const userErr = err as any;
                console.error(`[Dispatcher] Error processing user ${userId}:`, userErr.message || userErr);
            }
        }
    } catch (err: unknown) {
        const error = err as any;
        // Handle Error objects specially for JSON.stringify
        const errorDetail = {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            full: error
        };
        console.error('[Dispatcher] Error detail:', JSON.stringify(errorDetail, null, 2));
    }
}
