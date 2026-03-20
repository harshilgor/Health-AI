-- Nutrition Plans: plan library, enrollment, daily progress, achievements

CREATE TABLE IF NOT EXISTS public.nutrition_plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('physique','longevity','cognitive','recovery')),
  tagline VARCHAR(200),
  description TEXT,
  inspired_by VARCHAR(200),

  protein_pct INT NOT NULL,
  carbs_pct INT NOT NULL,
  fat_pct INT NOT NULL,

  meals_per_day INT NOT NULL DEFAULT 3,
  meal_timing JSONB,
  key_foods TEXT[],
  avoid_foods TEXT[],

  duration_days INT NOT NULL DEFAULT 30,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'intermediate',
  strictness INT NOT NULL DEFAULT 3 CHECK (strictness BETWEEN 1 AND 5),

  primary_organ VARCHAR(20),
  secondary_organ VARCHAR(20),
  expected_results JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_plan_enrollments (
  enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.nutrition_plans(plan_id) ON DELETE CASCADE,

  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE NOT NULL,
  current_day INT NOT NULL DEFAULT 1,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,

  starting_bio_age NUMERIC(8,3),
  starting_organ_health JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_active ON public.user_plan_enrollments (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_plan ON public.user_plan_enrollments (plan_id);

CREATE TABLE IF NOT EXISTS public.plan_daily_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.user_plan_enrollments(enrollment_id) ON DELETE CASCADE,
  date DATE NOT NULL,

  meals_completed INT NOT NULL DEFAULT 0,
  meals_target INT NOT NULL DEFAULT 3,

  macros_actual JSONB DEFAULT '{"protein":0,"carbs":0,"fat":0,"calories":0}',
  macros_target JSONB,

  adherence_score INT DEFAULT 0 CHECK (adherence_score BETWEEN 0 AND 100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, date)
);
CREATE INDEX IF NOT EXISTS idx_progress_enrollment ON public.plan_daily_progress (enrollment_id, date DESC);

CREATE TABLE IF NOT EXISTS public.plan_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key VARCHAR(60) NOT NULL,
  plan_id UUID REFERENCES public.nutrition_plans(plan_id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.plan_achievements (user_id);
