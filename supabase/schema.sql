-- Run this in Supabase SQL Editor. Authorization is derived from the account profile,
-- never from client-supplied role fields.
create extension if not exists pgcrypto;

create table if not exists public.residences (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_open boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 60),
  residence_id uuid references public.residences(id),
  role text not null default 'student' check (role in ('student', 'staff', 'manager')),
  service text,
  role_status text not null default 'active' check (role_status in ('active', 'pending', 'rejected')),
  name_last_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint profile_service_role check ((role = 'staff' and service is not null) or (role <> 'staff' and service is null))
);

create unique index if not exists one_manager_per_residence
  on public.profiles (residence_id) where role = 'manager' and role_status = 'active';
create unique index if not exists one_active_admin_per_service
  on public.profiles (residence_id, service) where role = 'staff' and role_status = 'active';

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  residence_id uuid not null references public.residences(id),
  service text not null,
  subject text not null,
  details text not null check (char_length(details) between 2 and 5000),
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reports_residence_service_created on public.reports (residence_id, service, created_at desc);

create table if not exists public.report_messages (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.residences enable row level security;
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_messages enable row level security;

create policy "Authenticated users can view open residences and their own residence"
  on public.residences for select to authenticated
  using (is_open or id = (select p.residence_id from public.profiles p where p.id = (select auth.uid())));

create policy "Users can view profiles in their residence"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or residence_id = (select p.residence_id from public.profiles p where p.id = (select auth.uid())));

create policy "Users can create own student reports"
  on public.reports for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and status = 'queued'
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'student' and p.role_status = 'active' and p.residence_id = residence_id)
  );

create policy "Students see own reports, admins see only assigned service, managers see residence reports"
  on public.reports for select to authenticated
  using (
    student_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.residence_id = reports.residence_id and p.role_status = 'active' and (p.role = 'manager' or (p.role = 'staff' and p.service = reports.service)))
  );

create policy "Assigned admins and managers can update reports"
  on public.reports for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.residence_id = reports.residence_id and p.role_status = 'active' and (p.role = 'manager' or (p.role = 'staff' and p.service = reports.service))))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.residence_id = reports.residence_id and p.role_status = 'active' and (p.role = 'manager' or (p.role = 'staff' and p.service = reports.service))));

create policy "Report participants can read messages"
  on public.report_messages for select to authenticated
  using (exists (select 1 from public.reports r where r.id = report_id and (r.student_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.residence_id = r.residence_id and p.role_status = 'active' and (p.role = 'manager' or (p.role = 'staff' and p.service = r.service))))));

create policy "Report participants can send messages"
  on public.report_messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and exists (select 1 from public.reports r where r.id = report_id and (r.student_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.residence_id = r.residence_id and p.role_status = 'active' and (p.role = 'manager' or (p.role = 'staff' and p.service = r.service))))));

-- Enable realtime after deploying if live message updates are needed:
-- alter publication supabase_realtime add table public.reports, public.report_messages;
