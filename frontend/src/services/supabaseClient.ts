import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iekecrgipogdkycreqbc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qllqavPGE7kum20YazmeSA_5o_kwb-e';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
