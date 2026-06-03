-- GSL Command Center — initial schema
-- Run this in the Supabase SQL editor (or via supabase db push).

create table if not exists tasks (
  id           text primary key,
  title        text not null,
  project      text not null default 'GSL Innovation',
  priority     text not null default 'high',   -- urgent|high|medium|low
  status       text not null default 'active', -- active|done
  note         text,
  actions      jsonb default '[]',
  added_date   date not null default current_date,
  done_date    date,
  created_at   timestamptz not null default now()
);

create table if not exists emails (
  id               text primary key,
  subject          text not null,
  from_name        text not null,
  from_email       text,
  received_date    date not null,
  tag              text not null default 'action',
  summary          text,
  draft            text,
  actions          jsonb default '[]',
  status           text not null default 'pending', -- pending|replied|dismissed
  resolved_date    date,
  m365_message_id  text unique,
  created_at       timestamptz not null default now()
);

create table if not exists history (
  id            bigserial primary key,
  event_type    text not null,
  entity_id     text,
  entity_title  text,
  event_date    date not null default current_date,
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now()
);

-- Helpful indexes for the dashboard queries.
create index if not exists idx_tasks_status on tasks (status);
create index if not exists idx_emails_status on emails (status);
create index if not exists idx_history_created_at on history (created_at desc);
