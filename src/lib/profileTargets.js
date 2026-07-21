const ACTIVITY_FACTORS = {
  Sedentary: 1.2,
  'Lightly active': 1.375,
  'Moderately active': 1.55,
  'Very active': 1.725,
};

/**
 * Mifflin–St Jeor based calorie + macro targets.
 */
export function calculateTargets(profile) {
  const sex = profile?.sex === 'female' ? 'female' : 'male';
  const age = Math.max(10, Math.min(120, Number(profile?.age) || 30));
  const weight = Math.max(
    30,
    Math.min(300, Number(profile?.weight_kg) || (sex === 'male' ? 80 : 65))
  );
  const height = Math.max(
    100,
    Math.min(250, Number(profile?.height_cm) || (sex === 'male' ? 175 : 160))
  );

  let bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161);
  let calories = bmr * (ACTIVITY_FACTORS[profile?.activity] || 1.375);

  if (profile?.goal === 'Lose weight') calories -= 500;
  if (profile?.goal === 'Build muscle') calories += 300;

  calories = Math.max(1200, Math.round(calories));

  return {
    daily_calories: calories,
    protein_target: Math.round((calories * 0.25) / 4),
    fat_target: Math.round((calories * 0.3) / 9),
    carb_target: Math.round((calories * 0.45) / 4),
    fiber_target: 30,
  };
}

export const GOAL_OPTIONS = [
  'Lose weight',
  'Build muscle',
  'Improve energy',
  'Manage blood sugar',
  'Eat healthier generally',
];

export const CONDITION_OPTIONS = [
  'Diabetes',
  'Hypertension',
  'High cholesterol',
  'None',
];

export const ACTIVITY_OPTIONS = [
  'Sedentary',
  'Lightly active',
  'Moderately active',
  'Very active',
];

export const DIET_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian', desc: 'No meat, fish, or poultry' },
  { value: 'non_vegetarian', label: 'Non-vegetarian', desc: 'Includes meat, fish, and poultry' },
];

export function dietPreferenceLabel(value) {
  if (value === 'vegetarian') return 'Vegetarian';
  return 'Non-vegetarian';
}

export function dietPreferencePromptRule(value) {
  if (value === 'vegetarian') {
    return 'DIET: Vegetarian only. Never recommend meat, poultry, fish, seafood, or animal flesh. Dairy and eggs are allowed unless the user says otherwise. Prefer plant proteins (dal, paneer, tofu, legumes, nuts).';
  }
  return 'DIET: Non-vegetarian. Meat, fish, poultry, eggs, and dairy are all allowed. Still prefer balanced, whole-food options.';
}
