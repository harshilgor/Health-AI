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
  accessToken,
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

  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const body = {
    image: compressedDataUrl,
    mediaType: payloadMediaType,
    meal_type: mealType,
    location: location || '',
  };
  if (!accessToken && userId) body.user_id = userId;

  const res = await fetch(`${apiBase()}/api/meals`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
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
      const err = new Error('Image is too large to upload. Try a closer crop or lower-resolution photo.');
      err.status = res.status;
      err.code = 'PAYLOAD_TOO_LARGE';
      throw err;
    }
    const code = data.code ? ` [${String(data.code)}]` : '';
    const details = data.details ? `: ${String(data.details).slice(0, 260)}` : '';
    const base = data.error || data.message || `Meal save failed (${res.status})`;
    const err = new Error(`${base}${code}${details}`);
    err.status = res.status;
    if (data.code) err.code = data.code;
    throw err;
  }
  return data;
}

export async function listMeals({ accessToken, userId } = {}) {
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const url = accessToken
    ? `${apiBase()}/api/meals`
    : `${apiBase()}/api/meals?user_id=${encodeURIComponent(userId || '')}`;

  if (!accessToken && !userId) return { meals: [], configured: false };

  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data.code ? ` [${String(data.code)}]` : '';
    const details = data.details ? `: ${String(data.details).slice(0, 260)}` : '';
    const base = data.error || data.message || `Failed to load meals (${res.status})`;
    const err = new Error(`${base}${code}${details}`);
    err.status = res.status;
    if (data.code) err.code = data.code;
    throw err;
  }
  return data;
}

export async function getMeal({ accessToken, userId, mealId }) {
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const url = accessToken
    ? `${apiBase()}/api/meals/${encodeURIComponent(mealId)}`
    : `${apiBase()}/api/meals/${encodeURIComponent(mealId)}?user_id=${encodeURIComponent(userId)}`;

  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data.code ? ` [${String(data.code)}]` : '';
    const details = data.details ? `: ${String(data.details).slice(0, 260)}` : '';
    const base = data.error || data.message || `Failed to load meal (${res.status})`;
    const err = new Error(`${base}${code}${details}`);
    err.status = res.status;
    if (data.code) err.code = data.code;
    throw err;
  }
  return data;
}

export async function deleteMeal({ accessToken, userId, mealId }) {
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const url = accessToken
    ? `${apiBase()}/api/meals/${encodeURIComponent(mealId)}`
    : `${apiBase()}/api/meals/${encodeURIComponent(mealId)}?user_id=${encodeURIComponent(userId)}`;

  const res = await fetch(url, { method: 'DELETE', headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data.code ? ` [${String(data.code)}]` : '';
    const details = data.details ? `: ${String(data.details).slice(0, 260)}` : '';
    const base = data.error || data.message || `Failed to delete meal (${res.status})`;
    const err = new Error(`${base}${code}${details}`);
    err.status = res.status;
    if (data.code) err.code = data.code;
    throw err;
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
