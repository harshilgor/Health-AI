-- Dietary preference for AI meal recommendations
alter table public.user_profiles
  add column if not exists diet_preference text default 'non_vegetarian';

comment on column public.user_profiles.diet_preference is 'vegetarian | non_vegetarian — used for AI meal recommendations';
