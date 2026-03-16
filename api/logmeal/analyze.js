import FormData from 'form-data';

// LogMeal API (https://api.logmeal.com) — official paths from docs.logmeal.com:
// 1. POST /v2/image/segmentation/complete — upload image, get imageId + segmentation_results
// 2. POST /v2/image/confirm/dish — confirm dish IDs per segment (required before nutrition on some plans)
// 3. POST /v2/nutrition/recipe/nutritionalInfo — get nutritional info by imageId
const LOGMEAL_BASE = 'https://api.logmeal.com';

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function buildMultipartBody(base64Image, mediaType) {
  const buf = Buffer.from(base64Image, 'base64');
  const form = new FormData();
  form.append('image', buf, { filename: 'image.jpg', contentType: mediaType });
  const headers = form.getHeaders();
  const body = await streamToBuffer(form);
  return { headers, body };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.LOGMEAL_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'Add LOGMEAL_TOKEN in Vercel → Settings → Environment Variables.',
    });
  }

  try {
    const { image: base64Image, mediaType = 'image/jpeg' } = req.body || {};
    if (!base64Image) {
      return res.status(400).json({ error: 'Missing image in request body' });
    }

    const { headers: formHeaders, body: formBody } = await buildMultipartBody(base64Image, mediaType);
    let currentToken = global._nourisLogMealToken || token;

    let segRes = await fetch(`${LOGMEAL_BASE}/v2/image/segmentation/complete?language=eng`, {
      method: 'POST',
      headers: {
        ...formHeaders,
        Authorization: `Bearer ${currentToken}`,
      },
      body: formBody,
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

            const retry = await buildMultipartBody(base64Image, mediaType);
            segRes = await fetch(`${LOGMEAL_BASE}/v2/image/segmentation/complete?language=eng`, {
              method: 'POST',
              headers: {
                ...retry.headers,
                Authorization: `Bearer ${currentToken}`,
              },
              body: retry.body,
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

    // Confirm dishes (top-1 per segment) so /recipe/nutritionalInfo has confirmed items
    const segments = segmentation.segmentation_results || [];
    if (segments.length > 0) {
      const confirmedClass = [];
      const source = [];
      const food_item_position = [];
      for (const seg of segments) {
        const pos = seg.food_item_position;
        const top = seg.recognition_results?.[0];
        if (pos != null && top?.id != null) {
          food_item_position.push(pos);
          confirmedClass.push(top.id);
          source.push('logmeal');
        }
      }
      if (confirmedClass.length > 0) {
        const confirmRes = await fetch(`${LOGMEAL_BASE}/v2/image/confirm/dish?language=eng`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            imageId,
            confirmedClass,
            source,
            food_item_position,
          }),
        });
        if (!confirmRes.ok) {
          const errText = await confirmRes.text();
          let msg = 'Dish confirmation failed';
          try {
            const errJson = JSON.parse(errText);
            if (errJson.message) msg = errJson.message;
          } catch (_) {}
          return res.status(confirmRes.status >= 500 ? 502 : confirmRes.status).json({
            error: msg,
            details: errText.slice(0, 200),
          });
        }
      }
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
