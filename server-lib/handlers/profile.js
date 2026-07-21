import { getSupabaseAdmin } from '../supabaseServer.js';
import { getAuthedUserId } from '../authUser.js';

function jsonError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

const PROFILE_SELECT =
  'user_id,goal,conditions,age,sex,activity,height_cm,weight_kg,diet_preference,daily_calories,protein_target,fat_target,carb_target,fiber_target,joined';

function clampNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function optionalMetric(value, min, max) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function normalizeDietPreference(value) {
  const v = String(value || '').toLowerCase().trim();
  if (v === 'vegetarian' || v === 'veg') return 'vegetarian';
  return 'non_vegetarian';
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
      .select(PROFILE_SELECT)
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
    age: clampNumber(body.age, 30, 10, 120),
    sex: String(body.sex ?? 'male').slice(0, 20),
    activity: String(body.activity ?? 'Lightly active').slice(0, 50),
    height_cm: optionalMetric(body.height_cm, 100, 250),
    weight_kg: optionalMetric(body.weight_kg, 30, 300),
    diet_preference: normalizeDietPreference(body.diet_preference),
    daily_calories: clampNumber(body.daily_calories, 2000, 800, 6000),
    protein_target: clampNumber(body.protein_target, 125, 20, 400),
    fat_target: clampNumber(body.fat_target, 67, 10, 300),
    carb_target: clampNumber(body.carb_target, 225, 20, 600),
    fiber_target: clampNumber(body.fiber_target, 30, 5, 80),
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    return jsonError(res, 500, 'Failed to save profile', { details: error.message });
  }

  return res.status(200).json(data);
}
