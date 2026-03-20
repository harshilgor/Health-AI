import { compressImageDataUrl } from './geminiClient.js';

function apiBase() {
  return import.meta.env.DEV || window.location.hostname === 'localhost'
    ? ''
    : window.location.origin;
}

function ensureDataUrl(input, mediaType) {
  if (input.startsWith('data:')) return input;
  return `data:${mediaType};base64,${input}`;
}

/**
 * POST /api/meals — returns 503 with code STORAGE_NOT_CONFIGURED if Supabase missing.
 */
export async function createMeal({
  userId,
  base64Image,
  mediaType = 'image/jpeg',
  mealType = 'lunch',
  location = '',
}) {
  const normalized = ensureDataUrl(base64Image, mediaType);
  // More aggressive compression for Vercel JSON body limits.
  const compressedDataUrl = await compressImageDataUrl(normalized, 960, 0.65);
  const payloadMediaType = 'image/jpeg';

  const res = await fetch(`${apiBase()}/api/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      image: compressedDataUrl,
      mediaType: payloadMediaType,
      meal_type: mealType,
      location: location || '',
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 503 && data.code === 'STORAGE_NOT_CONFIGURED') {
    const err = new Error(data.error || 'Meal storage not configured');
    err.code = 'STORAGE_NOT_CONFIGURED';
    err.status = 503;
    throw err;
  }
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error('Image is too large to upload. Try a closer crop or lower-resolution photo.');
    }
    const details = data.details ? ` (${String(data.details).slice(0, 220)})` : '';
    throw new Error(data.error || data.message || `Meal save failed (${res.status})${details}`);
  }
  return data;
}

export async function listMeals(userId) {
  if (!userId) return { meals: [], configured: false };
  const res = await fetch(
    `${apiBase()}/api/meals?user_id=${encodeURIComponent(userId)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to load meals (${res.status})`);
  }
  return data;
}

export async function getMeal(userId, mealId) {
  const res = await fetch(
    `${apiBase()}/api/meals/${encodeURIComponent(mealId)}?user_id=${encodeURIComponent(userId)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to load meal (${res.status})`);
  }
  return data;
}

export async function deleteMeal(userId, mealId) {
  const res = await fetch(
    `${apiBase()}/api/meals/${encodeURIComponent(mealId)}?user_id=${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to delete meal (${res.status})`);
  }
  return data;
}

/**
 * Map API row to the shape used by Dashboard / WeeklyReport (local meal).
 */
export function apiMealToLocal(m) {
  const ui = m.analysis_result?.ui || m.analysis || {};
  const nutrition = ui.nutrition || {};
  return {
    id: m.meal_id,
    meal_id: m.meal_id,
    meal_name: ui.meal_name || 'Meal',
    image: m.image_url || '',
    image_url: m.image_url,
    date: m.recorded_at || new Date().toISOString(),
    health_score: ui.health_score ?? 0,
    nutrition,
    meal_type: m.meal_type,
    location: m.location || '',
    fromApi: true,
    fullAnalysis: ui,
  };
}
