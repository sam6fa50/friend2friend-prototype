-- ============================================================================
-- Friend2Friend — RLS repair (idempotent)
-- Re-creates the helper functions + ALL row-level-security policies. Safe to
-- run whether or not they already exist (every policy is dropped-if-exists
-- first). Run this if chat (conversations/members/messages) inserts fail with
-- "new row violates row-level security policy" — it means 0001's policy block
-- didn't fully apply.
--
-- Apply in Supabase Studio → SQL Editor → paste → Run.
-- ============================================================================

-- ── helper functions ────────────────────────────────────────────────────────
create or replace function public.is_blocked(owner uuid, viewer uuid, scope text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where blocker_id = owner and blocked_id = viewer
      and coalesce((scopes ->> scope)::boolean, false)
  );
$$;

create or replace function public.is_member(conv uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv and user_id = uid and status in ('pending','accepted')
  );
$$;

-- ── ensure RLS is on everywhere ──────────────────────────────────────────────
alter table public.profiles             enable row level security;
alter table public.interests            enable row level security;
alter table public.user_interests       enable row level security;
alter table public.blocks               enable row level security;
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;
alter table public.badges               enable row level security;
alter table public.user_badges          enable row level security;

-- ── profiles ─────────────────────────────────────────────────────────────────
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using ( id = auth.uid() or not public.is_blocked(id, auth.uid(), 'profile') );
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using ( id = auth.uid() ) with check ( id = auth.uid() );

-- ── interests ────────────────────────────────────────────────────────────────
drop policy if exists interests_select on public.interests;
create policy interests_select on public.interests for select to authenticated using (true);
drop policy if exists interests_insert on public.interests;
create policy interests_insert on public.interests for insert to authenticated
  with check ( created_by = auth.uid() );

-- ── user_interests ───────────────────────────────────────────────────────────
drop policy if exists ui_select on public.user_interests;
create policy ui_select on public.user_interests for select to authenticated
  using ( user_id = auth.uid() or not public.is_blocked(user_id, auth.uid(), 'profile') );
drop policy if exists ui_all on public.user_interests;
create policy ui_all on public.user_interests for all to authenticated
  using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );

-- ── blocks ───────────────────────────────────────────────────────────────────
drop policy if exists blocks_select on public.blocks;
create policy blocks_select on public.blocks for select to authenticated using ( blocker_id = auth.uid() );
drop policy if exists blocks_all on public.blocks;
create policy blocks_all on public.blocks for all to authenticated
  using ( blocker_id = auth.uid() ) with check ( blocker_id = auth.uid() );

-- ── conversations ────────────────────────────────────────────────────────────
drop policy if exists conv_select on public.conversations;
create policy conv_select on public.conversations for select to authenticated
  using ( public.is_member(id, auth.uid()) );
drop policy if exists conv_insert on public.conversations;
create policy conv_insert on public.conversations for insert to authenticated
  with check ( created_by = auth.uid() );

-- ── conversation_members ─────────────────────────────────────────────────────
drop policy if exists cm_select on public.conversation_members;
create policy cm_select on public.conversation_members for select to authenticated
  using ( public.is_member(conversation_id, auth.uid()) );
drop policy if exists cm_insert on public.conversation_members;
create policy cm_insert on public.conversation_members for insert to authenticated
  with check ( public.is_member(conversation_id, auth.uid()) or user_id = auth.uid() );
drop policy if exists cm_update on public.conversation_members;
create policy cm_update on public.conversation_members for update to authenticated
  using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );

-- ── messages ─────────────────────────────────────────────────────────────────
drop policy if exists msg_select on public.messages;
create policy msg_select on public.messages for select to authenticated
  using ( public.is_member(conversation_id, auth.uid()) );
drop policy if exists msg_insert on public.messages;
create policy msg_insert on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_member(conversation_id, auth.uid())
    and not exists (
      select 1 from public.conversation_members m
      where m.conversation_id = messages.conversation_id
        and m.user_id <> auth.uid()
        and public.is_blocked(m.user_id, auth.uid(), 'messages')
    )
  );

-- ── badges / user_badges ─────────────────────────────────────────────────────
drop policy if exists badges_select on public.badges;
create policy badges_select on public.badges for select to authenticated using (true);
drop policy if exists ub_select on public.user_badges;
create policy ub_select on public.user_badges for select to authenticated
  using ( user_id = auth.uid() or equipped );
drop policy if exists ub_all on public.user_badges;
create policy ub_all on public.user_badges for all to authenticated
  using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );
