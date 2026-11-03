alter table public.profiles add column if not exists avatar_path text;
alter table public.reports add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('residence-photos', 'residence-photos', false, 6291456, array['image/jpeg'])
on conflict (id) do nothing;

create policy "Upload own residence photos" on storage.objects
for insert to authenticated with check (
  bucket_id = 'residence-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Delete own residence photos" on storage.objects
for delete to authenticated using (
  bucket_id = 'residence-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Read permitted residence photos" on storage.objects
for select to authenticated using (
  bucket_id = 'residence-photos' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.reports r where r.photo_path = storage.objects.name)
    or exists (select 1 from public.profiles p where p.avatar_path = storage.objects.name)
  )
);

create or replace function public.set_my_avatar(p_path text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in is required.'; end if;
  if p_path is null or split_part(p_path, '/', 1) <> auth.uid()::text
    or not exists (select 1 from storage.objects where bucket_id = 'residence-photos' and name = p_path)
  then raise exception 'Upload your own photo before saving it.'; end if;
  update public.profiles set avatar_path = p_path where id = auth.uid();
  if not found then raise exception 'Create your residence profile first.'; end if;
end;
$$;
revoke all on function public.set_my_avatar(text) from public;
grant execute on function public.set_my_avatar(text) to authenticated;

-- Prevent a report from referencing another account's private upload.
create or replace function public.validate_report_photo()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.photo_path is not null then
    if split_part(new.photo_path, '/', 1) <> new.student_id::text then
      raise exception 'Report photo must belong to the student.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists validate_report_photo on public.reports;
create trigger validate_report_photo before insert or update on public.reports
for each row execute function public.validate_report_photo();
