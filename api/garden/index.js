import { getSupabaseAdmin } from '../lib/supabaseServer.js';
import { getAuthedUserId } from '../lib/authUser.js';

function jsonError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

function environmentFromScores(g) {
  if (!g) return 'partly';
  const avg =
    (g.heart + g.brain + g.gut + g.muscle + g.immune + (g.bones_unlocked ? g.bones : 50)) / (g.bones_unlocked ? 6 : 5);
  if (avg >= 78) return 'clear';
  if (avg >= 55) return 'partly';
  if (avg >= 35) return 'foggy';
  return 'rainy';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return jsonError(res, 405, 'Method not allowed');
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonError(res, 503, 'Supabase not configured', { code: 'SUPABASE_NOT_CONFIGURED' });
  }

  let userId;
  try {
    userId = await getAuthedUserId(req);
  } catch (e) {
    return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
  }
  if (!userId) return jsonError(res, 401, 'Authorization token required');

  const { data: row, error } = await supabase.from('user_garden').select('*').eq('user_id', userId).maybeSingle();

  if (error) {
    return jsonError(res, 500, 'Failed to load garden', { details: error.message });
  }

  if (!row) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('age')
      .eq('user_id', userId)
      .maybeSingle();
    const age = Math.max(10, Math.min(120, Number(profile?.age ?? 30)));
    return res.status(200).json({
      garden: {
        user_id: userId,
        chronological_age: age,
        biological_age: age,
        heart: 50,
        brain: 50,
        gut: 50,
        muscle: 50,
        immune: 50,
        bones: 40,
        bones_unlocked: false,
        current_streak: 0,
        longest_streak: 0,
        last_meal_date: null,
        distinct_meal_days: 0,
      },
      environment: 'partly',
      isDefault: true,
    });
  }

  const environment = environmentFromScores(row);
  return res.status(200).json({ garden: row, environment, isDefault: false });
}
