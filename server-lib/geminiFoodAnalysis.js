/**
 * Shared Gemini food image analysis (used by /api/gemini/analyze and /api/meals).
 */

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-lite';

const geminiUrlForModel = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const systemInstruction = `You are an expert nutrition analyst. Return concise, scannable, actionable output only.

Do not write prose paragraphs. Prioritize short bullet lines and quantified swaps.`;

const analysisPrompt = `Analyze this food image and return ONLY in this exact JSON structure:
{
  "foods": ["item 1", "item 2"],
  "calories": 650,
  "macros": {
    "protein_g": 28,
    "carbs_g": 45,
    "fat_g": 32,
    "fiber_g": 4,
    "sugar_g": 8,
    "sodium_mg": 920,
    "saturated_fat_g": 12,
    "omega3_mg": 50
  },
  "healthScore": 4,
  "healthScoreReason": "Fried items, high sodium, low fiber — occasional treat not daily food",
  "confidence": 78,
  "quickSummary": {
    "cardiovascular": "• High saturated fat -> arterial plaque risk\\n• Sodium 800mg -> blood pressure elevation",
    "metabolic": "• Refined carbs -> insulin spike -> fat storage\\n• Low fiber -> poor blood sugar control",
    "inflammatory": "• Omega-6 oils -> inflammatory response\\n• Processed ingredients -> chronic inflammation",
    "positives": "• Good protein for muscle repair\\n• Contains vitamin C for immunity"
  },
  "timelineImpact": {
    "1week": "Slight energy fluctuations, minimal lasting change",
    "1month": "Noticeable insulin resistance if daily, gut health affected",
    "1year": "Significant cardiovascular risk, potential pre-diabetes markers"
  },
  "improvements": [
    "Swap white rice -> brown rice (50% lower glycemic spike)",
    "Add vegetables (doubles fiber, reduces absorption speed)"
  ]
}

SCORING RULES (healthScore 1-10, be honest and strict):
- 9-10: Whole foods, high fiber, lean protein, minimal processing (e.g. grilled fish + vegetables)
- 7-8: Balanced home-cooked meals with minor issues
- 5-6: Mixed meals with some processed elements
- 3-4: Fast food, fried food, burger+fries, pizza, sugary drinks, high sodium
- 1-2: Ultra-processed, very high sugar/fat/sodium combo
- Burger, fries, fried chicken, milkshakes, donuts should typically score 2-5, NEVER 9-10
- Estimate realistic macros from visible portions — do not leave macros at zero

RULES:
- Each bullet point MAX 10-15 words
- Use -> arrows to show cause-effect
- No long paragraphs
- Focus on actionable insights
- Maximum 2-3 bullets per category
- Quantify when possible (percentages, numbers)`;

function buildAnalysisPrompt(dietPreference = 'non_vegetarian') {
  const dietRule =
    dietPreference === 'vegetarian'
      ? `\nDIET PREFERENCE: Vegetarian.\n- Improvement swaps MUST stay vegetarian (no meat, fish, poultry, seafood).\n- Prefer plant proteins, dairy, eggs, legumes, whole grains, vegetables.\n- If the plate contains meat, still analyze it honestly, but recommend vegetarian alternatives.`
      : `\nDIET PREFERENCE: Non-vegetarian.\n- Improvement swaps may include lean meats, fish, poultry, eggs, or plant proteins as appropriate.`;

  return `${analysisPrompt}${dietRule}`;
}

export function parseGeminiJSON(text) {
  let trimmed = String(text || '').trim();
  if (!trimmed) return {};

  // Strip markdown code fences Gemini often wraps around JSON.
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) trimmed = fenced[1].trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        throw new Error('Gemini returned malformed JSON.');
      }
    }
    throw new Error('Gemini returned non-JSON output.');
  }
}

function linesFromBullets(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || '').trim()).filter(Boolean);
  }
  const s = String(value || '')
    .replace(/\r/g, '')
    .trim();
  if (!s) return fallback;
  return s
    .split('\n')
    .map((line) => line.replace(/^[\s•-]+/, '').trim())
    .filter(Boolean);
}

