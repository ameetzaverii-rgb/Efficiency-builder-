-- GSL Command Center — full setup for the intelligence features.
-- Safe to run more than once (idempotent). Paste into the Supabase SQL editor.
-- This covers everything beyond 001_init.sql: knowledge, deals, viewpoints, insights.

-- Knowledge base ("clone database")
create table if not exists knowledge (
  id          text primary key,
  kind        text not null default 'fact',
  title       text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_knowledge_kind on knowledge (kind);

-- Partnership / deal pipeline
create table if not exists deals (
  id          text primary key,
  name        text not null,
  partner     text,
  stage       text not null default 'exploring',
  value       text,
  note        text,
  next_step   text,
  last_touch  date,
  created_at  timestamptz not null default now()
);
create index if not exists idx_deals_stage on deals (stage);

-- Viewpoints: perspectives accumulated on a decision over time
create table if not exists viewpoints (
  id           text primary key,
  entity_id    text not null,
  entity_type  text not null default 'email',
  author       text,
  content      text not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_viewpoints_entity on viewpoints (entity_id);

-- Insights: the latest AI decision analysis per item
create table if not exists insights (
  entity_id    text primary key,
  entity_type  text not null default 'email',
  data         jsonb not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Privacy: server-side service role only.
alter table knowledge  enable row level security;
alter table deals      enable row level security;
alter table viewpoints enable row level security;
alter table insights   enable row level security;

-- Client / data trackers (external links surfaced in the command center)
create table if not exists trackers (
  id          text primary key,
  title       text not null,
  url         text not null,
  type        text not null default 'link',  -- sharepoint | appsscript | sheet | link
  note        text,
  created_at  timestamptz not null default now()
);
alter table trackers enable row level security;
