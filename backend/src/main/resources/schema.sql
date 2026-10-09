-- NCID Backend - Copyright (c) 2026 Ardit Ceno. All rights reserved.
create extension if not exists pgcrypto;

create table if not exists sessions (
    id         uuid primary key default gen_random_uuid(),
    id_anonim  text not null,
    payload    jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_sessions_created_at on sessions (created_at desc);
create index if not exists idx_sessions_anon on sessions (id_anonim);
