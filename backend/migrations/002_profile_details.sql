-- Run after 001_auth.sql in the Supabase SQL Editor.
begin;
alter table public.profiles
    add column country_code varchar(2) check (country_code ~ '^[A-Z]{2}$'),
    add column city varchar(100),
    add column avatar_path varchar(300);
-- Location stays backend-only. Only the avatar path is added to public profile reads.
grant select (avatar_path) on public.profiles to anon, authenticated;

create or replace function public.create_reader_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    insert into public.profiles (id, username, display_name, created_at, country_code, city)
    values (
        new.id,
        lower(coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
                       'reader_' || substr(replace(new.id::text, '-', ''), 1, 16))),
        coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 80), ''), 'Reader'),
        new.created_at,
        case when new.raw_user_meta_data ->> 'country_code' ~ '^[A-Z]{2}$'
             then new.raw_user_meta_data ->> 'country_code' else null end,
        nullif(left(trim(new.raw_user_meta_data ->> 'city'), 100), '')
    );
    return new;
end;
$$;
revoke all on function public.create_reader_profile() from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/webp'])
on conflict (id) do nothing;
create policy "Readers upload own avatars" on storage.objects
for insert to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "Readers select own avatars" on storage.objects
for select to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "Readers delete own avatars" on storage.objects
for delete to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text)
);
commit;
