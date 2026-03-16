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
    const createFormData = () => {
      const fd = new FormData();
      fd.append('image', new Blob([buffer], { type: mediaType }), 'image.jpg');
      return fd;
    };

    // If we already have a cached APIUser token, use it immediately
    let currentToken = global._nourisLogMealToken || token;

    let segRes = await fetch(`${LOGMEAL_BASE}/v2/image/segmentation/complete?language=eng`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
      body: createFormData(),
    });

    // If we used an APICompany token instead of an APIUser token, LogMeal returns a specific error (often 401 with code 802).
    // Let's dynamically create an APIUser token if that happens.
    if (!segRes.ok && (segRes.status === 401 || segRes.status === 400)) {
      const errText = await segRes.text();
      try {
        const errJson = JSON.parse(errText);
        if (errJson.code === 802 || errJson.message?.includes('User not allowed')) {
          console.log("APICompany token detected. Generating ephemeral APIUser token...");
          const signUpRes = await fetch(`${LOGMEAL_BASE}/v2/users/signUp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ username: `nouris_user_${Date.now()}_${Math.floor(Math.random() * 10000)}` })
          });

          if (signUpRes.ok) {
            const signUpJson = await signUpRes.json();
            currentToken = signUpJson.token;
            global._nourisLogMealToken = currentToken; // Cache it globally
            console.log("Successfully generated APIUser token.");

            // Retry the original request WITH A NEW form data instance!
            segRes = await fetch(`${LOGMEAL_BASE}/v2/image/segmentation/complete?language=eng`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${currentToken}`,
              },
              body: createFormData(),
            });
          } else {
            console.error("Failed to generate APIUser token", await signUpRes.text());
            segRes = { ok: false, status: segRes.status, text: async () => errText };
          }
        } else {
          // Pass the error down to the next block
          segRes = { ok: false, status: segRes.status, text: async () => errText };
        }
      } catch (e) {
        segRes = { ok: false, status: segRes.status, text: async () => errText };
      }
    }

    if (!segRes.ok) {
      const errText = await segRes.text();
      let msg = `LogMeal segmentation failed: ${segRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.message) msg = errJson.message;
      } catch (_) { }
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
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ imageId }),
    });

    if (!nutRes.ok) {
      const errText = await nutRes.text();
      let msg = `LogMeal nutritional info failed: ${nutRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.message) msg = errJson.message;
      } catch (_) { }
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
