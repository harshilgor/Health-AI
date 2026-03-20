function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayUTC() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Count distinct calendar days (UTC) user has meals.
 */
export async function countDistinctMealDays(supabase, userId) {
  const { data, error } = await supabase
    .from('meals')
    .select('recorded_at')
    .eq('user_id', userId)
    .limit(500);
  if (error || !data?.length) return 0;
  const set = new Set(data.map((r) => String(r.recorded_at).slice(0, 10)));
  return set.size;
}

/** Apply precomputed meal scoring to user_garden (call after meal row is inserted). */
export async function applyScoringToGarden(supabase, userId, scoring) {
  const today = todayUTC();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('age')
    .eq('user_id', userId)
    .maybeSingle();
  const chronologicalAge = clampInt(Number(profile?.age ?? 30), 10, 120);

  const { data: existing, error: fetchErr } = await supabase
    .from('user_garden')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) {
    console.error('user_garden fetch:', fetchErr);
    return null;
  }

  const distinctDays = await countDistinctMealDays(supabase, userId);
  const bonesUnlocked = distinctDays >= 30;

  let row = existing || {
    user_id: userId,
    chronological_age: chronologicalAge,
    biological_age: null,
    heart: 50,
    brain: 50,
    gut: 50,
    muscle: 50,
    immune: 50,
    bones: 40,
    bones_unlocked: false,
    current_streak: 0,
    longest_streak: 0,
    last_meal_date: null,
    distinct_meal_days: 0,
  };

  row.chronological_age = chronologicalAge;
  if (row.biological_age == null) {
    row.biological_age = chronologicalAge;
  }

  let streak = row.current_streak || 0;
  const last = row.last_meal_date;
  if (!last) {
    streak = 1;
  } else if (last === today) {
    // same day: keep streak
  } else if (last === yesterdayUTC()) {
    streak += 1;
  } else {
    streak = 1;
  }
  const longest = Math.max(row.longest_streak || 0, streak);

  const applyDelta = (current, delta) =>
    Math.max(0, Math.min(100, Number(current || 0) + delta));

  const imp = scoring.organImpacts;
  const newHeart = applyDelta(row.heart, imp.heart);
  const newBrain = applyDelta(row.brain, imp.brain);
  const newGut = applyDelta(row.gut, imp.gut);
  const newMuscle = applyDelta(row.muscle, imp.muscle);
  const newImmune = applyDelta(row.immune, imp.immune);
  let newBones = Number(row.bones || 40);
  if (bonesUnlocked) {
    newBones = applyDelta(row.bones, imp.bones);
  }

  let bio = Number(row.biological_age) + scoring.bioAgeDelta;
  const minBio = chronologicalAge * 0.75;
  const maxBio = chronologicalAge * 1.35;
  bio = Math.max(minBio, Math.min(maxBio, bio));

  const payload = {
    user_id: userId,
    chronological_age: chronologicalAge,
    biological_age: Number(bio.toFixed(3)),
    heart: newHeart,
    brain: newBrain,
    gut: newGut,
    muscle: newMuscle,
    immune: newImmune,
    bones: newBones,
    bones_unlocked: bonesUnlocked,
    current_streak: streak,
    longest_streak: longest,
    last_meal_date: today,
    distinct_meal_days: distinctDays,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await supabase.from('user_garden').upsert(payload, { onConflict: 'user_id' });
  if (upsertErr) {
    console.error('user_garden upsert:', upsertErr);
    return null;
  }

  return {
    garden: payload,
    update: {
      organImpacts: imp,
      bioAgeDelta: scoring.bioAgeDelta,
      mealQuality: scoring.mealQuality,
      environment: scoring.environment,
      scores: {
        heart: newHeart,
        brain: newBrain,
        gut: newGut,
        muscle: newMuscle,
        immune: newImmune,
        bones: newBones,
      },
    },
  };
}

function clampInt(n, lo, hi) {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
