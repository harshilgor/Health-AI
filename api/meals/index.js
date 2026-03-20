import { randomUUID } from 'crypto';
import { analyzeFoodImage } from '../lib/geminiFoodAnalysis.js';
import { getSupabaseAdmin, MEAL_IMAGES_BUCKET } from '../lib/supabaseServer.js';

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

/**
 * GET /api/meals?user_id= — list meals for user
 * POST /api/meals — upload image, analyze, persist
 */
export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    const userId = typeof req.query.user_id === 'string' ? req.query.user_id.trim() : '';
    if (!userId) {
      return jsonError(res, 400, 'Missing user_id query parameter');
    }
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
      const userId = typeof body.user_id === 'string' ? body.user_id.trim() : '';
      const image = body.image;
      const mediaType = typeof body.mediaType === 'string' ? body.mediaType : 'image/jpeg';
      const mealType = normalizeMealType(body.meal_type);
      const location = typeof body.location === 'string' ? body.location.slice(0, 500) : '';

      if (!userId) {
        return jsonError(res, 400, 'Missing user_id');
      }
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
        return jsonError(res, 500, 'Failed to upload image', { details: upErr.message });
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

      const analysisResult = {
        gemini: detailed,
        ui: nouris,
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
        return jsonError(res, 500, 'Failed to save meal', { details: insErr.message });
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
      });
    } catch (err) {
      console.error('POST /api/meals error:', err);
      return jsonError(res, 500, err.message || 'Meal create failed');
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return jsonError(res, 405, 'Method not allowed');
}
