-- ============================================================================
-- Friend2Friend — initial schema (Phase 2 foundation)
-- Postgres + Supabase. Apply with the Supabase CLI: `supabase db push`
-- or paste into the Supabase Studio SQL editor.
--
-- Conventions:
--   * `profiles` extends Supabase's built-in `auth.users` (1:1).
--   * Row-Level Security (RLS) is ON for every table; access goes through
--     policies that key off `auth.uid()` (the logged-in user).
--   * Blocking is enforced in the database, not just the UI.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists postgis;      -- geography type + distance for range matching
create extension if not exists citext;        -- case-insensitive interest names

-- ── Profiles (1:1 with auth.users) ───────────────────────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text unique not null,
  first_name     text not null default '',
  age            int check (age is null or age between 13 and 120),
  bio            text not null default '' check (char_length(bio) <= 255),
  region         text not null default '',
  radius_mi      int not null default 25 check (radius_mi between 1 and 150),
  share_location boolean not null default true,
  socials        jsonb not null default '{}'::jsonb,
  -- leaderboard stats (simple denormalized counters for now)
  points         int not null default 0,
  connections    int not null default 0,
  -- last known position (only used for matching when share_location = true)
  location       geography(Point, 4326),
  location_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
-- derived initials helper kept in the app layer (e.g. "Petr Anteater" -> "PA")
create index profiles_location_gix on public.profiles using gist (location);

-- ── Interests ─────────────────────────────────────────────────────────────--
create table public.interests (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- display form, e.g. "Rock Climbing"
  name_norm   citext generated always as (lower(btrim(name))) stored unique,
  created_by  uuid references public.profiles(id) on delete set null,
  status      text not null default 'active' check (status in ('active','removed','flagged')),
  created_at  timestamptz not null default now()
);

-- ── UserInterest (subscription, active/inactive) ─────────────────────────────
create table public.user_interests (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  is_active   boolean not null default true,
  date_added  timestamptz not null default now(),
  primary key (user_id, interest_id)
);
create index user_interests_interest_idx on public.user_interests(interest_id) where is_active;

-- enforce the "max 20 interests" rule from the requirements doc
create or replace function public.enforce_interest_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.user_interests where user_id = new.user_id) >= 20 then
    raise exception 'interest_limit_reached: a user may subscribe to at most 20 interests';
  end if;
  return new;
end $$;
create trigger trg_interest_limit
  before insert on public.user_interests
  for each row execute function public.enforce_interest_limit();

-- ── Blocking (scoped) ────────────────────────────────────────────────────────
-- scopes mirror the UI: { profile, geo, messages, leaderboard }
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  scopes     jsonb not null default '{"profile":true,"geo":true,"messages":true,"leaderboard":false}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks(blocked_id);

-- true if `owner` has blocked `viewer` for the given scope
create or replace function public.is_blocked(owner uuid, viewer uuid, scope text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where blocker_id = owner and blocked_id = viewer
      and coalesce((scopes ->> scope)::boolean, false)
  );
$$;

-- ── Chat: conversations / members / messages ─────────────────────────────────
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  is_dm           boolean not null default true,
  title           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  -- pending = invited but not yet accepted (powers the Invites tab)
  status          text not null default 'pending' check (status in ('pending','accepted','declined','left')),
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conv_members_user_idx on public.conversation_members(user_id);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (char_length(body) <= 1024),
  created_at      timestamptz not null default now()
);
create index messages_conv_idx on public.messages(conversation_id, created_at);

-- membership test used throughout chat RLS
create or replace function public.is_member(conv uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv and user_id = uid and status in ('pending','accepted')
  );
$$;

-- ── Badges (catalog + per-user earned/equipped) ──────────────────────────────
create table public.badges (
  id    text primary key,          -- slug, e.g. 'pioneer'
  name  text not null,
  sub   text not null,
  glyph text not null
);

create table public.user_badges (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  badge_id  text not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  equipped  boolean not null default false,
  primary key (user_id, badge_id)
);

