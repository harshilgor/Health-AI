export async function analyzeMealWithGemini(base64Image, mediaType = 'image/jpeg') {
  const apiBase =
    import.meta.env.DEV || window.location.hostname === 'localhost'
      ? ''
      : window.location.origin;

  const res = await fetch(`${apiBase}/api/gemini/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64Image,
      mediaType,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Gemini analysis failed (${res.status})`);
  }

  return res.json();
}

