import { buildPackagedAnalysis } from './packaged';

/**
 * Client helper to call our packaged analysis API and return a Nouris-formatted object.
 */
export async function analyzePackagedProduct(base64Image, mediaType = 'image/jpeg') {
  const apiBase =
    import.meta.env.DEV || window.location.hostname === 'localhost'
      ? ''
      : window.location.origin;

  const res = await fetch(`${apiBase}/api/packaged/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64Image,
      mediaType,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Analysis failed (${res.status})`);
  }

  // API already returns a Nouris-formatted analysis, but keep a safeguard:
  const data = await res.json();
  if (data && data.nutrition && data.meal_name) return data;
  return buildPackagedAnalysis(data || {}, {});
}

