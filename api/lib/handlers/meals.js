import { randomUUID } from 'crypto';
import { analyzeFoodImage } from '../geminiFoodAnalysis.js';
import { getSupabaseAdmin, MEAL_IMAGES_BUCKET } from '../supabaseServer.js';
import { getAuthedUserId } from '../authUser.js';
import { scoreMealForGarden } from '../gardenScoring.js';
import { applyScoringToGarden } from '../gardenState.js';

const ALLOWED_MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack']);

function jsonError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

function cleanBase64(image) {
  if (!image || typeof image !== 'string') return null;
  return image.includes(',') ? image.split(',')[1] : image;
}

function normalizeMealType(v) {
  const t = String(v || 'lunch').toLowerCase();
  return ALLOWED_MEAL_TYPES.has(t) ? t : 'lunch';
}

async function handleMealsCollection(req, res) {
  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    let userId = null;
    try {
      userId = await getAuthedUserId(req);
    } catch (e) {
      return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
    }
    if (!userId) return jsonError(res, 401, 'Authorization token required');
    if (!supabase) {
      return res.status(200).json({ meals: [], configured: false });
    }
    try {
      const { data, error } = await supabase
        .from('meals')
        .select(
          'meal_id,user_id,image_url,image_path,meal_type,location,recorded_at,analysis_result'
        )
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('meals list error:', error);
        return jsonError(res, 500, 'Failed to load meals', { details: error.message });
      }
      return res.status(200).json({ meals: data || [], configured: true });
    } catch (e) {
      console.error(e);
      return jsonError(res, 500, e.message || 'Failed to load meals');
    }
  }

  if (req.method === 'POST') {
    if (!supabase) {
      return jsonError(res, 503, 'Meal storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.', {
        code: 'STORAGE_NOT_CONFIGURED',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonError(res, 500, 'GEMINI_API_KEY missing. Add it to environment variables.');
    }

    try {
      const body = req.body || {};
      let userId = null;
      try {
        userId = await getAuthedUserId(req);
      } catch (e) {
        return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
      }
      const image = body.image;
      const mediaType = typeof body.mediaType === 'string' ? body.mediaType : 'image/jpeg';
      const mealType = normalizeMealType(body.meal_type);
      const location = typeof body.location === 'string' ? body.location.slice(0, 500) : '';

      if (!userId) return jsonError(res, 401, 'Authorization token required');
      if (userId.length > 200) {
        return jsonError(res, 400, 'user_id too long');
      }

      const b64 = cleanBase64(image);
      if (!b64) {
        return jsonError(res, 400, 'Missing image (base64 or data URL)');
      }

      let buffer;
      try {
        buffer = Buffer.from(b64, 'base64');
      } catch {
        return jsonError(res, 400, 'Invalid base64 image');
      }
      if (!buffer.length || buffer.length > 12 * 1024 * 1024) {
        return jsonError(res, 400, 'Image too large or empty (max ~12MB raw)');
      }

      const mealId = randomUUID();
      const ext =
        mediaType.includes('png') ? 'png' : mediaType.includes('webp') ? 'webp' : 'jpg';
      const imagePath = `meals/${encodeURIComponent(userId)}/${mealId}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(MEAL_IMAGES_BUCKET)
        .upload(imagePath, buffer, {
          contentType: mediaType,
          upsert: false,
        });

      if (upErr) {
        console.error('Storage upload error:', upErr);
        return jsonError(res, 500, 'Failed to upload image', {
          details: upErr?.message || upErr?.toString?.() || String(upErr),
          bucket: MEAL_IMAGES_BUCKET,
          path: imagePath,
          supabaseError: upErr ? { name: upErr.name, status: upErr.status, statusCode: upErr.statusCode } : undefined,
        });
      }

      const { data: pub } = supabase.storage.from(MEAL_IMAGES_BUCKET).getPublicUrl(imagePath);
      const imageUrl = pub?.publicUrl || '';

      let detailed;
      let nouris;
      try {
        const out = await analyzeFoodImage(b64, mediaType, apiKey);
        detailed = out.detailed;
        nouris = out.nouris;
      } catch (gemErr) {
        await supabase.storage.from(MEAL_IMAGES_BUCKET).remove([imagePath]).catch(() => {});
        if (gemErr.status && gemErr.details) {
          return res.status(gemErr.status).json({
            error: gemErr.message || 'Gemini request failed',
            details: String(gemErr.details).slice(0, 300),
          });
        }
        throw gemErr;
      }

      const gardenScoring = scoreMealForGarden({ nouris, detailed });
      const analysisResult = {
        gemini: detailed,
        ui: nouris,
        garden: gardenScoring,
      };

      const { data: row, error: insErr } = await supabase
        .from('meals')
        .insert({
          meal_id: mealId,
          user_id: userId,
          image_url: imageUrl,
          image_path: imagePath,
          meal_type: mealType,
          location,
          analysis_result: analysisResult,
        })
        .select(
          'meal_id,user_id,image_url,image_path,meal_type,location,recorded_at,analysis_result'
        )
        .single();

      if (insErr) {
        console.error('DB insert error:', insErr);
        await supabase.storage.from(MEAL_IMAGES_BUCKET).remove([imagePath]).catch(() => {});
        return jsonError(res, 500, 'Failed to save meal', {
          details: insErr.message || String(insErr),
        });
      }

      let gardenUpdate = null;
      try {
        const applied = await applyScoringToGarden(supabase, userId, gardenScoring);
        if (applied) gardenUpdate = applied.update;
      } catch (ge) {
        console.warn('Garden update skipped:', ge?.message || ge);
      }

      return res.status(201).json({
        meal_id: row.meal_id,
        user_id: row.user_id,
        image_url: row.image_url,
        image_path: row.image_path,
        meal_type: row.meal_type,
        location: row.location,
        recorded_at: row.recorded_at,
        analysis: nouris,
        analysis_result: row.analysis_result,
        garden_update: gardenUpdate,
      });
    } catch (err) {
      console.error('POST /api/meals error:', err);
      return jsonError(res, 500, err.message || 'Meal create failed');
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return jsonError(res, 405, 'Method not allowed');
}

async function handleMealById(req, res, id) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonError(res, 503, 'Meal storage is not configured.', { code: 'STORAGE_NOT_CONFIGURED' });
  }

  const mealId = typeof id === 'string' ? id.trim() : '';
  let userId = null;
  try {
    userId = await getAuthedUserId(req);
  } catch (e) {
    return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
  }
  if (!userId) {
    return jsonError(res, 401, 'Authorization token required');
  }

  if (!mealId) {
    return jsonError(res, 400, 'Missing meal id');
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select(
          'meal_id,user_id,image_url,image_path,meal_type,location,recorded_at,analysis_result'
        )
        .eq('meal_id', mealId)
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
        .eq('meal_id', mealId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) {
        return jsonError(res, 500, 'Failed to load meal', { details: fetchErr.message });
      }
      if (!row) {
        return jsonError(res, 404, 'Meal not found');
      }

      const { error: delErr } = await supabase.from('meals').delete().eq('meal_id', mealId).eq('user_id', userId);

      if (delErr) {
        return jsonError(res, 500, 'Failed to delete meal', { details: delErr.message });
      }

      if (row.image_path) {
        await supabase.storage.from(MEAL_IMAGES_BUCKET).remove([row.image_path]).catch((err) => {
          console.warn('Storage delete warning:', err?.message);
        });
      }

      return res.status(200).json({ ok: true, meal_id: mealId });
    } catch (e) {
      console.error(e);
      return jsonError(res, 500, e.message || 'Delete failed');
    }
  }

  res.setHeader('Allow', 'GET, DELETE');
  return jsonError(res, 405, 'Method not allowed');
}

/**
 * tail: path segments after "meals" — [] for /api/meals, [id] for /api/meals/:id
 */
export async function handleMeals(req, res, tail) {
  if (!tail || tail.length === 0) {
    return handleMealsCollection(req, res);
  }
  if (tail.length === 1) {
    return handleMealById(req, res, tail[0]);
  }
  return res.status(404).json({ error: 'Not found' });
}
