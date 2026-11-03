-- Persist report reply timing and student residence ratings in Supabase.
alter table public.reports
  add column if not exists admin_replied_at timestamptz;

create or replace function public.mark_report_admin_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender_role text;
begin
  select p.role into sender_role from public.profiles p where p.id = new.sender_id;
  if sender_role in ('staff', 'manager') then
    update public.reports
      set admin_replied_at = coalesce(admin_replied_at, new.created_at),
          status = case when status = 'queued' then 'in_progress' else status end,
          updated_at = now()
      where id = new.report_id;
  end if;
  return new;
end;
$$;

drop trigger if exists report_admin_reply_tracking on public.report_messages;
create trigger report_admin_reply_tracking
  after insert on public.report_messages
  for each row execute function public.mark_report_admin_reply();

create or replace function public.complete_residence_report(p_report_id uuid)
returns public.reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles%rowtype;
  completed public.reports%rowtype;
begin
  select * into actor from public.profiles
    where id = auth.uid() and role_status = 'active' and role in ('staff', 'manager');
  if not found then raise exception 'An active residence administrator is required.'; end if;
  update public.reports r set status = 'done', updated_at = now()
    where r.id = p_report_id and r.residence_id = actor.residence_id
      and (actor.role = 'manager' or r.service = actor.service)
    returning r.* into completed;
  if not found then raise exception 'This report is unavailable to your account.'; end if;
  return completed;
end;
$$;
revoke all on function public.complete_residence_report(uuid) from public;
grant execute on function public.complete_residence_report(uuid) to authenticated;

create table if not exists public.residence_announcements (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  message text not null check (char_length(message) between 1 and 3000),
  recipient_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists residence_announcements_residence_created
  on public.residence_announcements(residence_id, created_at desc);
alter table public.residence_announcements enable row level security;
create policy "Residence members can read announcements addressed to them"
  on public.residence_announcements for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid())
      and p.residence_id = residence_announcements.residence_id)
    and (cardinality(recipient_ids) = 0 or (select auth.uid()) = any(recipient_ids))
  );

create or replace function public.send_residence_announcement(p_message text, p_recipient_ids uuid[] default '{}')
returns public.residence_announcements
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles%rowtype;
  sent public.residence_announcements%rowtype;
  recipients uuid[] := coalesce(p_recipient_ids, '{}');
  clean_message text := trim(p_message);
begin
  select * into actor from public.profiles
    where id = auth.uid() and role = 'manager' and role_status = 'active';
  if not found then raise exception 'Only an active residence manager can send announcements.'; end if;
  if char_length(clean_message) < 1 or char_length(clean_message) > 3000 then
    raise exception 'Announcement must contain 1 to 3000 characters.';
  end if;
  if cardinality(recipients) > 0 and exists (
    select 1 from unnest(recipients) as recipient(user_id)
    where not exists (select 1 from public.profiles p
      where p.id = recipient.user_id and p.residence_id = actor.residence_id)
  ) then raise exception 'Every selected recipient must belong to your residence.'; end if;
  insert into public.residence_announcements(residence_id, sender_id, message, recipient_ids)
    values (actor.residence_id, actor.id, clean_message, recipients)
    returning * into sent;
  return sent;
end;
$$;
revoke all on function public.send_residence_announcement(text, uuid[]) from public;
grant execute on function public.send_residence_announcement(text, uuid[]) to authenticated;

create table if not exists public.residence_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  residence_id uuid not null references public.residences(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  unique (user_id, residence_id)
);
alter table public.residence_ratings enable row level security;
drop policy if exists "Students manage their residence rating" on public.residence_ratings;
create policy "Students manage their residence rating"
  on public.residence_ratings for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p where p.id = (select auth.uid())
        and p.role = 'student' and p.role_status = 'active'
        and p.residence_id = residence_ratings.residence_id
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p where p.id = (select auth.uid())
        and p.role = 'student' and p.role_status = 'active'
        and p.residence_id = residence_ratings.residence_id
    )
  );

-- Reserve a service slot while an application is pending too, so a manager
-- never has to reject a duplicate after it was accepted in the UI.
drop index if exists public.one_active_admin_per_service;
create unique index one_active_admin_per_service
  on public.profiles (residence_id, service)
  where role = 'staff' and role_status in ('pending', 'active');

-- Keep the first-choice cooldown anchored to account creation and prevent
-- reusing this RPC to alter other profile fields.
revoke all on function public.mark_report_admin_reply() from public;
