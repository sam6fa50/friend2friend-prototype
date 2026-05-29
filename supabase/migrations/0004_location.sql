-- ============================================================================
-- Friend2Friend — location-aware Discover (PostGIS range matching)
-- discover_candidates(): other users who (1) share >=1 active interest with me,
-- (2) I haven't swiped, (3) neither of us has blocked, and (4) are within mutual
-- range when both of us share a GPS location. Returns real distance in miles.
-- Idempotent (create or replace).
-- Apply: node --env-file=.env.local scripts/db-apply.mjs ../supabase/migrations/0004_location.sql
-- ============================================================================

create or replace function public.discover_candidates()
returns table (
  id           uuid,
  first_name   text,
  username     text,
  age          int,
  bio          text,
  region       text,
  distance_mi  double precision,
  interests    text[]
)
language sql stable security definer set search_path = public, extensions as $$
  with me as (
    select id, radius_mi, location, share_location
    from public.profiles where id = auth.uid()
  )
  select
    p.id, p.first_name, p.username, p.age, p.bio, p.region,
    case
      when m.location is not null and p.location is not null and m.share_location and p.share_location
      then ST_Distance(m.location, p.location) / 1609.344
    end as distance_mi,
    array_agg(distinct i.name order by i.name) as interests
  from public.profiles p
  cross join me m
  join public.user_interests ui on ui.user_id = p.id and ui.is_active
  join public.interests i on i.id = ui.interest_id
  where p.id <> auth.uid()
    -- shares at least one active interest with me
    and exists (
      select 1 from public.user_interests ui2
      join public.user_interests mine on mine.interest_id = ui2.interest_id
      where ui2.user_id = p.id and ui2.is_active
        and mine.user_id = auth.uid() and mine.is_active
    )
    -- not already swiped
    and not exists (
      select 1 from public.swipes s where s.swiper_id = auth.uid() and s.target_id = p.id
    )
    -- neither side has blocked the other (profile scope)
    and not public.is_blocked(p.id, auth.uid(), 'profile')
    and not public.is_blocked(auth.uid(), p.id, 'profile')
    -- mutual range: only enforced when both of us share a location
    and (
      m.location is null or p.location is null or not m.share_location or not p.share_location
      or ST_DWithin(m.location, p.location, least(m.radius_mi, p.radius_mi) * 1609.344)
    )
  group by p.id, p.first_name, p.username, p.age, p.bio, p.region,
           m.location, p.location, m.share_location, p.share_location
  order by distance_mi nulls last;
$$;

grant execute on function public.discover_candidates() to authenticated;
