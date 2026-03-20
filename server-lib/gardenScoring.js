/**
 * Derive organ impact deltas and biological age delta from meal analysis (no extra Gemini fields required).
 * Uses health_score + keyword cues from foods list and quick_summary bullets.
 */

const ORGANS = ['heart', 'brain', 'gut', 'muscle', 'immune', 'bones'];

const HEART_GOOD = /\b(salmon|tuna|sardine|mackerel|walnut|almond|avocado|oat|broccoli|spinach|kale|berry|berries|olive|fish|lentil|bean|quinoa|vegetable|salad|tomato)\b/i;
const HEART_BAD = /\b(fried|trans|bacon|sausage|hot dog|fast food|processed meat|deep fry|nugget)\b/i;

const BRAIN_GOOD = /\b(fish|salmon|egg|berry|berries|walnut|almond|leafy|spinach|kale|broccoli|yogurt|nut)\b/i;
const BRAIN_BAD = /\b(soda|energy drink|frosting|candy|syrup|fried)\b/i;

const GUT_GOOD = /\b(yogurt|kefir|kimchi|sauerkraut|miso|fiber|bean|lentil|vegetable|oat|banana|apple)\b/i;
const GUT_BAD = /\b(soda|fried|ultra.processed|fast food|sugar|sweet)\b/i;

const MUSCLE_GOOD = /\b(chicken|beef|fish|egg|turkey|tofu|greek yogurt|quinoa|rice|pasta|protein|lentil|bean)\b/i;
const MUSCLE_BAD = /\b(only sugar|pastry|soda)\b/i;

const IMMUNE_GOOD = /\b(citrus|orange|lemon|berry|garlic|ginger|yogurt|vegetable|pepper|tomato|broccoli)\b/i;
const IMMUNE_BAD = /\b(alcohol|fried|soda|sugar)\b/i;

const BONE_GOOD = /\b(milk|yogurt|cheese|dairy|kale|broccoli|salmon|sardine|fortified)\b/i;

function countMatches(blob, re) {
  const m = blob.match(re);
  return m ? m.length : 0;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * @param {{ nouris: object, detailed: object }} params
 * @returns {{
 *   organImpacts: Record<string, number>,
 *   bioAgeDelta: number,
 *   mealQuality: string,
 *   environment: 'clear' | 'partly' | 'foggy' | 'rainy'
 * }}
 */
export function scoreMealForGarden({ nouris, detailed }) {
  const healthScore = clamp(Number(nouris?.health_score ?? 5), 1, 10);
  const foods = Array.isArray(detailed?.foods) ? detailed.foods.map((f) => String(f).toLowerCase()).join(' ') : '';
  const qs = nouris?.quick_summary || {};
  const bullets = [
    ...(Array.isArray(qs.cardiovascular) ? qs.cardiovascular : []),
    ...(Array.isArray(qs.metabolic) ? qs.metabolic : []),
    ...(Array.isArray(qs.inflammatory) ? qs.inflammatory : []),
    ...(Array.isArray(qs.positives) ? qs.positives : []),
  ]
    .join(' ')
    .toLowerCase();
  const blob = `${foods} ${bullets}`;

  // Base swing from health score: 1..10 -> roughly -4..+4
  const base = Math.round((healthScore - 5.5) * 0.9);

  const heart =
    base +
    (HEART_GOOD.test(blob) ? 2 : 0) +
    (HEART_BAD.test(blob) ? -3 : 0) +
    (countMatches(blob, /sodium|salt|bp|pressure/i) > 0 ? -1 : 0);

  const brain =
    base +
    (BRAIN_GOOD.test(blob) ? 2 : 0) +
    (BRAIN_BAD.test(blob) ? -2 : 0);

  const gut =
    base +
    (GUT_GOOD.test(blob) ? 2 : 0) +
    (GUT_BAD.test(blob) ? -2 : 0);

  const muscle =
    base +
    (MUSCLE_GOOD.test(blob) ? 2 : 0) +
    (MUSCLE_BAD.test(blob) ? -1 : 0);

  const immune =
    base +
    (IMMUNE_GOOD.test(blob) ? 1 : 0) +
    (IMMUNE_BAD.test(blob) ? -2 : 0);

  const bones = base + (BONE_GOOD.test(blob) ? 1 : 0) + (IMMUNE_BAD.test(blob) ? -1 : 0);

  const organImpacts = {
    heart: clamp(heart, -8, 8),
    brain: clamp(brain, -8, 8),
    gut: clamp(gut, -8, 8),
    muscle: clamp(muscle, -8, 8),
    immune: clamp(immune, -8, 8),
    bones: clamp(bones, -8, 8),
  };

  // Healthy meals lower biological age (negative delta = younger)
  const bioAgeDelta = Number(((5.5 - healthScore) * 0.018 + (HEART_BAD.test(blob) ? 0.02 : 0)).toFixed(3));

  let mealQuality = 'neutral';
  if (healthScore >= 8 && organImpacts.heart >= 0) mealQuality = 'excellent';
  else if (healthScore >= 6) mealQuality = 'good';
  else if (healthScore <= 4) mealQuality = 'poor';

  let environment = 'partly';
  if (healthScore >= 8 && !HEART_BAD.test(blob)) environment = 'clear';
  else if (/\b(inflamm|fried|processed|sugar)\b/i.test(blob) && healthScore < 6) environment = 'foggy';
  else if (healthScore <= 3) environment = 'rainy';

  return { organImpacts, bioAgeDelta, mealQuality, environment };
}

export { ORGANS };
