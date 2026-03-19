import { buildPackagedAnalysis } from '../../src/lib/packaged.js';

const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

async function callGoogleVision(base64Image, apiKey) {
  const res = await fetch(`${VISION_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64Image },
          features: [
            { type: 'TEXT_DETECTION', maxResults: 1 },
            { type: 'LOGO_DETECTION', maxResults: 1 },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google Vision error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.responses?.[0] || {};
}

function extractBarcodeAndQuery(visionResult) {
  const text = visionResult.textAnnotations?.[0]?.description || '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Try to find a plausible barcode
  const barcodeMatch = text.match(/\b(\d{8,14})\b/);
  const barcode = barcodeMatch ? barcodeMatch[1] : null;

  const logo = visionResult.logoAnnotations?.[0]?.description || '';
  const brand = logo || '';
  const firstLine = lines[0] || '';

  // Build a simple query: brand + first text line
  const query = [brand, firstLine].filter(Boolean).join(' ');

  return { barcode, brand, query: query || brand || firstLine || 'food product' };
}

async function fetchOpenFoodFacts({ barcode, query }) {
  if (barcode) {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
    );
    if (res.ok) {
      const json = await res.json();
      if (json && json.product) return json;
    }
  }

  const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&json=1&page_size=1`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    const txt = await searchRes.text();
    throw new Error(`OpenFoodFacts search error ${searchRes.status}: ${txt.slice(0, 200)}`);
  }
  const searchJson = await searchRes.json();
  return searchJson;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        'GOOGLE_VISION_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.',
    });
  }

  try {
    const { image: base64Image, mediaType = 'image/jpeg' } = req.body || {};
    if (!base64Image) {
      return res.status(400).json({ error: 'Missing image in request body' });
    }

    const cleanBase64 = base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image;

    const visionResult = await callGoogleVision(cleanBase64, apiKey);
    const { barcode, brand, query } = extractBarcodeAndQuery(visionResult);

    const offResponse = await fetchOpenFoodFacts({ barcode, query });
    const confidence = visionResult.logoAnnotations?.[0]?.score
      ? Math.round(visionResult.logoAnnotations[0].score * 100)
      : 80;
    const analysis = buildPackagedAnalysis(offResponse, { confidence, brand, barcode, query });

    return res.status(200).json(analysis);
  } catch (err) {
    console.error('Packaged analyze error:', err);
    return res.status(500).json({
      error: err.message || 'Packaged analysis failed',
    });
  }
}

