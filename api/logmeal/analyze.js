const LOGMEAL_BASE = 'https://api.logmeal.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token =
    process.env.LOGMEAL_TOKEN ||
    process.env.VITE_LOGMEAL_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'LogMeal token not configured. Add LOGMEAL_TOKEN or VITE_LOGMEAL_TOKEN to Vercel environment variables.',
    });
  }

  try {
    const { image: base64Image, mediaType = 'image/jpeg' } = req.body || {};
    if (!base64Image) {
      return res.status(400).json({ error: 'Missing image in request body' });
    }

    const buffer = Buffer.from(base64Image, 'base64');
    const formData = new FormData();
    formData.append('image', new Blob([buffer], { type: mediaType }), 'image.jpg');

    const segRes = await fetch(`${LOGMEAL_BASE}/v2/image/segmentation/complete?language=eng`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!segRes.ok) {
      const errText = await segRes.text();
      let msg = `LogMeal segmentation failed: ${segRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.message) msg = errJson.message;
      } catch (_) {}
      return res.status(segRes.status >= 500 ? 502 : segRes.status).json({
        error: msg,
        details: errText.slice(0, 200),
      });
    }

    const segmentation = await segRes.json();
    const imageId = segmentation.imageId;
    if (!imageId) {
      return res.status(502).json({
        error: 'LogMeal did not return an imageId',
      });
    }

    const nutRes = await fetch(`${LOGMEAL_BASE}/v2/nutrition/recipe/nutritionalInfo?language=eng`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageId }),
    });

    if (!nutRes.ok) {
      const errText = await nutRes.text();
      let msg = `LogMeal nutritional info failed: ${nutRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.message) msg = errJson.message;
      } catch (_) {}
      return res.status(nutRes.status >= 500 ? 502 : nutRes.status).json({
        error: msg,
        details: errText.slice(0, 200),
      });
    }

    const nutrition = await nutRes.json();

    return res.status(200).json({
      segmentation,
      nutrition,
    });
  } catch (err) {
    console.error('LogMeal analyze error:', err);
    return res.status(500).json({
      error: err.message || 'Analysis failed',
    });
  }
}
