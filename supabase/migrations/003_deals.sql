-- GSL Command Center — partnership / deal pipeline.
-- Run once in the Supabase SQL editor (same as the earlier migrations).

create table if not exists deals (
  id          text primary key,
  name        text not null,
  partner     text,
  stage       text not null default 'exploring', -- exploring | negotiating | live | paused
  value       text,
  note        text,
  next_step   text,
  last_touch  date,
  created_at  timestamptz not null default now()
);

create index if not exists idx_deals_stage on deals (stage);

-- Privacy: server-side service role only.
alter table deals enable row level security;
