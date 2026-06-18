import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key';

if (supabaseUrl === 'https://dummy.supabase.co') {
  console.error('⚠️ CRITICAL: Faltan variables de entorno VITE_SUPABASE_URL. La app no funcionará.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
