-- ============================================================
-- CryptoEdge — שלב 1: שכבת אחסון קבוע
-- הדבק הכל ב-Supabase → SQL Editor → Run
-- ============================================================

-- טבלת תצפיות גולמיות: append-only, לעולם לא מוחקים
create table if not exists market_snapshots (
  id               bigint generated always as identity primary key,
  symbol           text not null,
  ts               timestamptz not null default now(),
  open             numeric,
  high             numeric,
  low              numeric,
  close            numeric,
  volume           numeric,
  funding          numeric,
  open_interest    numeric,
  long_short_ratio numeric,
  fear_greed       int,
  interval         text default '5m',
  unique (symbol, ts, interval)
);
create index if not exists idx_snap_sym_ts on market_snapshots (symbol, ts);

-- טבלת מסקנות מתגלגלות: נכתבת מחדש ע"י מנוע המחקר
create table if not exists research_insights (
  id          bigint generated always as identity primary key,
  symbol      text,
  engine      text,
  metric      text,
  value       numeric,
  ci_low      numeric,
  ci_high     numeric,
  n_samples   int,
  detail      jsonb,
  updated_at  timestamptz default now()
);
create index if not exists idx_insight_sym_engine on research_insights (symbol, engine);

-- טבלת מפתח-ערך לסנכרון כללי של האפליקציה (יומן, תובנות, הגדרות)
create table if not exists app_kv (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz default now()
);

-- RLS: מאפשר לאפליקציה (anon/publishable key) לכתוב ולקרוא
alter table market_snapshots  enable row level security;
alter table research_insights enable row level security;
alter table app_kv            enable row level security;

create policy "ce insert snapshots" on market_snapshots for insert with check (true);
create policy "ce update snapshots" on market_snapshots for update using (true) with check (true);
create policy "ce read snapshots"   on market_snapshots for select using (true);

create policy "ce rw insights"      on research_insights for all using (true) with check (true);
create policy "ce rw kv"            on app_kv            for all using (true) with check (true);
