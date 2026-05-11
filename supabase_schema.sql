-- ════════════════════════════════════════════════════════════════
-- TradeTracker '26 — Supabase Schema v3
-- Safe to re-run. Paste into SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

-- ── ACCOUNTS ────────────────────────────────────────────────────
-- Each user can have multiple accounts (live, prop, demo etc)
create table if not exists public.accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null default 'Main Account',
  starting_balance numeric not null default 100000,
  currency      text not null default 'USD',
  account_type  text default 'Live',   -- Live | Prop | Demo | Paper
  broker        text,
  color         text default '#2563EB',
  is_default    boolean default false,
  created_at    timestamptz default now()
);
create index if not exists accounts_user_id_idx on public.accounts(user_id);
alter table public.accounts enable row level security;
drop policy if exists "Users can view own accounts"   on public.accounts;
drop policy if exists "Users can insert own accounts" on public.accounts;
drop policy if exists "Users can update own accounts" on public.accounts;
drop policy if exists "Users can delete own accounts" on public.accounts;
create policy "Users can view own accounts"   on public.accounts for select using (auth.uid()=user_id);
create policy "Users can insert own accounts" on public.accounts for insert with check (auth.uid()=user_id);
create policy "Users can update own accounts" on public.accounts for update using (auth.uid()=user_id);
create policy "Users can delete own accounts" on public.accounts for delete using (auth.uid()=user_id);

-- ── TRADES ──────────────────────────────────────────────────────
create table if not exists public.trades (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  account_id   uuid references public.accounts(id) on delete cascade,
  date         date not null,
  time         text, symbol text, direction text,
  setup        text, bias text, smt text, session text,
  risk         numeric, outcome text, grade text,
  r_multiple   numeric, pl numeric not null,
  mistake      text, screenshot text, journal text,
  created_at   timestamptz default now()
);
create index if not exists trades_user_id_idx    on public.trades(user_id);
create index if not exists trades_account_id_idx on public.trades(account_id);
create index if not exists trades_user_date_idx  on public.trades(user_id, date);
alter table public.trades enable row level security;
drop policy if exists "Users can view own trades"   on public.trades;
drop policy if exists "Users can insert own trades" on public.trades;
drop policy if exists "Users can update own trades" on public.trades;
drop policy if exists "Users can delete own trades" on public.trades;
create policy "Users can view own trades"   on public.trades for select using (auth.uid()=user_id);
create policy "Users can insert own trades" on public.trades for insert with check (auth.uid()=user_id);
create policy "Users can update own trades" on public.trades for update using (auth.uid()=user_id);
create policy "Users can delete own trades" on public.trades for delete using (auth.uid()=user_id);

-- ── DAILY NOTES ─────────────────────────────────────────────────
create table if not exists public.daily_notes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  account_id        uuid references public.accounts(id) on delete cascade,
  date              date not null,
  note_type         text default 'day',
  note              text,
  mood              text,
  consistency       text,
  market_conditions text,
  htf_bias          text,
  observations      text,
  execution_review  text,
  trading_errors    text,
  improvements      text,
  week_summary      text,
  top_mistake       text,
  what_worked       text,
  next_week_goal    text,
  rule_compliance   text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique(user_id, account_id, date)
);
create index if not exists daily_notes_user_date_idx on public.daily_notes(user_id, date);
alter table public.daily_notes enable row level security;
drop policy if exists "Users can view own notes"   on public.daily_notes;
drop policy if exists "Users can insert own notes" on public.daily_notes;
drop policy if exists "Users can update own notes" on public.daily_notes;
drop policy if exists "Users can delete own notes" on public.daily_notes;
create policy "Users can view own notes"   on public.daily_notes for select using (auth.uid()=user_id);
create policy "Users can insert own notes" on public.daily_notes for insert with check (auth.uid()=user_id);
create policy "Users can update own notes" on public.daily_notes for update using (auth.uid()=user_id);
create policy "Users can delete own notes" on public.daily_notes for delete using (auth.uid()=user_id);
