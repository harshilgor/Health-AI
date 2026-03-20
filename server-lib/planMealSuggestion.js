const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function generatePlanMealSuggestions({
  planName, planGoal, keyFoods, avoidFoods,
  mealSlot, remaining, restrictions, apiKey,
}) {
  const prompt = `You are a nutrition expert. Generate exactly 3 meal suggestions for the "${mealSlot}" slot that fit this nutrition plan.

PLAN: ${planName}
GOAL: ${planGoal}

REMAINING MACROS FOR TODAY (this meal should contribute toward these):
- Protein: ${remaining.protein}g remaining
- Carbs: ${remaining.carbs}g remaining
- Fat: ${remaining.fat}g remaining
- Calories: ${remaining.calories} kcal remaining

PRIORITIZE THESE FOODS: ${keyFoods.join(', ')}
AVOID THESE FOODS: ${avoidFoods.join(', ')}
USER DIETARY RESTRICTIONS: ${restrictions}

Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "meals": [
    {
      "name": "Meal name",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "macros": {"protein": 40, "carbs": 35, "fat": 15, "calories": 430},
      "prepTime": "15 minutes",
      "difficulty": "Easy",
      "recipe": "Brief 2-3 step recipe",
      "planAdherence": 95
    }
  ]
}

planAdherence is 0-100 indicating how well the meal fits the plan requirements.
Sort the 3 meals from highest to lowest planAdherence.`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*"meals"[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse Gemini meal suggestions');
    }
  }

  const meals = (parsed.meals || []).map((m) => ({
    name: m.name || 'Suggested Meal',
    ingredients: m.ingredients || [],
    macros: {
      protein: Number(m.macros?.protein) || 0,
      carbs: Number(m.macros?.carbs) || 0,
      fat: Number(m.macros?.fat) || 0,
      calories: Number(m.macros?.calories) || 0,
    },
    prepTime: m.prepTime || '15 minutes',
    difficulty: m.difficulty || 'Easy',
    recipe: m.recipe || '',
    planAdherence: Math.min(100, Math.max(0, Number(m.planAdherence) || 50)),
  }));

  return meals.sort((a, b) => b.planAdherence - a.planAdherence);
}
