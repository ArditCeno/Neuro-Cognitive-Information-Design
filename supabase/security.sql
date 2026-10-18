-- NCID security - production model (Edge Function writes, owner reads).
-- Run in the Supabase SQL editor. Idempotent: safe to run again.
--
-- Model:
--   * the browser never writes to Supabase directly (no anon insert policy);
--   * the `submit` Edge Function inserts with the service role (bypasses RLS),
--     after a per-IP rate-limit check;
--   * only the owner account (arditceno82@gmail.com) can read/delete;
--   * the optional participant name lives in a separate owner-only table.
--
-- After running this, deploy the function (see README) and set the secrets:
--   supabase secrets set APPS_SCRIPT_URL="..." APPS_SCRIPT_TOKEN="..."

create extension if not exists pgcrypto;

-- ------------------------------- sessions -------------------------------
create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  id_anonim     text not null,
  payload       jsonb not null,
  submission_id text,
  created_at    timestamptz not null default now()
);

-- idempotent retries: one row per submission_id
create unique index if not exists sessions_submission_id_key
  on sessions (submission_id) where submission_id is not null;
create index if not exists sessions_created_at_idx on sessions (created_at desc);
create index if not exists sessions_id_anonim_idx on sessions (id_anonim);

alter table sessions enable row level security;

-- remove every previous/legacy policy (including the pilot ones)
drop policy if exists "anon insert"       on sessions;
drop policy if exists "anon insert token" on sessions;
drop policy if exists "temp read"         on sessions;
drop policy if exists "pilot read"        on sessions;
drop policy if exists "owner read"        on sessions;
drop policy if exists "owner delete"      on sessions;

-- owner-only read/delete (RLS applies to anon/authenticated; the service role bypasses it)
create policy "owner read" on sessions for select to authenticated
  using ((auth.jwt() ->> 'email') = 'arditceno82@gmail.com');

create policy "owner delete" on sessions for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'arditceno82@gmail.com');

-- no insert policy for anon/authenticated on purpose: writes go through the
-- Edge Function (service role) only.

-- -------------------------- participant identity ------------------------
create table if not exists participant_identity (
  id_anonim    text primary key,
  emri_mbiemer text,
  updated_at   timestamptz not null default now()
);

alter table participant_identity enable row level security;

drop policy if exists "owner read identity"   on participant_identity;
drop policy if exists "owner write identity"  on participant_identity;
drop policy if exists "identity owner read"   on participant_identity;

create policy "owner read identity" on participant_identity for select to authenticated
  using ((auth.jwt() ->> 'email') = 'arditceno82@gmail.com');

-- ----------------------------- rate limiting ----------------------------
create table if not exists rate_limit (
  id  bigserial primary key,
  ip  text not null,
  ts  timestamptz not null default now()
);
create index if not exists rate_limit_ip_ts_idx on rate_limit (ip, ts desc);

-- returns true when the call is allowed (and records it), false when over limit
create or replace function check_rate_limit(
  p_ip text,
  p_limit int default 20,
  p_window_seconds int default 3600
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from rate_limit where ts < now() - make_interval(secs => p_window_seconds);
  select count(*) into v_count from rate_limit
    where ip = p_ip and ts >= now() - make_interval(secs => p_window_seconds);
  if v_count >= p_limit then
    return false;
  end if;
  insert into rate_limit (ip) values (p_ip);
  return true;
end;
$$;

-- only the service role (Edge Function) may call it
revoke all on function check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function check_rate_limit(text, int, int) to service_role;

alter table rate_limit enable row level security;
-- no policies: unreachable from anon/authenticated; the function is security definer.
