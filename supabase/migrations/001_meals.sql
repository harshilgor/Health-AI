-- Meals journal: image URL + Gemini analysis JSON per user
-- Run in Supabase SQL Editor or via supabase db push

create extension if not exists "uuid-ossp";

create table if not exists public.meals (
  meal_id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  image_url text not null,
  image_path text not null,
  meal_type text not null default 'lunch'
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  location text default '',
  recorded_at timestamptz not null default now(),
  analysis_result jsonb not null default '{}'::jsonb
);

create index if not exists meals_user_recorded_idx
  on public.meals (user_id, recorded_at desc);

comment on table public.meals is 'Food photos + Gemini analysis; user_id is app client id until real auth.';

-- Optional RLS (service role bypasses). Enable if you add anon key from client:
-- alter table public.meals enable row level security;
