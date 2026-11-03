-- Two initial name corrections per account, then one change every 14 days.
alter table public.profiles add column if not exists name_changes_used integer not null default 0
  check (name_changes_used between 0 and 2);

create or replace function public.change_my_profile_name(p_full_name text)
returns public.profiles
language plpgsql security definer set search_path = ''
as $$
declare
  current_profile public.profiles%rowtype;
  clean_name text := regexp_replace(trim(p_full_name), '\s+', ' ', 'g');
begin
  if auth.uid() is null then raise exception 'Sign in is required.'; end if;
  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 60 then
    raise exception 'Name must contain 2 to 60 characters.';
  end if;
  -- Serialize changes so simultaneous devices cannot reuse a free correction.
  select * into current_profile from public.profiles where id = auth.uid() for update;
  if not found then raise exception 'Create your residence profile before changing your name.'; end if;
  if clean_name = current_profile.full_name then return current_profile; end if;
  if current_profile.name_changes_used >= 2
    and now() < current_profile.name_last_changed_at + interval '14 days' then
    raise exception 'Votre prochaine modification sera disponible 14 jours après le dernier changement.';
  end if;
  update public.profiles
    set full_name = clean_name,
        name_changes_used = least(name_changes_used + 1, 2),
        name_last_changed_at = now()
    where id = auth.uid() returning * into current_profile;
  return current_profile;
end;
$$;
revoke all on function public.change_my_profile_name(text) from public;
grant execute on function public.change_my_profile_name(text) to authenticated;
