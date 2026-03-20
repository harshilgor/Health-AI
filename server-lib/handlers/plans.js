import { getSupabaseAdmin } from '../supabaseServer.js';
import { getAuthedUserId } from '../authUser.js';
import { generatePlanMealSuggestions } from '../planMealSuggestion.js';
import { checkAndUnlockBadges } from '../planBadges.js';

function jsonError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function calcAdherence(actual, target) {
  if (!actual || !target) return 0;
  const keys = ['protein', 'carbs', 'fat'];
  let total = 0;
  for (const k of keys) {
    const t = Number(target[k]) || 1;
    const a = Number(actual[k]) || 0;
    const ratio = Math.min(a / t, 1.5);
    total += Math.max(0, 100 - Math.abs(100 - ratio * 100));
  }
  return Math.round(total / keys.length);
}

async function listPlans(req, res) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('nutrition_plans')
    .select('*')
    .order('category')
    .order('name');

  if (error) return jsonError(res, 500, 'Failed to load plans', { details: error.message });

  const { data: counts } = await supabase
    .from('user_plan_enrollments')
    .select('plan_id');

  const countMap = {};
  if (counts) {
    for (const row of counts) {
      countMap[row.plan_id] = (countMap[row.plan_id] || 0) + 1;
    }
  }

  const plans = (data || []).map((p) => ({
    ...p,
    enrollment_count: countMap[p.plan_id] || 0,
  }));

  return res.status(200).json({ plans });
}

async function getPlanDetail(req, res, slug) {
  const supabase = getSupabaseAdmin();
  let userId;
  try { userId = await getAuthedUserId(req); } catch { userId = null; }

  const { data: plan, error } = await supabase
    .from('nutrition_plans')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return jsonError(res, 500, 'Failed to load plan', { details: error.message });
  if (!plan) return jsonError(res, 404, 'Plan not found');

  const { data: counts } = await supabase
    .from('user_plan_enrollments')
    .select('enrollment_id')
    .eq('plan_id', plan.plan_id);

  plan.enrollment_count = counts?.length || 0;

  let enrollment = null;
  if (userId) {
    const { data: e } = await supabase
      .from('user_plan_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_id', plan.plan_id)
      .eq('is_active', true)
      .maybeSingle();
    enrollment = e || null;
  }

  return res.status(200).json({ plan, enrollment });
}

async function enrollInPlan(req, res) {
  const supabase = getSupabaseAdmin();
  let userId;
  try { userId = await getAuthedUserId(req); } catch (e) {
    return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
  }
  if (!userId) return jsonError(res, 401, 'Auth required');

  const { plan_id } = req.body || {};
  if (!plan_id) return jsonError(res, 400, 'Missing plan_id');

  const { data: plan } = await supabase
    .from('nutrition_plans')
    .select('*')
    .eq('plan_id', plan_id)
    .maybeSingle();
  if (!plan) return jsonError(res, 404, 'Plan not found');

  await supabase
    .from('user_plan_enrollments')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  const { data: garden } = await supabase
    .from('user_garden')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const startDate = today();
  const endDate = new Date(Date.now() + plan.duration_days * 86400000).toISOString().slice(0, 10);

  const { data: enrollment, error } = await supabase
    .from('user_plan_enrollments')
    .insert({
      user_id: userId,
      plan_id: plan.plan_id,
      start_date: startDate,
      target_end_date: endDate,
      current_day: 1,
      is_active: true,
      starting_bio_age: garden?.biological_age || null,
      starting_organ_health: garden ? {
        heart: garden.heart, brain: garden.brain, gut: garden.gut,
        muscle: garden.muscle, immune: garden.immune, bones: garden.bones,
      } : null,
    })
    .select('*')
    .single();

  if (error) return jsonError(res, 500, 'Enrollment failed', { details: error.message });

  const macrosTarget = {
    protein: Math.round(((plan.protein_pct / 100) * 2500) / 4),
    carbs: Math.round(((plan.carbs_pct / 100) * 2500) / 4),
    fat: Math.round(((plan.fat_pct / 100) * 2500) / 9),
    calories: 2500,
  };

  await supabase.from('plan_daily_progress').insert({
    enrollment_id: enrollment.enrollment_id,
    date: startDate,
    meals_target: plan.meals_per_day,
    macros_target: macrosTarget,
  });

  return res.status(201).json({ enrollment, plan });
}

