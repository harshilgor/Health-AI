async function compressImageDataUrl(dataUrl, maxDimension = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to initialize canvas for image compression.'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression.'));
    img.src = dataUrl;
  });
}

function ensureDataUrl(input, mediaType) {
  if (input.startsWith('data:')) return input;
  return `data:${mediaType};base64,${input}`;
}

export async function analyzeMealWithGemini(base64Image, mediaType = 'image/jpeg') {
  const apiBase =
    import.meta.env.DEV || window.location.hostname === 'localhost'
      ? ''
      : window.location.origin;

  const normalized = ensureDataUrl(base64Image, mediaType);
  // Vercel serverless body limits can trigger 413 for raw phone photos.
  // Resize + compress before upload to keep request size manageable.
  const compressedDataUrl = await compressImageDataUrl(normalized, 1280, 0.72);
  const payloadMediaType = 'image/jpeg';

  const res = await fetch(`${apiBase}/api/gemini/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: compressedDataUrl,
      mediaType: payloadMediaType,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 413) {
      throw new Error('Image is too large to upload. Try a closer crop or lower-resolution photo.');
    }
    throw new Error(err.error || err.message || `Gemini analysis failed (${res.status})`);
  }

  return res.json();
}

