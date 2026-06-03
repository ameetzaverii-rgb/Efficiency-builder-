-- GSL Command Center — knowledge base ("clone database") for AI-drafted replies.
-- Run this once in the Supabase SQL editor (same as 001_init.sql).

create table if not exists knowledge (
  id          text primary key,
  kind        text not null default 'fact',   -- fact | style | faq | person | policy
  title       text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_knowledge_kind on knowledge (kind);

-- Privacy: same lockdown as the other tables — server-side service role only.
alter table knowledge enable row level security;
