import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Server-only client. The service_role key must never reach the browser —
// every file that imports this module must be excluded from prerendering
// (`export const prerender = false`) so it only ever runs on the server.
export function getSupabaseAdmin() {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
