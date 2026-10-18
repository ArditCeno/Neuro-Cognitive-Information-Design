-- NCID security policies (run in Supabase SQL editor).
--
-- Current mode (pilot): anonymous clients may INSERT; only the owner can READ.
-- For a stricter insert (token), see the comment at the end.
--
-- Replace the email if needed.

create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  id_anonim  text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

alter table sessions enable row level security;

drop policy if exists "anon insert" on sessions;
drop policy if exists "anon insert token" on sessions;
drop policy if exists "temp read" on sessions;
drop policy if exists "owner read" on sessions;
drop policy if exists "owner delete" on sessions;

-- pilot: anonymous clients can insert (no token column needed)
create policy "anon insert" on sessions for insert to anon with check (true);

-- only the owner account can read / delete
create policy "owner read" on sessions for select to authenticated
  using ((auth.jwt() ->> 'email') = 'arditceno82@gmail.com');

create policy "owner delete" on sessions for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'arditceno82@gmail.com');

-- HARDENING (optional, later):
--   alter table sessions add column if not exists client_token text;
--   drop policy "anon insert" on sessions;
--   create policy "anon insert token" on sessions for insert to anon
--     with check (client_token = 'ncid_k9f3Xq2Lm7Pz');
--   then re-add `client_token: K.token` to the Supabase insert body in js/storage.js.
