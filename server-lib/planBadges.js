export const BADGE_CATALOG = [
  { key: 'first_week', name: 'First Week Down', icon: '🏅', description: '7 consecutive days on a plan' },
  { key: 'halfway', name: 'Halfway There', icon: '⏳', description: 'Reached day 15 of a 30-day plan' },
  { key: 'plan_complete', name: 'Plan Mastered', icon: '🏆', description: 'Completed a full nutrition plan' },
  { key: 'macro_perfect_7', name: 'Macro Perfectionist', icon: '🎯', description: '7 days hitting all macros within 10%' },
  { key: 'muscle_90', name: 'Muscle Master', icon: '💪', description: 'Muscle system reached 90% during a plan' },
  { key: 'three_plans', name: 'Plan Explorer', icon: '🗺️', description: 'Enrolled in 3 different plans' },
  { key: 'streak_30', name: 'Living Legend', icon: '👑', description: '30 days on any single plan' },
  { key: 'bio_age_reverse', name: 'Age Defier', icon: '🧬', description: 'Bio age decreased by 1+ year during a plan' },
];

async function tryUnlock(supabase, userId, badgeKey, planId) {
  const { data } = await supabase
    .from('plan_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_key', badgeKey)
    .maybeSingle();

  if (data) return null;

  const { data: inserted, error } = await supabase
    .from('plan_achievements')
    .insert({ user_id: userId, badge_key: badgeKey, plan_id: planId })
    .select('badge_key, unlocked_at')
    .single();

  if (error) return null;
  return inserted;
}

export async function checkAndUnlockBadges(supabase, userId, enrollmentId) {
  const { data: enrollment } = await supabase
    .from('user_plan_enrollments')
    .select('*, nutrition_plans(plan_id, duration_days)')
    .eq('enrollment_id', enrollmentId)
    .single();

  if (!enrollment) return [];

  const planId = enrollment.plan_id;
  const unlocked = [];

  if (enrollment.current_day >= 7) {
    const b = await tryUnlock(supabase, userId, 'first_week', planId);
    if (b) unlocked.push(b);
  }

  if (enrollment.current_day >= 15) {
    const b = await tryUnlock(supabase, userId, 'halfway', planId);
    if (b) unlocked.push(b);
  }

  if (enrollment.completed) {
    const b = await tryUnlock(supabase, userId, 'plan_complete', planId);
    if (b) unlocked.push(b);
  }

  if (enrollment.current_day >= 30) {
    const b = await tryUnlock(supabase, userId, 'streak_30', planId);
    if (b) unlocked.push(b);
  }

  const { data: progress } = await supabase
    .from('plan_daily_progress')
    .select('adherence_score')
    .eq('enrollment_id', enrollmentId)
    .gte('adherence_score', 90)
    .order('date', { ascending: false })
    .limit(7);

  if (progress && progress.length >= 7) {
    const b = await tryUnlock(supabase, userId, 'macro_perfect_7', planId);
    if (b) unlocked.push(b);
  }

  const { data: garden } = await supabase
    .from('user_garden')
    .select('muscle, biological_age')
    .eq('user_id', userId)
    .maybeSingle();

  if (garden?.muscle >= 90) {
    const b = await tryUnlock(supabase, userId, 'muscle_90', planId);
    if (b) unlocked.push(b);
  }

  if (enrollment.starting_bio_age != null && garden?.biological_age != null) {
    if (Number(enrollment.starting_bio_age) - Number(garden.biological_age) >= 1) {
      const b = await tryUnlock(supabase, userId, 'bio_age_reverse', planId);
      if (b) unlocked.push(b);
    }
  }

  const { data: allEnrollments } = await supabase
    .from('user_plan_enrollments')
    .select('plan_id')
    .eq('user_id', userId);

  const uniquePlans = new Set((allEnrollments || []).map((e) => e.plan_id));
  if (uniquePlans.size >= 3) {
    const b = await tryUnlock(supabase, userId, 'three_plans', null);
    if (b) unlocked.push(b);
  }

  return unlocked;
}
