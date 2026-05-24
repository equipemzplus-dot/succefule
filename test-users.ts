import { supabase } from './services/supabase.ts';
async function run() {
  const { data, error } = await supabase.from('users').select('id, country, country_code, full_name').limit(1);
  console.log(data, error);
}
run();
