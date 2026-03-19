const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
   - Glycemic response: estimated glucose spike, insulin secretion pattern
   - Lipid metabolism: chylomicron formation, fat oxidation vs storage
   - Hormone cascade: insulin, ghrelin, leptin, GLP-1, CCK
   - Inflammatory signaling: cytokine response (IL-6, TNF-a)
   - Gut response: transit time, fermentation products, microbiome shifts

4. CHRONIC IMPACT (weeks to years of regular consumption)
   CARDIOVASCULAR SYSTEM, METABOLIC HEALTH, INFLAMMATORY STATE, CANCER RISK, HORMONAL BALANCE, MICROBIOME & GUT HEALTH, COGNITIVE FUNCTION.
   For each domain provide mechanism, biomarkers, timeline.

5. NUTRIENT SYNERGIES & ANTAGONISMS
6. TEMPORAL ACCUMULATION EFFECTS (1 week, 1 month, 1 year)
7. PERSONALIZATION FACTORS
8. OPTIMIZATION RECOMMENDATIONS

Return JSON only with this exact top-level structure:
{
  "foods": [{"name":"string","estimated_portion_g_or_ml":"string","prep_method":"string","macros":{"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"sugar_g":number,"sodium_mg":number,"saturated_fat_g":number,"calories":number}}],
  "acuteResponse": {"glucoseSpike":"string","hormoneCascade":"string","inflammation":"string","lipidMetabolism":"string","gutResponse":"string"},
  "chronicImpact": {
    "cardiovascular":{"mechanism":"string","biomarkers":"string","timeline":"string"},
    "metabolic":{"mechanism":"string","biomarkers":"string","timeline":"string"},
    "inflammation":{"mechanism":"string","biomarkers":"string","timeline":"string"},
    "cancerRisk":{"mechanism":"string","biomarkers":"string","timeline":"string"},
    "hormonal":{"mechanism":"string","biomarkers":"string","timeline":"string"},
    "microbiome":{"mechanism":"string","biomarkers":"string","timeline":"string"},
    "cognitive":{"mechanism":"string","biomarkers":"string","timeline":"string"}
  },
  "accumulationCurve":{"oneWeek":"string","oneMonth":"string","oneYear":"string"},
  "optimizations":["string"],
  "confidence": number
}`;

function parseGeminiJSON(text) {
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Gemini returned non-JSON output.');
  }
}

function sumMacros(foods = []) {
  const totals = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    saturated_fat_g: 0,
    omega3_mg: 0,
  };
  for (const f of foods) {
    const m = f?.macros || {};
    totals.calories += Number(m.calories || 0);
    totals.protein_g += Number(m.protein_g || 0);
    totals.carbs_g += Number(m.carbs_g || 0);
    totals.fat_g += Number(m.fat_g || 0);
    totals.fiber_g += Number(m.fiber_g || 0);
    totals.sugar_g += Number(m.sugar_g || 0);
    totals.sodium_mg += Number(m.sodium_mg || 0);
    totals.saturated_fat_g += Number(m.saturated_fat_g || 0);
  }
  for (const k of Object.keys(totals)) {
    totals[k] = Math.round(totals[k] * 10) / 10;
  }
  return totals;
}

function toNourisShape(detailed) {
  const foods = Array.isArray(detailed?.foods) ? detailed.foods : [];
  const names = foods.map((f) => f?.name).filter(Boolean);
  const mealName = names.length ? names.join(', ') : 'Food analysis';
  const nutrition = sumMacros(foods);
  const glycemic_load =
    nutrition.carbs_g > 50 && nutrition.fiber_g < 3
      ? 'high'
      : nutrition.carbs_g < 30 && nutrition.fiber_g > 5
      ? 'low'
      : 'medium';

  const healthScore = Math.min(
    10,
    Math.max(
      1,
      Math.round(
        10 -
          (nutrition.sugar_g > 25 ? 1 : nutrition.sugar_g > 15 ? 0.5 : 0) -
          (nutrition.sodium_mg > 900 ? 1 : nutrition.sodium_mg > 500 ? 0.5 : 0) +
          (nutrition.protein_g > 20 ? 0.5 : 0) +
          (nutrition.fiber_g > 5 ? 0.5 : 0)
      )
    )
  );

  const acute = detailed?.acuteResponse || {};
  const chronic = detailed?.chronicImpact || {};

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
        finding: 'Acute glycemic and hormonal response',
        biological_mechanism:
          acute.glucoseSpike || acute.hormoneCascade || 'Estimated metabolic response based on visible composition.',
        timeframe: 'within_hours',
        severity: 'moderate',
        affects: ['blood_sugar', 'hormones'],
        context: acute.lipidMetabolism || '',
      },
      {
        finding: 'Chronic metabolic trajectory',
        biological_mechanism:
          chronic?.metabolic?.mechanism || chronic?.cardiovascular?.mechanism || 'Pattern-dependent long-term effects.',
        timeframe: 'chronic',
        severity: 'moderate',
        affects: ['heart', 'metabolic_health', 'inflammation'],
        context: chronic?.metabolic?.timeline || '',
      },
    ],
    contaminant_flags: [],
    restaurant_warnings: [],
    what_your_body_does_next_4_hours: [
      acute.glucoseSpike,
      acute.hormoneCascade,
      acute.inflammation,
      acute.gutResponse,
    ]
      .filter(Boolean)
      .join(' '),
    chronic_risk_if_eaten_regularly: [
      chronic?.metabolic?.mechanism,
      chronic?.cardiovascular?.mechanism,
      detailed?.accumulationCurve?.oneYear,
    ]
      .filter(Boolean)
      .join(' '),
    meal_pattern_flags: [],
    health_score: healthScore,
    score_reasoning: [
      `Estimated ${nutrition.calories} kcal`,
      `Carbs ${nutrition.carbs_g}g, sugar ${nutrition.sugar_g}g`,
      `Protein ${nutrition.protein_g}g, fiber ${nutrition.fiber_g}g`,
      `Sodium ${nutrition.sodium_mg}mg`,
    ],
    health_flags: [],
    long_term_health_signals: {
      heart_health_impact: chronic?.cardiovascular?.mechanism || '',
      metabolic_impact: chronic?.metabolic?.mechanism || '',
      gut_health_impact: chronic?.microbiome?.mechanism || '',
      brain_health_impact: chronic?.cognitive?.mechanism || '',
      hormonal_impact: chronic?.hormonal?.mechanism || '',
    },
    the_one_swap: detailed?.optimizations?.[0] || '',
    coach_message:
      'Mechanistic analysis complete. Focus on the highest-leverage swap and consistency over time.',
    confidence_caveat:
      Number(detailed?.confidence || 75) < 70
        ? 'Image quality or food ambiguity reduces confidence in identification and quantification.'
        : '',
    detailed_analysis: detailed,
  };
}

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

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [
            { text: analysisPrompt },
            {
              inline_data: {
                mime_type: mediaType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        response_mime_type: 'application/json',
      },
    };

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Gemini request failed (${response.status})`,
        details: errText.slice(0, 300),
      });
    }

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const detailed = parseGeminiJSON(text);
    const nouris = toNourisShape(detailed);
    return res.status(200).json(nouris);
  } catch (err) {
    console.error('Gemini analyze error:', err);
    return res.status(500).json({ error: err.message || 'Gemini analysis failed' });
  }
}

