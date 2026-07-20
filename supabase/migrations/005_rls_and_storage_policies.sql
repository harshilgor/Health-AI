-- Enable RLS with owner-scoped policies (service role still bypasses for API).

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_garden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plan_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_achievements ENABLE ROW LEVEL SECURITY;

-- meals
DROP POLICY IF EXISTS meals_select_own ON public.meals;
CREATE POLICY meals_select_own ON public.meals FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS meals_insert_own ON public.meals;
CREATE POLICY meals_insert_own ON public.meals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS meals_update_own ON public.meals;
CREATE POLICY meals_update_own ON public.meals FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS meals_delete_own ON public.meals;
CREATE POLICY meals_delete_own ON public.meals FOR DELETE TO authenticated USING (user_id = auth.uid());

-- user_profiles
DROP POLICY IF EXISTS profiles_select_own ON public.user_profiles;
CREATE POLICY profiles_select_own ON public.user_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS profiles_insert_own ON public.user_profiles;
CREATE POLICY profiles_insert_own ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS profiles_update_own ON public.user_profiles;
CREATE POLICY profiles_update_own ON public.user_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- symptoms
DROP POLICY IF EXISTS symptoms_select_own ON public.symptoms;
CREATE POLICY symptoms_select_own ON public.symptoms FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS symptoms_insert_own ON public.symptoms;
CREATE POLICY symptoms_insert_own ON public.symptoms FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS symptoms_update_own ON public.symptoms;
CREATE POLICY symptoms_update_own ON public.symptoms FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS symptoms_delete_own ON public.symptoms;
CREATE POLICY symptoms_delete_own ON public.symptoms FOR DELETE TO authenticated USING (user_id = auth.uid());

-- user_garden
DROP POLICY IF EXISTS garden_select_own ON public.user_garden;
CREATE POLICY garden_select_own ON public.user_garden FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS garden_insert_own ON public.user_garden;
CREATE POLICY garden_insert_own ON public.user_garden FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS garden_update_own ON public.user_garden;
CREATE POLICY garden_update_own ON public.user_garden FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- nutrition_plans (library readable by signed-in users)
DROP POLICY IF EXISTS plans_select_authenticated ON public.nutrition_plans;
CREATE POLICY plans_select_authenticated ON public.nutrition_plans FOR SELECT TO authenticated USING (true);

-- enrollments
DROP POLICY IF EXISTS enrollments_select_own ON public.user_plan_enrollments;
CREATE POLICY enrollments_select_own ON public.user_plan_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS enrollments_insert_own ON public.user_plan_enrollments;
CREATE POLICY enrollments_insert_own ON public.user_plan_enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS enrollments_update_own ON public.user_plan_enrollments;
CREATE POLICY enrollments_update_own ON public.user_plan_enrollments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS enrollments_delete_own ON public.user_plan_enrollments;
CREATE POLICY enrollments_delete_own ON public.user_plan_enrollments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- plan_daily_progress (via enrollment ownership)
DROP POLICY IF EXISTS progress_select_own ON public.plan_daily_progress;
CREATE POLICY progress_select_own ON public.plan_daily_progress FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_plan_enrollments e WHERE e.enrollment_id = plan_daily_progress.enrollment_id AND e.user_id = auth.uid()));
DROP POLICY IF EXISTS progress_insert_own ON public.plan_daily_progress;
CREATE POLICY progress_insert_own ON public.plan_daily_progress FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_plan_enrollments e WHERE e.enrollment_id = plan_daily_progress.enrollment_id AND e.user_id = auth.uid()));
DROP POLICY IF EXISTS progress_update_own ON public.plan_daily_progress;
CREATE POLICY progress_update_own ON public.plan_daily_progress FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_plan_enrollments e WHERE e.enrollment_id = plan_daily_progress.enrollment_id AND e.user_id = auth.uid()));

-- achievements
DROP POLICY IF EXISTS achievements_select_own ON public.plan_achievements;
CREATE POLICY achievements_select_own ON public.plan_achievements FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS achievements_insert_own ON public.plan_achievements;
CREATE POLICY achievements_insert_own ON public.plan_achievements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Storage policies for meal-images
-- Public buckets serve objects by direct URL; avoid a broad SELECT that lists all files.
DROP POLICY IF EXISTS "Public read meal images" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated upload meal images" ON storage.objects;
CREATE POLICY "Authenticated upload meal images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'meal-images');

DROP POLICY IF EXISTS "Authenticated update meal images" ON storage.objects;
CREATE POLICY "Authenticated update meal images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'meal-images');

DROP POLICY IF EXISTS "Authenticated delete meal images" ON storage.objects;
CREATE POLICY "Authenticated delete meal images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'meal-images');
