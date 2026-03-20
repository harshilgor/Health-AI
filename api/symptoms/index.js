import { getSupabaseAdmin } from '../lib/supabaseServer.js';
import { getAuthedUserId } from '../lib/authUser.js';

function jsonError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonError(res, 503, 'Supabase not configured', {
      code: 'SUPABASE_NOT_CONFIGURED',
    });
  }

  let userId;
  try {
    userId = await getAuthedUserId(req);
  } catch (e) {
    return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
  }
  if (!userId) return jsonError(res, 401, 'Missing Authorization token');

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('symptoms')
      .select('energy,mood,digestion,notes,recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(200);

    if (error) return jsonError(res, 500, 'Failed to load symptoms', { details: error.message });

    const logs = (data || []).map((row) => ({
      energy: row.energy,
      mood: row.mood,
      digestion: row.digestion,
      notes: row.notes,
      date: row.recorded_at,
    }));

    return res.status(200).json({ logs });
  }

  const body = req.body || {};
  const payload = {
    user_id: userId,
    energy: Number(body.energy ?? 3),
    mood: Number(body.mood ?? 3),
    digestion: String(body.digestion ?? 'Good').slice(0, 50),
    notes: String(body.notes ?? '').slice(0, 1000),
  };

  const { data, error } = await supabase
    .from('symptoms')
    .insert(payload)
    .select('energy,mood,digestion,notes,recorded_at')
    .single();

  if (error) return jsonError(res, 500, 'Failed to save symptom', { details: error.message });

  return res.status(201).json({
    log: {
      energy: data.energy,
      mood: data.mood,
      digestion: data.digestion,
      notes: data.notes,
      date: data.recorded_at,
    },
  });
}

