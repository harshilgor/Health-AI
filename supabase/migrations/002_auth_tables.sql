-- Google Auth persistence:
-- - Make meals.user_id a UUID FK to auth.users
-- - Add user_profiles table for goal/targets
-- - Add symptoms table for vitality logs

create extension if not exists "uuid-ossp";

-- Convert user_id to uuid (we store auth.users.id in meals)
alter table public.meals
  alter column user_id type uuid
  using (user_id::uuid);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'meals_user_id_fkey'
  ) THEN
    ALTER TABLE public.meals
      ADD CONSTRAINT meals_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal text default 'Eat healthier generally',
  conditions text default 'None',
  age int default 30,
  sex text default 'male',
  activity text default 'Lightly active',
  daily_calories int default 2000,
  protein_target int default 125,
  fat_target int default 67,
  carb_target int default 225,
  fiber_target int default 30,
  joined timestamptz not null default now()
);

create table if not exists public.symptoms (
  symptom_id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  energy int not null,
  mood int not null,
  digestion text not null,
  notes text default '',
  recorded_at timestamptz not null default now()
);

create index if not exists symptoms_user_recorded_idx
  on public.symptoms (user_id, recorded_at desc);