function computeHealthScore(detailed, nutrition, foodNames) {
  if (detailed?.healthScore != null && !Number.isNaN(Number(detailed.healthScore))) {
    return Math.min(10, Math.max(1, Math.round(Number(detailed.healthScore))));
  }

  const foodStr = foodNames.join(' ').toLowerCase();
  let score = 6.5;

  const junkPattern =
    /burger|fries|fried|pizza|donut|doughnut|milkshake|soda|nachos|hot\s*dog|chips|candy|pastry|deep[\s-]?fried|fast\s*food|bacon|processed/;
  const healthyPattern =
    /salad|vegetable|broccoli|spinach|kale|grilled|steamed|salmon|quinoa|lentil|bean|fruit|berry|oat/i;

  if (junkPattern.test(foodStr)) score -= 2.5;
  if (healthyPattern.test(foodStr)) score += 1;

  if (nutrition.sodium_mg > 1000) score -= 2;
  else if (nutrition.sodium_mg > 700) score -= 1.5;
  else if (nutrition.sodium_mg > 500) score -= 0.5;

  if (nutrition.sugar_g > 30) score -= 2;
  else if (nutrition.sugar_g > 20) score -= 1;

  if (nutrition.saturated_fat_g > 15) score -= 1.5;
  else if (nutrition.saturated_fat_g > 8) score -= 0.5;

  if (nutrition.fiber_g >= 8) score += 1;
  else if (nutrition.fiber_g < 3) score -= 0.5;

  if (nutrition.protein_g >= 25) score += 0.5;

  if (nutrition.calories > 900) score -= 1;
  else if (nutrition.calories > 700) score -= 0.5;

  return Math.min(10, Math.max(1, Math.round(score)));
}

