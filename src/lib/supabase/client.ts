import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // Clean up URL format if trailing /rest/v1 or slashes are present
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
