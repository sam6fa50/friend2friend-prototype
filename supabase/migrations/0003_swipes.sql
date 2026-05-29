-- ============================================================================
-- Friend2Friend — swipes (Discover decisions)
-- Records like/pass so the Discover deck excludes people you've already seen
-- (persists across tab switches, reloads, and sessions). Idempotent.
-- Apply: node --env-file=.env.local scripts/db-apply.mjs ../supabase/migrations/0003_swipes.sql
-- ============================================================================

create table if not exists public.swipes (
  swiper_id  uuid not null references public.profiles(id) on delete cascade,
  target_id  uuid not null references public.profiles(id) on delete cascade,
  direction  text not null check (direction in ('like','pass')),
  created_at timestamptz not null default now(),
  primary key (swiper_id, target_id),
  check (swiper_id <> target_id)
);

alter table public.swipes enable row level security;

-- you can only see and write your own swipes
drop policy if exists swipes_all on public.swipes;
create policy swipes_all on public.swipes for all to authenticated
  using ( swiper_id = auth.uid() ) with check ( swiper_id = auth.uid() );
