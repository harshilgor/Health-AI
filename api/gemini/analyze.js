import { analyzeFoodImage } from '../lib/geminiFoodAnalysis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY missing. Add it to local .env and Vercel environment variables.',
    });
  }

  try {
    const { image, mediaType = 'image/jpeg' } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: 'Missing image in request body' });
    }
    const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;

    const { nouris } = await analyzeFoodImage(cleanBase64, mediaType, apiKey);
    return res.status(200).json(nouris);
  } catch (err) {
    if (err.status && err.details) {
      return res.status(err.status).json({
        error: err.message || 'Gemini request failed',
        details: String(err.details).slice(0, 300),
      });
    }
    console.error('Gemini analyze error:', err);
    return res.status(500).json({ error: err.message || 'Gemini analysis failed' });
  }
}
