-- NCID security policies (run in Supabase, SQL editor).
--
-- After this:
--   * anonymous clients can only INSERT, and only with the correct token
--   * only the owner account can READ / DELETE
--   * nobody can read the data with the public key
--
-- Replace the token below if you change CONFIG.storage.token in js/config.js.

-- 1) table + column for the client token
create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  id_anonim  text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);
alter table sessions add column if not exists client_token text;

-- 2) row level security on
alter table sessions enable row level security;

-- 3) remove any old/open policies
drop policy if exists "anon insert" on sessions;
drop policy if exists "temp read" on sessions;
drop policy if exists "owner read" on sessions;
drop policy if exists "owner delete" on sessions;

-- 4) anonymous clients may only INSERT, and only with the shared token
create policy "anon insert token" on sessions
  for insert to anon
  with check (client_token = 'ncid_k9f3Xq2Lm7Pz');

-- 5) only the owner account can read / delete
create policy "owner read" on sessions
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'arditceno82@gmail.com');

create policy "owner delete" on sessions
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'arditceno82@gmail.com');
