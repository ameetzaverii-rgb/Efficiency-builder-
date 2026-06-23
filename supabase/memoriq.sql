-- MEMORIQ: Gamified memorabilia platform schema
-- Run in Supabase SQL editor. Safe to run multiple times.

-- User profiles (extends Supabase auth.users)
create table if not exists memoriq_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text,
  total_xp     integer not null default 0,
  badges       text[]  not null default '{}',
  challenges_completed integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Challenge attempts: one row per user per item
create table if not exists memoriq_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  item_id      text not null,
  score_pct    integer not null,
  xp_earned    integer not null default 0,
  correct      integer not null default 0,
  total        integer not null default 0,
  qualified    boolean not null default false,
  badges       text[]  not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists idx_attempts_user    on memoriq_attempts (user_id);
create index if not exists idx_attempts_item    on memoriq_attempts (item_id);
create index if not exists idx_attempts_item_xp on memoriq_attempts (item_id, xp_earned desc);

-- Leaderboard view: best attempt per user per item
create or replace view memoriq_leaderboard as
select
  a.item_id,
  a.user_id,
  coalesce(p.username, 'Anonymous') as username,
  max(a.xp_earned)   as best_xp,
  max(a.score_pct)   as best_score,
  bool_or(a.qualified) as qualified,
  count(*)::int      as attempts,
  min(a.created_at)  as first_attempt
from memoriq_attempts a
left join memoriq_profiles p on p.id = a.user_id
group by a.item_id, a.user_id, p.username
order by best_xp desc;

-- RLS
alter table memoriq_profiles enable row level security;
alter table memoriq_attempts  enable row level security;

-- Profiles: users read all, write own
create policy if not exists "profiles_select_all"
  on memoriq_profiles for select using (true);

create policy if not exists "profiles_insert_own"
  on memoriq_profiles for insert with check (auth.uid() = id);

create policy if not exists "profiles_update_own"
  on memoriq_profiles for update using (auth.uid() = id);

-- Attempts: users read all, write own
create policy if not exists "attempts_select_all"
  on memoriq_attempts for select using (true);

create policy if not exists "attempts_insert_own"
  on memoriq_attempts for insert with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_memoriq_user()
returns trigger language plpgsql security definer as $$
begin
  insert into memoriq_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created_memoriq
  after insert on auth.users
  for each row execute function handle_new_memoriq_user();
