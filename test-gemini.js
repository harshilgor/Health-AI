import fs from 'fs/promises';
import path from 'path';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-lite';
const endpointForModel = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const systemInstruction = `You are an expert in nutritional biochemistry, physiology, and long-term health outcomes. Your role is to provide mechanistic, evidence-based analysis of how food affects the human body.

CORE PRINCIPLES:
- Explain biological MECHANISMS, not just outcomes (e.g., "fructose -> hepatic de novo lipogenesis -> elevated VLDL" not just "sugar is bad")
- Distinguish between acute effects (0-4 hours) and chronic effects (weeks to years)
- Reference specific pathways, enzymes, receptors, and biomarkers
- Consider dose-response (a single meal vs daily consumption)
- Account for individual variation (metabolic health, genetics, microbiome)
- Provide context: compare to optimal alternatives

Be specific, scientific, and actionable. Avoid generic health advice.`;

const analysisPrompt = `Analyze this food image with deep mechanistic insight:

1. FOOD IDENTIFICATION & QUANTIFICATION
   - All visible food items
   - Portion sizes (grams/ml)
   - Preparation method (impacts nutrient bioavailability)

2. NUTRITIONAL COMPOSITION
   - Macronutrients: protein (amino acid profile), carbohydrates (glycemic impact), fats (saturated/unsaturated/trans ratios)
   - Micronutrients: vitamins, minerals, phytonutrients
   - Anti-nutrients: phytates, lectins, oxalates
   - Additives/preservatives if visible

3. ACUTE METABOLIC RESPONSE (0-4 hours post-consumption)
4. CHRONIC IMPACT (weeks to years of regular consumption)
5. NUTRIENT SYNERGIES & ANTAGONISMS
6. TEMPORAL ACCUMULATION EFFECTS
7. PERSONALIZATION FACTORS
8. OPTIMIZATION RECOMMENDATIONS

Return JSON with fields:
foods, acuteResponse, chronicImpact, accumulationCurve, optimizations, confidence.`;

function maskApiKey(apiKey = '') {
  if (apiKey.length < 10) return '***';
  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
}

function explainStatus(status) {
  switch (status) {
    case 400:
      return '400 BadRequest: body schema/model/contents may be invalid.';
    case 401:
      return '401 Unauthorized: API key invalid, missing, or restricted.';
    case 404:
      return '404 NotFound: endpoint/model name is wrong.';
    case 429:
      return '429 RateLimit: quota exhausted or rate limit exceeded.';
    default:
      return `${status} error from Gemini API.`;
  }
}

async function imageFileToCleanBase64(imagePath) {
  const abs = path.resolve(imagePath);
  const file = await fs.readFile(abs);
  return file.toString('base64');
}

async function listModels(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const txt = await res.text();
  if (!res.ok) return [];
  try {
    const parsed = JSON.parse(txt);
    return (parsed.models || []).map((m) => m.name);
  } catch {
    return [];
  }
}

async function callGemini({ apiKey, model, parts }) {
  const base = endpointForModel(model);
  const url = `${base}?key=${apiKey}`;
  const maskedUrl = `${base}?key=${maskApiKey(apiKey)}`;

  const body = {
    contents: [
      {
        parts,
      },
    ],
  };

  console.log('\n--- Gemini Request ---');
  console.log('URL:', maskedUrl);
  console.log('Method: POST');
  console.log('Headers:', JSON.stringify({ 'Content-Type': 'application/json' }, null, 2));
  console.log('Body:', JSON.stringify(body, null, 2).slice(0, 4000));

  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let responseText = await res.text();
  if (res.status === 404 && model === PRIMARY_MODEL) {
    console.log(`Model ${PRIMARY_MODEL} unavailable. Falling back to ${FALLBACK_MODEL}...`);
    const fallbackBase = endpointForModel(FALLBACK_MODEL);
    const fallbackUrl = `${fallbackBase}?key=${apiKey}`;
    const maskedFallbackUrl = `${fallbackBase}?key=${maskApiKey(apiKey)}`;
    console.log('Fallback URL:', maskedFallbackUrl);
    res = await fetch(fallbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    responseText = await res.text();
  }

  console.log('\n--- Gemini Response ---');
  console.log('Status:', res.status);
  console.log('Status explanation:', explainStatus(res.status));
  console.log('Raw response:', responseText.slice(0, 6000));

  if (!res.ok) {
    throw new Error(`Gemini API failed: ${explainStatus(res.status)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    parsed = { raw: responseText };
  }
  return parsed;
}

async function testTextOnly(apiKey) {
  console.log('\n========== TEST 1: TEXT ONLY ==========');
  return callGemini({
    apiKey,
    model: PRIMARY_MODEL,
    parts: [
      {
        text: `${systemInstruction}\n\nReturn one short sentence: "Gemini text test passed."`,
      },
    ],
  });
}

async function testImageAnalysis(apiKey, imagePath) {
  console.log('\n========== TEST 2: IMAGE + PROMPT ==========');
  const base64 = await imageFileToCleanBase64(imagePath);
  console.log('Image path:', path.resolve(imagePath));
  console.log('Base64 length:', base64.length);
  console.log('Base64 prefix check:', base64.startsWith('data:image') ? 'INVALID (has prefix)' : 'OK (clean)');

  return callGemini({
    apiKey,
    model: PRIMARY_MODEL,
    parts: [
      { text: `${systemInstruction}\n\n${analysisPrompt}` },
      {
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64, // clean base64 without "data:image/...;base64,"
        },
      },
    ],
  });
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const imagePath = process.argv[2];

  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY in environment.');
    console.error('PowerShell example: $env:GEMINI_API_KEY=\"YOUR_KEY\"; node test-gemini.js \"path/to/image.jpg\"');
    process.exit(1);
  }

  console.log('Primary model:', PRIMARY_MODEL);
  console.log('Fallback model:', FALLBACK_MODEL);
  const available = await listModels(apiKey);
  console.log('Available models (first 10):', available.slice(0, 10));
  console.log('API key (masked):', maskApiKey(apiKey));

  try {
    await testTextOnly(apiKey);
    console.log('Text-only test passed.');
  } catch (err) {
    console.error('Text-only test failed:', err.message);
    process.exit(1);
  }

  if (!imagePath) {
    console.log('\nNo image path provided. Skipping image test.');
    console.log('Run: node test-gemini.js \"C:/path/to/food.jpg\"');
    return;
  }

  try {
    await testImageAnalysis(apiKey, imagePath);
    console.log('Image analysis test passed.');
  } catch (err) {
    console.error('Image test failed:', err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected failure:', err);
  process.exit(1);
});

