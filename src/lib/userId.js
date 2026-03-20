const KEY = 'nouris_user_id';

/**
 * Stable per-browser user id for meal API until real auth exists.
 */
export function getOrCreateUserId() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string' && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `u_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  try {
    localStorage.setItem(KEY, JSON.stringify(id));
  } catch {
    /* ignore */
  }
  return id;
}