export function toNourisShape(detailed) {
  const foods = Array.isArray(detailed?.foods) ? detailed.foods : [];
  const names = foods
    .map((f) => (typeof f === 'string' ? f : f?.name))
    .filter(Boolean);
  const mealName = names.length ? names.join(', ') : 'Food analysis';
  const macros = detailed?.macros || {};
  const calories = Math.max(0, Number(detailed?.calories || macros.calories || 0));
  const nutrition = {
    calories,
    protein_g: Math.max(0, Number(macros.protein_g ?? macros.protein ?? 0)),
    carbs_g: Math.max(0, Number(macros.carbs_g ?? macros.carbs ?? 0)),
    fat_g: Math.max(0, Number(macros.fat_g ?? macros.fat ?? 0)),
    fiber_g: Math.max(0, Number(macros.fiber_g ?? macros.fiber ?? 0)),
    sugar_g: Math.max(0, Number(macros.sugar_g ?? macros.sugar ?? 0)),
    sodium_mg: Math.max(0, Number(macros.sodium_mg ?? macros.sodium ?? 0)),
    saturated_fat_g: Math.max(0, Number(macros.saturated_fat_g ?? macros.saturated_fat ?? 0)),
    omega3_mg: Math.max(0, Number(macros.omega3_mg ?? macros.omega3 ?? 0)),
  };
  const glycemic_load =
    nutrition.carbs_g > 50 && nutrition.fiber_g < 3
      ? 'high'
      : nutrition.carbs_g < 30 && nutrition.fiber_g > 5
        ? 'low'
        : 'medium';

  const healthScore = computeHealthScore(detailed, nutrition, names);

  const quick = detailed?.quickSummary || {};
  const timeline = detailed?.timelineImpact || {};
  const cardiovascularBullets = linesFromBullets(quick.cardiovascular);
  const metabolicBullets = linesFromBullets(quick.metabolic);
  const inflammatoryBullets = linesFromBullets(quick.inflammatory);
  const positivesBullets = linesFromBullets(quick.positives);
  const improvementBullets = linesFromBullets(detailed?.improvements);

  return {
    meal_name: mealName,
    confidence: Math.round(Number(detailed?.confidence || 75)),
    preparation_context: 'unknown',
    visible_ingredients: names,
    likely_hidden_ingredients: [],
    nutrition: { ...nutrition, glycemic_load },
    micronutrients: [],
    health_implications: [
      {
        finding: 'Cardiovascular impact',
        biological_mechanism:
          cardiovascularBullets.join(' ') || 'Estimated cardiovascular impact from meal composition.',
        timeframe: 'within_hours',
        severity: 'moderate',
        affects: ['heart'],
        context: timeline['1month'] || '',
      },
      {
        finding: 'Metabolic and inflammatory trajectory',
        biological_mechanism:
          [...metabolicBullets, ...inflammatoryBullets].join(' ') || 'Pattern-dependent long-term effects.',
        timeframe: 'chronic',
        severity: 'moderate',
        affects: ['heart', 'metabolic_health', 'inflammation'],
        context: timeline['1year'] || '',
      },
    ],
    contaminant_flags: [],
    restaurant_warnings: [],
    what_your_body_does_next_4_hours: [...metabolicBullets, ...inflammatoryBullets].join(' '),
    chronic_risk_if_eaten_regularly: timeline['1year'] || '',
    meal_pattern_flags: [],
    health_score: healthScore,
    score_reasoning: [
      detailed?.healthScoreReason || `Health score ${healthScore}/10`,
      `Estimated ${nutrition.calories} kcal`,
      `Carbs ${nutrition.carbs_g}g, sugar ${nutrition.sugar_g}g`,
      `Protein ${nutrition.protein_g}g, fiber ${nutrition.fiber_g}g`,
      `Sodium ${nutrition.sodium_mg}mg`,
    ],
    health_flags: [],
    long_term_health_signals: {
      heart_health_impact: timeline['1month'] || '',
      metabolic_impact: timeline['1year'] || '',
      gut_health_impact: '',
      brain_health_impact: '',
      hormonal_impact: '',
    },
    the_one_swap: improvementBullets[0] || '',
    coach_message:
      positivesBullets.join(' ') || 'Focus on one high-leverage swap and consistency over time.',
    confidence_caveat: '',
    quick_summary: {
      cardiovascular: cardiovascularBullets,
      metabolic: metabolicBullets,
      inflammatory: inflammatoryBullets,
      positives: positivesBullets,
    },
    timeline_impact: {
      oneWeek: String(timeline['1week'] || ''),
      oneMonth: String(timeline['1month'] || ''),
      oneYear: String(timeline['1year'] || ''),
    },
    improvements: improvementBullets,
    detailed_analysis: detailed,
  };
}

/**
 * @param {string} cleanBase64 - raw base64, no data URL prefix
 * @param {string} mediaType - e.g. image/jpeg
 * @param {string} apiKey - GEMINI_API_KEY
 * @param {{ dietPreference?: string }} [options]
 * @returns {Promise<{ detailed: object, nouris: object }>}
 */
export async function analyzeFoodImage(cleanBase64, mediaType, apiKey, options = {}) {
  const dietPreference =
    options.dietPreference === 'vegetarian' ? 'vegetarian' : 'non_vegetarian';
  const payload = {
    contents: [
      {
        parts: [
          { text: `${systemInstruction}\n\n${buildAnalysisPrompt(dietPreference)}` },
          {
            inline_data: {
              mime_type: mediaType,
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.2 },
  };

  let response = await fetch(`${geminiUrlForModel(PRIMARY_MODEL)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (response.status === 404) {
    response = await fetch(`${geminiUrlForModel(FALLBACK_MODEL)}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  if (!response.ok) {
    const errText = await response.text();
    const err = new Error(`Gemini request failed (${response.status})`);
    err.status = response.status;
    err.details = errText;
    throw err;
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text.trim()) {
    const blockReason = result?.candidates?.[0]?.finishReason || result?.promptFeedback?.blockReason;
    const err = new Error(
      blockReason
        ? `Gemini could not analyze this image (${blockReason}). Try a clearer photo.`
        : 'Gemini returned an empty analysis. Try again with a clearer food photo.'
    );
    err.status = 422;
    throw err;
  }
  const detailed = parseGeminiJSON(text);
  const nouris = toNourisShape(detailed);
  return { detailed, nouris };
}
