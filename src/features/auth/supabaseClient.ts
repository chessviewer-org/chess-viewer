import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// Validate that the URL is a valid HTTP/HTTPS URL, otherwise Supabase will crash on initialization.
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  console.warn('VITE_SUPABASE_URL is missing or invalid. Falling back to a placeholder URL. Authentication will not work until you configure your .env.local file with a valid URL (e.g., https://xxx.supabase.co).');
  supabaseUrl = 'https://placeholder.supabase.co';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


