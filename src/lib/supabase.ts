import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gdwfpxedgugyqtqfmogu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_rpjP3BobMQ3Y-qmYGnO77g_thMq4f5a';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

