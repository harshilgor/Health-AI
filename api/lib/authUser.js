import { getSupabaseAdmin } from './supabaseServer.js';

function getBearerToken(req) {
  const header = req.headers?.authorization || '';
  if (typeof header !== 'string') return '';
  const trimmed = header.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) return '';
  return trimmed.slice(7).trim();
}

/**
 * Returns authed Supabase user id from Authorization header.
 * - If no bearer token is present, returns null (so we can support anonymous/local mode).
 * - If a token is present but invalid, throws 401.
 */
export async function getAuthedUserId(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const err = new Error('SUPABASE not configured');
    err.status = 503;
    throw err;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  return data.user.id;
}

