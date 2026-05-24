import { createClient } from '@supabase/supabase-js';

const RAW_URL = process.env.VITE_SUPABASE_URL || 'https://ydkicdhcylpdffuzgdvm.supabase.co';
const SUPABASE_URL = RAW_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON || '');

async function runTest() {
    const userId = "a7e28b18-74f0-4448-8ecf-6431ab8fc1b7";
    console.log("=== DIAGNOSTIC FOR USER", userId, "===");

    // 1. Fetch user profile
    const { data: user, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (userErr) {
        console.error("Error fetching user:", userErr.message);
    } else if (!user) {
        console.error("User not found!");
    } else {
        console.log("User found:", {
            id: user.id,
            full_name: user.full_name,
            fcm_token: user.fcm_token ? `${user.fcm_token.substring(0, 15)}...` : 'NULL',
            last_active_at: user.last_active_at,
            created_at: user.created_at,
            challenge_3j_pref: user.store_preferences?.challenge_3j
        });
    }

    // 2. Fetch challenge 3j state
    const { data: challenge, error: challengeErr } = await supabase
        .from('mz_challenge_3j_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (challengeErr) {
        console.error("Error fetching challenge state:", challengeErr.message);
    } else {
        console.log("Challenge 3J state in DB:", challenge ? {
            presented: challenge.presented,
            started_at: challenge.started_at,
            j1_completed: challenge.j1_completed,
            j2_presented: challenge.j2_presented,
            j3_presented: challenge.j3_presented,
            j3_completed: challenge.j3_completed,
            cancelled: challenge.cancelled
        } : "NO RECORD FOUND");
    }

    // 3. Fetch list of recent pings in mz_rewards_time_tracking
    const { data: pings, error: pingsErr } = await supabase
        .from('mz_rewards_time_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('last_ping', { ascending: false })
        .limit(5);

    if (pingsErr) {
        console.error("Error fetching pings:", pingsErr.message);
    } else {
        console.log("Pings in mz_rewards_time_tracking:", pings);
    }

    // 4. Fetch background notifications logs for this user
    const { data: logs, error: logsErr } = await supabase
        .from('mz_background_notifications_log')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false });

    if (logsErr) {
        console.error("Error fetching notification logs:", logsErr.message);
    } else {
        console.log("Background Notification Logs:", logs);
    }
}

runTest();
