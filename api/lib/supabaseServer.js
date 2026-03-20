import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase admin client (service role bypasses RLS).
 * Returns null if env is not configured.
 */
export function getSupabaseAdmin() {
  // Env vars sometimes include trailing whitespace/newlines from copy/paste.
  // Trimming prevents malformed URLs/keys that can cause opaque "fetch failed" errors.
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const MEAL_IMAGES_BUCKET = (process.env.SUPABASE_MEAL_BUCKET || 'meal-images').trim();
