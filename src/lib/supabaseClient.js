import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Browser client for Supabase Auth (OAuth via Google).
export const supabase =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true } }) : null;

