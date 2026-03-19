/**
 * Packaged product analysis using OpenFoodFacts data, mapped to Nouris format.
 */

function extractFromOpenFoodFacts(product = {}) {
  const nutr = product.nutriments || {};

  function n(field, fallback = 0) {
    const v = nutr[field];
    return typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) || fallback : fallback;
  }

  // Prefer per 100g; fall back to per serving if needed
  const calories =
    n('energy-kcal_100g') ||
    n('energy-kcal_serving') ||
    n('energy-kj_100g') / 4.184 ||
    n('energy-kj_serving') / 4.184;

  const sodium_mg =
    n('sodium_100g') * 1000 ||
    // salt (g) → sodium (mg) approx salt_g * 400
    n('salt_100g') * 400;

  return {
    calories: Math.round(calories || 0),
    protein_g: Math.round(n('proteins_100g') * 10) / 10,
    carbs_g: Math.round(n('carbohydrates_100g') * 10) / 10,
    fat_g: Math.round(n('fat_100g') * 10) / 10,
    fiber_g: Math.round(n('fiber_100g') * 10) / 10,
    sugar_g: Math.round(n('sugars_100g') * 10) / 10,
    sodium_mg: Math.round(sodium_mg || 0),
    saturated_fat_g: Math.round(n('saturated-fat_100g') * 10) / 10,
  };
}

function buildNourisFromProduct(product, confidence = 80) {
  const nutrients = extractFromOpenFoodFacts(product);
  const name = product.product_name || product.generic_name || 'Packaged product';
  const brand = product.brands || '';
  const meal_name = brand ? `${brand} ${name}`.trim() : name;

  const carbs = nutrients.carbs_g || 0;
  const fiber = nutrients.fiber_g || 0;
  const sugar = nutrients.sugar_g || 0;
  const glycemic_load =
    carbs > 50 && fiber < 3 ? 'high' : carbs < 30 && fiber > 5 ? 'low' : 'medium';

  const healthScore = Math.min(
    10,
    Math.max(
      1,
      Math.round(
        10 -
          (nutrients.sodium_mg > 800 ? 1.5 : nutrients.sodium_mg > 500 ? 0.5 : 0) -
          (sugar > 25 ? 1 : sugar > 15 ? 0.5 : 0) +
          (nutrients.protein_g > 10 ? 0.5 : 0) +
          (fiber > 5 ? 0.5 : 0)
      )
    )
  );

  const nutrition = {
    ...nutrients,
    omega3_mg: 0,
    glycemic_load,
  };

  return {
    meal_name,
    confidence,
    preparation_context: 'packaged',
    visible_ingredients: [meal_name],
    likely_hidden_ingredients: [],
    nutrition,
    micronutrients: [],
    health_implications: [],
    contaminant_flags: [],
    restaurant_warnings: [],
    what_your_body_does_next_4_hours:
      'This packaged product is digested similarly each time you consume it — the nutrition facts represent a consistent impact on blood sugar, sodium load, and energy. Use the label as a reliable guide for how it fits into your daily targets.',
    chronic_risk_if_eaten_regularly:
      'Because this is a packaged item with fixed nutrition, eating it frequently can meaningfully affect your long‑term sodium, sugar, and calorie balance. Pay special attention if it is high in added sugar or sodium.',
    meal_pattern_flags: [],
    health_score: healthScore,
    score_reasoning: [
      `Estimated ${nutrition.calories} kcal per 100g serving`,
      `Protein: ${nutrition.protein_g} g`,
      nutrition.sodium_mg > 500 ? 'Moderate-to-high sodium' : 'Reasonable sodium',
      fiber > 3 ? 'Includes some fiber' : 'Very low fiber',
    ],
    health_flags: [],
    long_term_health_signals: {
      heart_health_impact:
        nutrition.sodium_mg > 800
          ? 'Regular intake could raise blood pressure due to sodium.'
          : 'Neutral for heart health when eaten in moderation.',
      metabolic_impact:
        sugar > 20
          ? 'High sugar load per serving can stress blood sugar control if consumed often.'
          : 'Fairly modest impact on blood sugar if portion sizes are controlled.',
      gut_health_impact:
        fiber > 3
          ? 'Provides some fiber support for gut health.'
          : 'Very low fiber; contribute little to microbiome support.',
      brain_health_impact: '',
      hormonal_impact: '',
    },
    the_one_swap:
      sugar > 15
        ? 'Look for a version with less added sugar or choose a similar product with more fiber to blunt glucose spikes.'
        : 'Pair this with something high‑fiber or protein‑rich to make the snack more balanced.',
    coach_message: `This looks like a packaged product: ${meal_name}. Because nutrition is standardized on the label, you can treat these numbers as reliable and decide how often it belongs in your routine.`,
    confidence_caveat:
      confidence < 70
        ? 'Brand/product recognition from the label text may be imperfect. Double‑check that the product name matches what you scanned.'
        : '',
  };
}

/**
 * Build a Nouris-style analysis object from an OpenFoodFacts API response.
 */
export function buildPackagedAnalysis(openFoodFactsResponse, recognitionMeta = {}) {
  const product =
    openFoodFactsResponse?.product ||
    (Array.isArray(openFoodFactsResponse?.products) &&
      openFoodFactsResponse.products[0]) ||
    {};
  const confidence = recognitionMeta.confidence ?? 80;
  return buildNourisFromProduct(product, confidence);
}

