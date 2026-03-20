import { getSupabaseAdmin, MEAL_IMAGES_BUCKET } from '../supabaseServer.js';

function jsonError(res, status, message, details) {
  return res.status(status).json({ error: message, details });
}

export async function handleDebugSupabase(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const urlEnv = (process.env.SUPABASE_URL || '').trim();
  const bucket = MEAL_IMAGES_BUCKET;
  let host = '';
  try {
    host = urlEnv ? new URL(urlEnv).host : '';
  } catch {
    host = '';
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonError(res, 503, 'SUPABASE not configured', {
      hasUrl: !!process.env.SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  }

  try {
    const { data: meals, error: dbErr } = await supabase.from('meals').select('meal_id').limit(1);

    if (dbErr) {
      return jsonError(res, 500, 'DB query failed', {
        message: dbErr.message || String(dbErr),
        supabaseHost: host,
        bucket,
      });
    }

    const { error: listErr } = await supabase.storage.from(MEAL_IMAGES_BUCKET).list('');

    if (listErr) {
      return jsonError(res, 500, 'Storage bucket check failed', {
        bucket: MEAL_IMAGES_BUCKET,
        message: listErr.message || String(listErr),
        supabaseHost: host,
      });
    }

    return res.status(200).json({
      ok: true,
      bucket: MEAL_IMAGES_BUCKET,
      supabaseHost: host,
      mealsSample: meals,
    });
  } catch (e) {
    return jsonError(res, 500, 'Supabase check threw', {
      message: e?.message || String(e),
      supabaseHost: host,
      bucket,
    });
  }
}
