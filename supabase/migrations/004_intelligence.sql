-- GSL Command Center — decision intelligence: viewpoints + AI insights.
-- Run once in the Supabase SQL editor.

create table if not exists viewpoints (
  id           text primary key,
  entity_id    text not null,
  entity_type  text not null default 'email',
  author       text,
  content      text not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_viewpoints_entity on viewpoints (entity_id);

create table if not exists insights (
  entity_id    text primary key,
  entity_type  text not null default 'email',
  data         jsonb not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table viewpoints enable row level security;
alter table insights   enable row level security;
