-- Run once in the Supabase SQL editor. Supabase Auth already owns auth.users/sessions.
-- This file creates application profiles and private API throttling only.
begin;
create schema if not exists manga_private;
revoke all on schema manga_private from public, anon, authenticated;

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username varchar(24) not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
    display_name varchar(80) not null check (length(trim(display_name)) > 0),
    created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select (id, username, display_name, created_at) on public.profiles to anon, authenticated;
create policy "Reader profiles are public" on public.profiles
    for select to anon, authenticated using (true);
-- No browser INSERT/UPDATE/DELETE policies yet; profile editing is out of scope.

create or replace function public.create_reader_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, username, display_name, created_at)
    values (
        new.id,
        lower(coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
                       'reader_' || substr(replace(new.id::text, '-', ''), 1, 16))),
        coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Reader'),
        new.created_at
    );
    return new;
end;
$$;
revoke all on function public.create_reader_profile() from public, anon, authenticated;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.create_reader_profile();

-- Backfill existing Supabase users without copying emails/passwords into public profiles.
insert into public.profiles (id, username, display_name, created_at)
select id, 'reader_' || substr(replace(id::text, '-', ''), 1, 16),
       coalesce(nullif(left(trim(raw_user_meta_data ->> 'display_name'), 80), ''), 'Reader'), created_at
from auth.users
on conflict (id) do nothing;

create table manga_private.rate_limits (
    key varchar(64) not null,
    bucket bigint not null,
    hits integer not null check (hits > 0),
    created_at timestamptz not null default now(),
    primary key (key, bucket)
);
create index ix_rate_limits_created_at on manga_private.rate_limits(created_at);
revoke all on all tables in schema manga_private from public, anon, authenticated;
alter default privileges in schema manga_private revoke all on tables from public, anon, authenticated;
alter table manga_private.rate_limits enable row level security;
commit;

-- Backend-only DATABASE_URL uses a trusted server role (e.g. Supabase postgres).
-- Username login reads profiles joined to auth.users.email server-side; no emails are exposed.
-- Keep manga_private OUT of the Data API's exposed schemas. Never expose database credentials.
-- Maintenance: delete from manga_private.rate_limits where created_at < now() - interval '2 days';
