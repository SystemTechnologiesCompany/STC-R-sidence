create table if not exists public.service_ratings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  residence_id uuid not null references public.residences(id) on delete cascade,
  service text not null check (service in ('Restauration','Hébergement','Maintenance','Santé','Transport','Activités')),
  rating integer not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, residence_id, service)
);
create index if not exists service_ratings_residence_service on public.service_ratings(residence_id, service);
alter table public.service_ratings enable row level security;
drop policy if exists "Read own service votes" on public.service_ratings;
create policy "Read own service votes" on public.service_ratings for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.service_ratings from anon;
revoke insert, update, delete on public.service_ratings from authenticated;
grant select on public.service_ratings to authenticated;

create or replace function public.rate_my_residence_service(p_service text, p_rating integer)
returns void language plpgsql security definer set search_path = '' as $$
declare actor public.profiles%rowtype;
begin
  select * into actor from public.profiles where id = auth.uid() for share;
  if not found or actor.role <> 'student' or actor.role_status <> 'active' or actor.residence_id is null then
    raise exception 'Seuls les étudiants actifs peuvent noter les services de leur résidence.';
  end if;
  if p_service is null or p_service not in ('Restauration','Hébergement','Maintenance','Santé','Transport','Activités')
    or p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Choisissez un service et une note de 1 à 5.';
  end if;
  insert into public.service_ratings(user_id,residence_id,service,rating)
    values(actor.id,actor.residence_id,p_service,p_rating)
    on conflict(user_id,residence_id,service) do update set rating = excluded.rating, updated_at = now();
end;
$$;
revoke all on function public.rate_my_residence_service(text,integer) from public, anon;
grant execute on function public.rate_my_residence_service(text,integer) to authenticated;

create or replace function public.get_residence_rating_summary()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Connectez-vous pour consulter les notes.'; end if;
  with service_scores as (
    select residence_id,service,avg(rating)::numeric as average,count(*) as votes
    from public.service_ratings group by residence_id,service
  ), totals as (
    -- Each rated service has equal weight. Unrated services are excluded.
    select residence_id,avg(average) as average,sum(votes) as votes,count(*) as rated_services
    from service_scores group by residence_id
  )
  select jsonb_build_object(
    'residences',coalesce((select jsonb_agg(jsonb_build_object(
      'id',r.id,'name',r.name,'average',round(t.average,2),'votes',coalesce(t.votes,0),
      'rated_services',coalesce(t.rated_services,0)) order by r.name)
      from public.residences r left join totals t on t.residence_id=r.id),'[]'::jsonb),
    'services',coalesce((select jsonb_agg(jsonb_build_object(
      'service',s.service,'average',round(sc.average,2),'votes',coalesce(sc.votes,0),'mine',my.rating) order by s.ordinal)
      from unnest(array['Restauration','Hébergement','Maintenance','Santé','Transport','Activités']) with ordinality s(service,ordinal)
      join public.profiles p on p.id=auth.uid()
      left join service_scores sc on sc.residence_id=p.residence_id and sc.service=s.service
      left join public.service_ratings my on my.user_id=p.id and my.residence_id=p.residence_id and my.service=s.service),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.get_residence_rating_summary() from public, anon;
grant execute on function public.get_residence_rating_summary() to authenticated;

-- Legacy residence-only votes remain stored, but do not influence service averages.
-- They cannot be assigned to a service without asking the student.
