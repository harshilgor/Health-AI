/**
 * LogMeal API integration for food/drink recognition and nutritional analysis.
 * Uses our API proxy to avoid CORS and keep the token server-side.
 */

function extractNutrients(totalNutrients) {
  const out = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    saturated_fat_g: 0,
    omega3_mg: 0,
    glycemic_load: 'medium',
  };
  if (!totalNutrients || typeof totalNutrients !== 'object') return out;

  for (const [code, data] of Object.entries(totalNutrients)) {
    const q = data?.quantity ?? 0;
    const unit = (data?.unit || '').toLowerCase();
    switch (code) {
      case 'ENERC_KCAL':
        out.calories = Math.round(q);
        break;
      case 'PROCNT':
        out.protein_g = Math.round(q * 10) / 10;
        break;
      case 'CHOCDF':
        out.carbs_g = Math.round(q * 10) / 10;
        break;
      case 'FAT':
        out.fat_g = Math.round(q * 10) / 10;
        break;
      case 'FASAT':
        out.saturated_fat_g = Math.round(q * 10) / 10;
        break;
      case 'SUGAR':
        out.sugar_g = Math.round(q * 10) / 10;
        break;
      case 'NA':
        out.sodium_mg = unit === 'mg' ? Math.round(q) : Math.round(q * 1000);
        break;
      case 'FIBTG':
        out.fiber_g = Math.round(q * 10) / 10;
        break;
      case 'F20D5':
      case 'F22D6':
      case 'F18D3CN3':
        out.omega3_mg += unit === 'g' ? Math.round(q * 1000) : Math.round(q);
        break;
      default:
        break;
    }
  }
  return out;
}

function transformToNourisFormat(segmentationData, nutritionData) {
  const foodNames = nutritionData?.foodName;
  const segResults = segmentationData?.segmentation_results || [];
  const dishNames = [];
  for (const item of segResults) {
    const rec = item?.recognition_results?.[0];
    if (rec?.name) dishNames.push(rec.name);
  }
  const mealName =
    Array.isArray(foodNames)
      ? foodNames.join(', ')
      : foodNames ||
        dishNames.join(', ') ||
        segmentationData?.foodType?.name ||
        'Recognized food/drink';
  const nutr = nutritionData?.nutritional_info;
  const nutrients = extractNutrients(nutr?.totalNutrients || {});
  const calories = nutr?.calories ?? nutrients.calories;

  const visibleIngredients = dishNames.length > 0 ? dishNames : [mealName];
  const avgConfidence =
    segResults.length > 0
      ? segResults.reduce((acc, s) => {
          const p = s?.recognition_results?.[0]?.prob ?? 0;
          return acc + p;
        }, 0) / segResults.length
      : 0.8;
  const confidence = Math.round(avgConfidence * 100);

  const carbs = nutrients.carbs_g || 0;
  const fiber = nutrients.fiber_g || 0;
  const sugar = nutrients.sugar_g || 0;
  const glycemicLoad =
    carbs > 50 && fiber < 3 ? 'high' : carbs < 30 && fiber > 5 ? 'low' : 'medium';

  const healthScore = Math.min(
    10,
    Math.max(
      1,
      Math.round(
        10 -
          (nutrients.sodium_mg > 800 ? 1.5 : nutrients.sodium_mg > 500 ? 0.5 : 0) -
          (sugar > 25 ? 1 : sugar > 15 ? 0.5 : 0) +
          (nutrients.protein_g > 20 ? 0.5 : 0) +
          (fiber > 5 ? 0.5 : 0)
      )
    )
  );

  const isDrink =
    segmentationData?.foodType?.name === 'drinks' ||
    mealName.toLowerCase().includes('juice') ||
    mealName.toLowerCase().includes('smoothie') ||
    mealName.toLowerCase().includes('coffee') ||
    mealName.toLowerCase().includes('tea') ||
    mealName.toLowerCase().includes('soda') ||
    mealName.toLowerCase().includes('water') ||
    mealName.toLowerCase().includes('drink');

  const whatYourBodyDoes = isDrink
    ? `Over the next 30 minutes, the liquid is absorbed quickly. ${sugar > 15 ? 'The sugar content may cause a rapid blood sugar spike followed by a dip in energy.' : 'Hydration and any electrolytes are absorbed.'} In 1–2 hours, ${nutrients.protein_g > 5 ? 'any protein contributes to satiety.' : 'you may feel hungry again as liquids empty from the stomach faster than solid food.'}`
    : `In the first 30 minutes, digestion begins. Over 1–2 hours, carbohydrates are broken down and absorbed${carbs > 40 ? ', which may cause a noticeable blood sugar response' : ''}. Protein and fats slow absorption. By 2–4 hours, nutrients are entering the bloodstream and affecting energy levels.`;

  const chronicRisk =
    nutrients.sodium_mg > 1500
      ? 'Regularly eating high-sodium meals can raise blood pressure over time.'
      : sugar > 30
        ? 'Frequent high-sugar intake can contribute to insulin resistance and energy swings.'
        : 'As part of a balanced diet, this meal poses minimal chronic risk.';

  return {
    meal_name: mealName,
    confidence,
    preparation_context: 'unknown',
    visible_ingredients: visibleIngredients,
    likely_hidden_ingredients: [],
    nutrition: {
      ...nutrients,
      calories: Math.round(calories),
      glycemic_load: glycemicLoad,
    },
    micronutrients: [],
    health_implications: [],
    contaminant_flags: [],
    restaurant_warnings: [],
    what_your_body_does_next_4_hours: whatYourBodyDoes,
    chronic_risk_if_eaten_regularly: chronicRisk,
    meal_pattern_flags: [],
    health_score: healthScore,
    score_reasoning: [
      `Calories: ${Math.round(calories)} kcal`,
      `Protein: ${nutrients.protein_g}g`,
      nutrients.sodium_mg > 500 ? 'Moderate-to-high sodium' : 'Reasonable sodium',
      fiber > 3 ? 'Good fiber content' : 'Consider adding fiber',
    ],
    health_flags: [],
    long_term_health_signals: {},
    the_one_swap: sugar > 20 ? 'Consider a lower-sugar version or smaller portion.' : 'Looks balanced—pair with veggies for extra fiber.',
    coach_message: `Recognized: ${mealName}. ${nutrients.calories ? `About ${Math.round(calories)} calories. ` : ''}${nutrients.protein_g > 10 ? 'Good protein. ' : ''}${confidence >= 70 ? 'Analysis confidence is high.' : 'Photo quality may affect accuracy.'}`,
    confidence_caveat:
      confidence < 70
        ? 'Recognition confidence is moderate. For better results, use a clearer photo with good lighting.'
        : '',
  };
}

/**
 * Analyze a meal image using LogMeal API (via our proxy).
 * @param {string} base64Image - Base64-encoded image (with or without data URL prefix)
 * @param {string} mediaType - e.g. 'image/jpeg', 'image/png'
 * @param {object} profile - User profile (optional, for future use)
 * @returns {Promise<object>} Nouris-formatted analysis
 */
export async function analyzeMealWithLogMeal(base64Image, mediaType = 'image/jpeg') {
  const apiBase =
    import.meta.env.DEV || window.location.hostname === 'localhost'
      ? ''
      : window.location.origin;

  const res = await fetch(`${apiBase}/api/logmeal/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64Image.replace(/^data:image\/\w+;base64,/, ''),
      mediaType,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Analysis failed');
  }

  const data = await res.json();
  return transformToNourisFormat(data.segmentation, data.nutrition);
}
