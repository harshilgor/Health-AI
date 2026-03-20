import { getSupabaseAdmin, MEAL_IMAGES_BUCKET } from '../lib/supabaseServer.js';

function jsonError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

/**
 * GET /api/meals/:id?user_id=
 * DELETE /api/meals/:id?user_id=
 */
export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonError(res, 503, 'Meal storage is not configured.', { code: 'STORAGE_NOT_CONFIGURED' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  const userId = typeof req.query.user_id === 'string' ? req.query.user_id.trim() : '';

  if (!id) {
    return jsonError(res, 400, 'Missing meal id');
  }
  if (!userId) {
    return jsonError(res, 400, 'Missing user_id query parameter');
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select(
          'meal_id,user_id,image_url,image_path,meal_type,location,recorded_at,analysis_result'
        )
        .eq('meal_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('meal get error:', error);
        return jsonError(res, 500, 'Failed to load meal', { details: error.message });
      }
      if (!data) {
        return jsonError(res, 404, 'Meal not found');
      }

      const ui = data.analysis_result?.ui || null;
      return res.status(200).json({
        ...data,
        analysis: ui,
      });
    } catch (e) {
      console.error(e);
      return jsonError(res, 500, e.message || 'Failed to load meal');
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { data: row, error: fetchErr } = await supabase
        .from('meals')
        .select('meal_id,image_path')
        .eq('meal_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) {
        return jsonError(res, 500, 'Failed to load meal', { details: fetchErr.message });
      }
      if (!row) {
        return jsonError(res, 404, 'Meal not found');
      }

      const { error: delErr } = await supabase.from('meals').delete().eq('meal_id', id).eq('user_id', userId);

      if (delErr) {
        return jsonError(res, 500, 'Failed to delete meal', { details: delErr.message });
      }

      if (row.image_path) {
        await supabase.storage.from(MEAL_IMAGES_BUCKET).remove([row.image_path]).catch((err) => {
          console.warn('Storage delete warning:', err?.message);
        });
      }

      return res.status(200).json({ ok: true, meal_id: id });
    } catch (e) {
      console.error(e);
      return jsonError(res, 500, e.message || 'Delete failed');
    }
  }

  res.setHeader('Allow', 'GET, DELETE');
  return jsonError(res, 405, 'Method not allowed');
}
