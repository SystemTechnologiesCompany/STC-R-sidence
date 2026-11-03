-- The previous profiles policy queried profiles from inside its own policy.
-- Use a fixed-search-path function to read only the current account's residence.
create or replace function public.current_account_residence_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select residence_id from public.profiles where id = (select auth.uid());
$$;

revoke all on function public.current_account_residence_id() from public;
grant execute on function public.current_account_residence_id() to authenticated;

drop policy if exists "Users can view profiles in their residence" on public.profiles;
create policy "Users can view profiles in their residence"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or residence_id = (select public.current_account_residence_id())
  );
