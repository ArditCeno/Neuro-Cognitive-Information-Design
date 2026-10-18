-- NCID security (pilot mode) — run in Supabase, SQL editor.
--
-- This version matches the current website:
--   * the browser inserts sessions directly with the public (anon) key;
--   * the admin panel reads directly (no login) for the pilot;
--   * the email endpoint is protected by a token (Apps Script).
--
-- Idempotent: safe to run again.

create extension if not exists pgcrypto;

create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  id_anonim  text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_created_at_idx on sessions (created_at desc);
create index if not exists sessions_id_anonim_idx on sessions (id_anonim);

alter table sessions enable row level security;

drop policy if exists "anon insert" on sessions;
drop policy if exists "anon insert token" on sessions;
drop policy if exists "temp read" on sessions;
drop policy if exists "pilot read" on sessions;
drop policy if exists "owner read" on sessions;
drop policy if exists "owner delete" on sessions;

-- pilot: browser can insert (no token column required)
create policy "anon insert" on sessions for insert to anon with check (true);

-- pilot: the admin panel reads without login
create policy "pilot read" on sessions for select to anon using (true);

-- owner account (optional, can stay)
create policy "owner read" on sessions for select to authenticated
  using ((auth.jwt() ->> 'email') = 'arditceno82@gmail.com');

create policy "owner delete" on sessions for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'arditceno82@gmail.com');

-- HARDENING LATER (when you add a backend / Edge Function):
--   * remove "anon insert" and "pilot read";
--   * insert through a server (service role) with rate limiting;
--   * require login for reading.
