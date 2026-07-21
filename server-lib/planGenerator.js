const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function slugify(text) {
  return String(text || 'custom-plan')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || `custom-${Date.now()}`;
}

export async function generateCustomNutritionPlan({ profile, preferences, apiKey }) {
  const diet = profile?.diet_preference === 'vegetarian' ? 'vegetarian' : 'non_vegetarian';
  const dietRule = diet === 'vegetarian'
    ? 'STRICT: This user is VEGETARIAN. All key_foods, avoid_foods, meal examples, and weekly_menu must be vegetarian (no meat, fish, poultry, or seafood). Prefer dal, paneer, tofu, legumes, eggs, dairy, grains, and vegetables.'
    : 'This user is NON-VEGETARIAN. Meat, fish, poultry, eggs, and dairy are allowed in recommendations.';

  const prompt = `You are an expert nutrition coach. Create a personalized 30-day nutrition plan as JSON only (no markdown).

USER PROFILE:
- Goal: ${profile?.goal || 'Eat healthier'}
- Age: ${profile?.age || 30}, Sex: ${profile?.sex || 'unknown'}
- Activity: ${profile?.activity || 'Lightly active'}
- Conditions: ${profile?.conditions || 'None'}
- Diet preference: ${diet}
- Daily calories target: ${profile?.daily_calories || 2000}
- Protein target: ${profile?.protein_target || 125}g

${dietRule}

USER REQUEST:
${preferences || 'Build a balanced plan for sustainable health.'}

Return ONLY valid JSON:
{
  "name": "Plan name",
  "tagline": "Short catchy tagline",
  "description": "2-3 sentence description",
  "category": "physique|longevity|cognitive|recovery",
  "protein_pct": 30,
  "carbs_pct": 40,
  "fat_pct": 30,
  "meals_per_day": 3,
  "meal_timing": [
    {"slot":"breakfast","time":"8:00 AM","label":"Morning","example":"Example meal"}
  ],
  "key_foods": ["food1","food2"],
  "avoid_foods": ["food1"],
  "duration_days": 30,
  "difficulty": "beginner|intermediate|advanced",
  "strictness": 3,
  "primary_organ": "heart|brain|gut|muscle|immune",
  "secondary_organ": "heart|brain|gut|muscle|immune",
  "expected_results": {"week1":"...","month1":"..."},
  "weekly_menu": [
    {"day":"Monday","meals":[{"slot":"breakfast","name":"...","description":"..."}]}
  ]
}`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini plan generation failed (${res.status}): ${txt.slice(0, 200)}`);
  }

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Failed to parse generated plan JSON');
    parsed = JSON.parse(match[0]);
  }

  const slug = `ai-${slugify(parsed.name)}-${Date.now().toString(36)}`;

  return {
    slug,
    name: parsed.name || 'Your AI Plan',
    category: ['physique', 'longevity', 'cognitive', 'recovery'].includes(parsed.category)
      ? parsed.category
      : 'longevity',
    tagline: parsed.tagline || 'Personalized for you',
    description: parsed.description || '',
    inspired_by: 'AI-generated for your goals',
    protein_pct: Number(parsed.protein_pct) || 30,
    carbs_pct: Number(parsed.carbs_pct) || 40,
    fat_pct: Number(parsed.fat_pct) || 30,
    meals_per_day: Number(parsed.meals_per_day) || 3,
    meal_timing: parsed.meal_timing || [],
    key_foods: parsed.key_foods || [],
    avoid_foods: parsed.avoid_foods || [],
    duration_days: Number(parsed.duration_days) || 30,
    difficulty: parsed.difficulty || 'intermediate',
    strictness: Math.min(5, Math.max(1, Number(parsed.strictness) || 3)),
    primary_organ: parsed.primary_organ || 'gut',
    secondary_organ: parsed.secondary_organ || 'heart',
    expected_results: parsed.expected_results || {},
    weekly_menu: parsed.weekly_menu || [],
    is_ai_generated: true,
  };
}