-- enforce "max 5 equipped"
create or replace function public.enforce_equip_limit()
returns trigger language plpgsql as $$
begin
  if new.equipped and (
    select count(*) from public.user_badges
    where user_id = new.user_id and equipped and badge_id <> new.badge_id
  ) >= 5 then
    raise exception 'equip_limit_reached: at most 5 badges may be equipped';
  end if;
  return new;
end $$;
create trigger trg_equip_limit
  before insert or update on public.user_badges
  for each row execute function public.enforce_equip_limit();

-- ── Auto-create a profile when a new auth user signs up ──────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uname text;
begin
  uname := coalesce(
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  );
  -- de-dupe username collisions with a short suffix
  if exists (select 1 from public.profiles where username = uname) then
    uname := uname || '_' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username, first_name)
  values (new.id, uname, coalesce(new.raw_user_meta_data ->> 'first_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── updated_at touch trigger ─────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger trg_profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.profiles             enable row level security;
alter table public.interests            enable row level security;
alter table public.user_interests       enable row level security;
alter table public.blocks               enable row level security;
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;
alter table public.badges               enable row level security;
alter table public.user_badges          enable row level security;

-- profiles: anyone signed in can read a profile unless its owner blocked them
-- (profile scope). You can always read your own row.
create policy profiles_select on public.profiles for select to authenticated
  using ( id = auth.uid() or not public.is_blocked(id, auth.uid(), 'profile') );
create policy profiles_update on public.profiles for update to authenticated
  using ( id = auth.uid() ) with check ( id = auth.uid() );
-- insert is handled by the signup trigger (security definer); no client insert.

-- interests: readable by all signed-in users; any user may create one
create policy interests_select on public.interests for select to authenticated using (true);
create policy interests_insert on public.interests for insert to authenticated
  with check ( created_by = auth.uid() );

-- user_interests: you manage only your own subscriptions
create policy ui_select on public.user_interests for select to authenticated
  using ( user_id = auth.uid() or not public.is_blocked(user_id, auth.uid(), 'profile') );
create policy ui_all on public.user_interests for all to authenticated
  using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );

-- blocks: you manage only the blocks you created
create policy blocks_select on public.blocks for select to authenticated using ( blocker_id = auth.uid() );
create policy blocks_all    on public.blocks for all    to authenticated
  using ( blocker_id = auth.uid() ) with check ( blocker_id = auth.uid() );

-- conversations: visible to members; creatable by the authed user
create policy conv_select on public.conversations for select to authenticated
  using ( public.is_member(id, auth.uid()) );
create policy conv_insert on public.conversations for insert to authenticated
  with check ( created_by = auth.uid() );

-- members: you can see membership rows for conversations you belong to;
-- you can add members (invite) / update your own membership (accept/decline)
create policy cm_select on public.conversation_members for select to authenticated
  using ( public.is_member(conversation_id, auth.uid()) );
create policy cm_insert on public.conversation_members for insert to authenticated
  with check ( public.is_member(conversation_id, auth.uid()) or user_id = auth.uid() );
create policy cm_update on public.conversation_members for update to authenticated
  using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );

-- messages: members can read; you can only send as yourself, and only if the
-- recipient(s) haven't blocked you for messaging
create policy msg_select on public.messages for select to authenticated
  using ( public.is_member(conversation_id, auth.uid()) );
create policy msg_insert on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_member(conversation_id, auth.uid())
    and not exists (
      select 1
      from public.conversation_members m
      where m.conversation_id = messages.conversation_id
        and m.user_id <> auth.uid()
        and public.is_blocked(m.user_id, auth.uid(), 'messages')
    )
  );

-- badges catalog: world-readable; user_badges visible to owner (+ equipped to others)
create policy badges_select on public.badges for select to authenticated using (true);
create policy ub_select on public.user_badges for select to authenticated
  using ( user_id = auth.uid() or equipped );
create policy ub_all on public.user_badges for all to authenticated
  using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );
