-- Push-token storage and global major-release announcements.
-- Run after supabase/schema.sql in the Supabase SQL Editor.

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists push_tokens_user_id_idx on public.push_tokens(user_id);
alter table public.push_tokens enable row level security;

create policy "Users manage their own push tokens"
  on public.push_tokens for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null,
  notes text not null default '',
  download_url text not null,
  is_major boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists app_releases_created_at_idx on public.app_releases(created_at desc);
alter table public.app_releases enable row level security;

create policy "Signed-in users can view major releases"
  on public.app_releases for select to authenticated
  using (is_major);

create policy "Residence managers can publish major releases"
  on public.app_releases for insert to authenticated
  with check (
    is_major
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'manager'
        and p.role_status = 'active'
    )
  );

-- Seed the residences shown in the app. Only Khelafoui is open for the first launch.
insert into public.residences (name, is_open) values
  ('Khelafoui El-Hadj', true),
  ('Abou Ammar Abdel Kafi', false),
  ('Salem Ben Younes', false),
  ('Ben Moussa Mohamed', false),
  ('Lakhdari Mohamed Al Akhdar', false),
  ('Mohamed Tahar El Obeidi', false),
  ('Koraichi Mohamed Ennagi', false),
  ('Ben Malek Mohamed Hassan', false),
  ('Ben Dahman Bachir', false),
  ('Hassani Mohamed Ben Brahim', false),
  ('Ben Chikhe Telli', false)
on conflict (name) do nothing;
update public.residences set is_open = true where name = 'Khelafoui El-Hadj';

-- Users may register as a student or request staff access. Manager privileges
-- must be assigned by an existing manager or the project owner, never by signup.
create or replace function public.register_residence_profile(
  p_full_name text,
  p_residence_name text,
  p_requested_role text default 'student',
  p_service text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  residence_row public.residences%rowtype;
  existing_profile public.profiles%rowtype;
  created_profile public.profiles%rowtype;
  clean_name text := regexp_replace(trim(p_full_name), '\s+', ' ', 'g');
begin
  if current_user_id is null then raise exception 'Sign in is required.'; end if;
  if char_length(clean_name) < 2 or char_length(clean_name) > 60 then raise exception 'Name must contain 2 to 60 characters.'; end if;

  select * into existing_profile from public.profiles where id = current_user_id;
  if found then return existing_profile; end if;

  if p_requested_role not in ('student', 'staff') then
    raise exception 'Manager access must be assigned by the residence manager.';
  end if;
  if p_requested_role = 'staff' and p_service not in ('Restauration', 'Hébergement', 'Maintenance', 'Santé', 'Transport', 'Activités') then
    raise exception 'Choose a valid residence service.';
  end if;
  if p_requested_role = 'student' and p_service is not null then
    raise exception 'Students do not have an assigned service.';
  end if;

  select * into residence_row from public.residences
    where name = p_residence_name and is_open = true;
  if not found then raise exception 'This residence is not open yet.'; end if;

  insert into public.profiles (id, full_name, residence_id, role, service, role_status)
  values (
    current_user_id,
    clean_name,
    residence_row.id,
    p_requested_role,
    case when p_requested_role = 'staff' then p_service else null end,
    case when p_requested_role = 'staff' then 'pending' else 'active' end
  ) returning * into created_profile;
  return created_profile;
end;
$$;

revoke all on function public.register_residence_profile(text, text, text, text) from public;
grant execute on function public.register_residence_profile(text, text, text, text) to authenticated;

create or replace function public.change_my_profile_name(p_full_name text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles%rowtype;
  clean_name text := regexp_replace(trim(p_full_name), '\s+', ' ', 'g');
begin
  if auth.uid() is null then raise exception 'Sign in is required.'; end if;
  if char_length(clean_name) < 2 or char_length(clean_name) > 60 then
    raise exception 'Name must contain 2 to 60 characters.';
  end if;
  select * into current_profile from public.profiles where id = auth.uid();
  if not found then raise exception 'Create your residence profile before changing your name.'; end if;
  if now() < current_profile.name_last_changed_at + interval '14 days' then
    raise exception 'Name changes are available 14 days after the last change.';
  end if;
  update public.profiles set full_name = clean_name, name_last_changed_at = now()
    where id = auth.uid() returning * into current_profile;
  return current_profile;
end;
$$;

revoke all on function public.change_my_profile_name(text) from public;
grant execute on function public.change_my_profile_name(text) to authenticated;

create or replace function public.approve_residence_staff(p_profile_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  manager_profile public.profiles%rowtype;
  approved_profile public.profiles%rowtype;
begin
  select * into manager_profile from public.profiles
    where id = auth.uid() and role = 'manager' and role_status = 'active';
  if not found then raise exception 'Only an active residence manager can approve staff.'; end if;

  update public.profiles set role_status = 'active'
    where id = p_profile_id
      and residence_id = manager_profile.residence_id
      and role = 'staff'
      and role_status = 'pending'
    returning * into approved_profile;
  if not found then raise exception 'No pending staff request was found in your residence.'; end if;
  return approved_profile;
end;
$$;

revoke all on function public.approve_residence_staff(uuid) from public;
grant execute on function public.approve_residence_staff(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports'
    ) then
      execute 'alter publication supabase_realtime add table public.reports';
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'report_messages'
    ) then
      execute 'alter publication supabase_realtime add table public.report_messages';
    end if;
  end if;
end;
$$;
