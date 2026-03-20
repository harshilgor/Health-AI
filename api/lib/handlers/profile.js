import { getSupabaseAdmin } from '../supabaseServer.js';
import { getAuthedUserId } from '../authUser.js';

function jsonError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

export async function handleProfile(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
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
      .from('user_profiles')
      .select(
        'user_id,goal,conditions,age,sex,activity,daily_calories,protein_target,fat_target,carb_target,fiber_target,joined'
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return jsonError(res, 500, 'Failed to load profile', { details: error.message });
    }
    if (!data) return jsonError(res, 404, 'Profile not found');
    return res.status(200).json(data);
  }

  const body = req.body || {};
  const payload = {
    user_id: userId,
    goal: String(body.goal ?? '').slice(0, 200) || 'Eat healthier generally',
    conditions: String(body.conditions ?? '').slice(0, 500) || 'None',
    age: Number(body.age ?? 30),
    sex: String(body.sex ?? 'male').slice(0, 20),
    activity: String(body.activity ?? 'Lightly active').slice(0, 50),
    daily_calories: Number(body.daily_calories ?? 2000),
    protein_target: Number(body.protein_target ?? 125),
    fat_target: Number(body.fat_target ?? 67),
    carb_target: Number(body.carb_target ?? 225),
    fiber_target: Number(body.fiber_target ?? 30),
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select(
      'user_id,goal,conditions,age,sex,activity,daily_calories,protein_target,fat_target,carb_target,fiber_target,joined'
    )
    .single();

  if (error) {
    return jsonError(res, 500, 'Failed to save profile', { details: error.message });
  }

  return res.status(200).json(data);
}