async function getActivePlan(req, res) {
  const supabase = getSupabaseAdmin();
  let userId;
  try { userId = await getAuthedUserId(req); } catch (e) {
    return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
  }
  if (!userId) return jsonError(res, 401, 'Auth required');

  const { data: enrollment } = await supabase
    .from('user_plan_enrollments')
    .select('*, nutrition_plans(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!enrollment) return res.status(200).json({ active: null });

  const plan = enrollment.nutrition_plans;
  delete enrollment.nutrition_plans;

  const dayDiff = Math.max(1, Math.floor((Date.now() - new Date(enrollment.start_date).getTime()) / 86400000) + 1);
  if (dayDiff !== enrollment.current_day) {
    await supabase.from('user_plan_enrollments')
      .update({ current_day: dayDiff })
      .eq('enrollment_id', enrollment.enrollment_id);
    enrollment.current_day = dayDiff;
  }

  if (dayDiff > plan.duration_days && !enrollment.completed) {
    await supabase.from('user_plan_enrollments')
      .update({ completed: true, is_active: false })
      .eq('enrollment_id', enrollment.enrollment_id);
    enrollment.completed = true;
    enrollment.is_active = false;
  }

  const { data: todayProgress } = await supabase
    .from('plan_daily_progress')
    .select('*')
    .eq('enrollment_id', enrollment.enrollment_id)
    .eq('date', today())
    .maybeSingle();

  const macrosTarget = todayProgress?.macros_target || {
    protein: Math.round(((plan.protein_pct / 100) * 2500) / 4),
    carbs: Math.round(((plan.carbs_pct / 100) * 2500) / 4),
    fat: Math.round(((plan.fat_pct / 100) * 2500) / 9),
    calories: 2500,
  };

  if (!todayProgress) {
    await supabase.from('plan_daily_progress').upsert({
      enrollment_id: enrollment.enrollment_id,
      date: today(),
      meals_target: plan.meals_per_day,
      macros_target: macrosTarget,
    }, { onConflict: 'enrollment_id,date' });
  }

  const { data: allProgress } = await supabase
    .from('plan_daily_progress')
    .select('adherence_score, date')
    .eq('enrollment_id', enrollment.enrollment_id)
    .order('date', { ascending: false })
    .limit(7);

  const weekAdherence = allProgress && allProgress.length > 0
    ? Math.round(allProgress.reduce((s, r) => s + (r.adherence_score || 0), 0) / allProgress.length)
    : 0;

  const { data: totalProgress } = await supabase
    .from('plan_daily_progress')
    .select('adherence_score')
    .eq('enrollment_id', enrollment.enrollment_id);

  const overallAdherence = totalProgress && totalProgress.length > 0
    ? Math.round(totalProgress.reduce((s, r) => s + (r.adherence_score || 0), 0) / totalProgress.length)
    : 0;

  const { data: garden } = await supabase
    .from('user_garden')
    .select('biological_age, heart, brain, gut, muscle, immune, bones')
    .eq('user_id', userId)
    .maybeSingle();

  return res.status(200).json({
    active: {
      enrollment,
      plan,
      todayProgress: todayProgress || { meals_completed: 0, meals_target: plan.meals_per_day, macros_actual: { protein: 0, carbs: 0, fat: 0, calories: 0 }, macros_target: macrosTarget, adherence_score: 0 },
      weekAdherence,
      overallAdherence,
      currentGarden: garden,
    },
  });
}

async function getProgress(req, res) {
  const supabase = getSupabaseAdmin();
  let userId;
  try { userId = await getAuthedUserId(req); } catch (e) {
    return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
  }
  if (!userId) return jsonError(res, 401, 'Auth required');

  const { data: enrollment } = await supabase
    .from('user_plan_enrollments')
    .select('*, nutrition_plans(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!enrollment) return jsonError(res, 404, 'No active plan');

  const plan = enrollment.nutrition_plans;
  delete enrollment.nutrition_plans;

  const { data: dailyRows } = await supabase
    .from('plan_daily_progress')
    .select('*')
    .eq('enrollment_id', enrollment.enrollment_id)
    .order('date');

  const { data: garden } = await supabase
    .from('user_garden')
    .select('biological_age, heart, brain, gut, muscle, immune, bones')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: badges } = await supabase
    .from('plan_achievements')
    .select('badge_key, unlocked_at, plan_id')
    .eq('user_id', userId);

  const macroAvg = { protein: { target: 0, actual: 0 }, carbs: { target: 0, actual: 0 }, fat: { target: 0, actual: 0 } };
  let daysWithData = 0;
  for (const row of (dailyRows || [])) {
    if (!row.macros_actual) continue;
    daysWithData++;
    for (const k of ['protein', 'carbs', 'fat']) {
      macroAvg[k].actual += Number(row.macros_actual?.[k]) || 0;
      macroAvg[k].target += Number(row.macros_target?.[k]) || 0;
    }
  }
  if (daysWithData > 0) {
    for (const k of ['protein', 'carbs', 'fat']) {
      macroAvg[k].actual = Math.round(macroAvg[k].actual / daysWithData);
      macroAvg[k].target = Math.round(macroAvg[k].target / daysWithData);
      macroAvg[k].adherence = macroAvg[k].target > 0
        ? Math.round(Math.min(macroAvg[k].actual / macroAvg[k].target, 1) * 100)
        : 0;
    }
  }

  const startOrgan = enrollment.starting_organ_health || {};
  const organChange = {};
  if (garden) {
    for (const k of ['heart', 'brain', 'gut', 'muscle', 'immune', 'bones']) {
      organChange[k] = {
        start: startOrgan[k] ?? 50,
        current: garden[k] ?? 50,
        change: (garden[k] ?? 50) - (startOrgan[k] ?? 50),
      };
    }
  }

  const bioAgeChange = garden?.biological_age != null && enrollment.starting_bio_age != null
    ? Number(garden.biological_age) - Number(enrollment.starting_bio_age)
    : null;

  const perfectDays = (dailyRows || []).filter((r) => (r.adherence_score || 0) >= 90).length;

  const milestones = [
    { day: 7, title: 'First Week Complete', unlocked: enrollment.current_day >= 7 },
    { day: 14, title: 'Halfway There', unlocked: enrollment.current_day >= 14 },
    { day: 21, title: 'Three Weeks Strong', unlocked: enrollment.current_day >= 21 },
    { day: 30, title: 'Plan Mastered', unlocked: enrollment.completed },
  ];

  return res.status(200).json({
    enrollment,
    plan,
    dailyProgress: dailyRows || [],
    macroAverages: macroAvg,
    organChange,
    bioAgeChange,
    perfectDays,
    milestones,
    badges: badges || [],
  });
}

async function completeMeal(req, res) {
  const supabase = getSupabaseAdmin();
  let userId;
  try { userId = await getAuthedUserId(req); } catch (e) {
    return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
  }
  if (!userId) return jsonError(res, 401, 'Auth required');

  const { meal_id } = req.body || {};
  if (!meal_id) return jsonError(res, 400, 'Missing meal_id');

  const { data: enrollment } = await supabase
    .from('user_plan_enrollments')
    .select('*, nutrition_plans(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!enrollment) return jsonError(res, 404, 'No active plan');
  const plan = enrollment.nutrition_plans;

  const { data: meal } = await supabase
    .from('meals')
    .select('analysis_result')
    .eq('meal_id', meal_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!meal) return jsonError(res, 404, 'Meal not found');

  const ui = meal.analysis_result?.ui || {};
  const nutrition = ui.nutrition || {};
  const mealMacros = {
    protein: Number(nutrition.protein) || 0,
    carbs: Number(nutrition.carbs) || 0,
    fat: Number(nutrition.fat) || 0,
    calories: Number(nutrition.calories) || 0,
  };

  const todayDate = today();
  const macrosTarget = {
    protein: Math.round(((plan.protein_pct / 100) * 2500) / 4),
    carbs: Math.round(((plan.carbs_pct / 100) * 2500) / 4),
    fat: Math.round(((plan.fat_pct / 100) * 2500) / 9),
    calories: 2500,
  };

  const { data: existing } = await supabase
    .from('plan_daily_progress')
    .select('*')
    .eq('enrollment_id', enrollment.enrollment_id)
    .eq('date', todayDate)
    .maybeSingle();

  const prev = existing?.macros_actual || { protein: 0, carbs: 0, fat: 0, calories: 0 };
  const updated = {
    protein: Number(prev.protein) + mealMacros.protein,
    carbs: Number(prev.carbs) + mealMacros.carbs,
    fat: Number(prev.fat) + mealMacros.fat,
    calories: Number(prev.calories) + mealMacros.calories,
  };

  const mealsCompleted = (existing?.meals_completed || 0) + 1;
  const adherence = calcAdherence(updated, macrosTarget);

  const { data: row, error: upsertErr } = await supabase
    .from('plan_daily_progress')
    .upsert({
      enrollment_id: enrollment.enrollment_id,
      date: todayDate,
      meals_completed: mealsCompleted,
      meals_target: plan.meals_per_day,
      macros_actual: updated,
      macros_target: macrosTarget,
      adherence_score: adherence,
    }, { onConflict: 'enrollment_id,date' })
    .select('*')
    .single();

  if (upsertErr) return jsonError(res, 500, 'Progress update failed', { details: upsertErr.message });

  const newBadges = await checkAndUnlockBadges(supabase, userId, enrollment.enrollment_id);

  return res.status(200).json({ progress: row, newBadges });
}

async function suggestMeal(req, res) {
  const supabase = getSupabaseAdmin();
  let userId;
  try { userId = await getAuthedUserId(req); } catch (e) {
    return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
  }
  if (!userId) return jsonError(res, 401, 'Auth required');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonError(res, 500, 'GEMINI_API_KEY missing');

  const mealSlot = req.query?.meal_slot || 'lunch';

  const { data: enrollment } = await supabase
    .from('user_plan_enrollments')
    .select('*, nutrition_plans(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!enrollment) return jsonError(res, 404, 'No active plan');
  const plan = enrollment.nutrition_plans;

  const macrosTarget = {
    protein: Math.round(((plan.protein_pct / 100) * 2500) / 4),
    carbs: Math.round(((plan.carbs_pct / 100) * 2500) / 4),
    fat: Math.round(((plan.fat_pct / 100) * 2500) / 9),
    calories: 2500,
  };

  const { data: todayRow } = await supabase
    .from('plan_daily_progress')
    .select('macros_actual')
    .eq('enrollment_id', enrollment.enrollment_id)
    .eq('date', today())
    .maybeSingle();

  const consumed = todayRow?.macros_actual || { protein: 0, carbs: 0, fat: 0, calories: 0 };
  const remaining = {
    protein: Math.max(0, macrosTarget.protein - Number(consumed.protein)),
    carbs: Math.max(0, macrosTarget.carbs - Number(consumed.carbs)),
    fat: Math.max(0, macrosTarget.fat - Number(consumed.fat)),
    calories: Math.max(0, macrosTarget.calories - Number(consumed.calories)),
  };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('conditions')
    .eq('user_id', userId)
    .maybeSingle();

  try {
    const suggestions = await generatePlanMealSuggestions({
      planName: plan.name,
      planGoal: plan.description,
      keyFoods: plan.key_foods || [],
      avoidFoods: plan.avoid_foods || [],
      mealSlot,
      remaining,
      restrictions: profile?.conditions || 'None',
      apiKey,
    });
    return res.status(200).json({ suggestions, mealSlot, remaining });
  } catch (err) {
    console.error('Meal suggestion error:', err);
    return jsonError(res, 500, err.message || 'Suggestion generation failed');
  }
}

async function getAchievements(req, res) {
  const supabase = getSupabaseAdmin();
  let userId;
  try { userId = await getAuthedUserId(req); } catch (e) {
    return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
  }
  if (!userId) return jsonError(res, 401, 'Auth required');

  const { data: badges } = await supabase
    .from('plan_achievements')
    .select('badge_key, unlocked_at, plan_id')
    .eq('user_id', userId);

  return res.status(200).json({ badges: badges || [] });
}

async function quitPlan(req, res) {
  const supabase = getSupabaseAdmin();
  let userId;
  try { userId = await getAuthedUserId(req); } catch (e) {
    return jsonError(res, e?.status || 401, e?.message || 'Unauthorized');
  }
  if (!userId) return jsonError(res, 401, 'Auth required');

  const { error } = await supabase
    .from('user_plan_enrollments')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) return jsonError(res, 500, 'Failed to quit plan', { details: error.message });
  return res.status(200).json({ ok: true });
}

export async function handlePlans(req, res, tail) {
  const [action, param] = tail || [];

  if (!action && req.method === 'GET') return listPlans(req, res);
  if (action === 'enroll' && req.method === 'POST') return enrollInPlan(req, res);
  if (action === 'active' && req.method === 'GET') return getActivePlan(req, res);
  if (action === 'progress' && req.method === 'GET') return getProgress(req, res);
  if (action === 'complete-meal' && req.method === 'POST') return completeMeal(req, res);
  if (action === 'suggest-meal' && req.method === 'GET') return suggestMeal(req, res);
  if (action === 'achievements' && req.method === 'GET') return getAchievements(req, res);
  if (action === 'quit' && req.method === 'POST') return quitPlan(req, res);

  if (action && !['enroll', 'active', 'progress', 'complete-meal', 'suggest-meal', 'achievements', 'quit'].includes(action) && req.method === 'GET') {
    return getPlanDetail(req, res, action);
  }

  return res.status(404).json({ error: 'Not found' });
}
