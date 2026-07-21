-- Add body metrics used for calorie target calculations
alter table public.user_profiles
  add column if not exists height_cm numeric,
  add column if not exists weight_kg numeric;

comment on column public.user_profiles.height_cm is 'User height in centimeters for BMR/TDEE calculations';
comment on column public.user_profiles.weight_kg is 'User weight in kilograms for BMR/TDEE calculations';
