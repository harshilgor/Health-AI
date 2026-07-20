/**
 * Build a normalized local meal row for Dashboard / Week views.
 */
export function buildLocalMealRow(analysis, image, { mealType = 'lunch', location = '', mealId = null, fromApi = false } = {}) {
  const id = mealId || `local-${Date.now()}`;
  return {
    id,
    meal_id: mealId || undefined,
    meal_name: analysis?.meal_name || 'Meal',
    image: image || '',
    date: new Date().toISOString(),
    health_score: analysis?.health_score ?? 0,
    nutrition: analysis?.nutrition || {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
    },
    meal_type: mealType,
    location: location || '',
    fromApi: !!fromApi,
    fullAnalysis: analysis,
  };
}
