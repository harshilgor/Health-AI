-- Gamified health garden: organ scores, biological age, streaks, bone unlock

create table if not exists public.user_garden (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chronological_age int not null default 30,
  biological_age numeric(8, 3),
  heart int not null default 50,
  brain int not null default 50,
  gut int not null default 50,
  muscle int not null default 50,
  immune int not null default 50,
  bones int not null default 40,
  bones_unlocked boolean not null default false,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_meal_date date,
  distinct_meal_days int not null default 0,
  updated_at timestamptz not null default now(),
  constraint user_garden_heart check (heart >= 0 and heart <= 100),
  constraint user_garden_brain check (brain >= 0 and brain <= 100),
  constraint user_garden_gut check (gut >= 0 and gut <= 100),
  constraint user_garden_muscle check (muscle >= 0 and muscle <= 100),
  constraint user_garden_immune check (immune >= 0 and immune <= 100),
  constraint user_garden_bones check (bones >= 0 and bones <= 100)
);

create index if not exists user_garden_updated_idx on public.user_garden (updated_at desc);
