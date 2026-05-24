import { createClient } from '@supabase/supabase-js';

const RAW_URL = process.env.VITE_SUPABASE_URL || 'https://ydkicdhcylpdffuzgdvm.supabase.co';
const SUPABASE_URL = RAW_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON || '');

async function checkTables() {
    console.log('--- Database Health Check ---');
    console.log('URL:', SUPABASE_URL);
    console.log('Using Service Role:', !!SUPABASE_SERVICE_ROLE_KEY);
    
    const tables = [
        'users',
        'ranks',
        'mz_rewards_time_tracking',
        'mz_challenge_3j_state',
        'mz_background_notifications_log',
        'mz_app_config'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
            console.error(`[FAIL] Table ${table}:`, error.message, `(Code: ${error.code})`);
        } else {
            console.log(`[OK] Table ${table}`);
            if (table === 'users') {
                console.log('  Checking users columns:');
                const columnsToTest = ['xp', 'weekly_xp', 'monthly_xp', 'last_xp_update', 'rank_id', 'rank_name'];
                for (const col of columnsToTest) {
                   const { error: colErr } = await supabase.from('users').select(col).limit(0);
                   if (colErr) {
                       console.error(`    [MISSING] Column ${col}:`, colErr.message);
                   } else {
                       console.log(`    [OK] Column ${col}`);
                   }
                }
            }
            if (table === 'ranks') {
                console.log('  Checking ranks columns:');
                const columnsToTest = ['id', 'name', 'xp', 'min_xp', 'min_points'];
                for (const col of columnsToTest) {
                    const { error: colErr } = await supabase.from('ranks').select(col).limit(0);
                    if (colErr) {
                        console.error(`    [MISSING] Column ${col}:`, colErr.message);
                    } else {
                        console.log(`    [OK] Column ${col}`);
                    }
                }
            }
        }
    }
}

checkTables();
