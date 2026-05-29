// ── Data access: profile load/save (Supabase) ─────────────────────────────
import { supabase } from './supabaseClient.js'

// "Petr the Anteater" -> "PA"; "Sam" -> "SA"
export function initialsFrom(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '🙂';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Badge persistence lands in Phase 3; until then we default the equipped set
// so the Badges section behaves like the prototype.
const DEFAULT_EQUIPPED = ['pioneer', 'connector', 'streak'];

// Load the logged-in user's profile, creating a row if one doesn't exist yet
// (e.g. for accounts made before the signup trigger was installed).
export async function fetchProfile(user) {
  let { data: row, error } = await supabase
    .from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;

  if (!row) {
    const base = (user.email?.split('@')[0] || 'user');
    const ins = await supabase.from('profiles')
      .insert({ id: user.id, username: `${base}_${user.id.slice(0, 4)}`,
        first_name: user.user_metadata?.first_name || '' })
      .select('*').single();
    if (ins.error) throw ins.error;
    row = ins.data;
  }

  const [{ data: ui }, { data: ub }] = await Promise.all([
    supabase.from('user_interests').select('interests(name)').eq('user_id', user.id),
    supabase.from('user_badges').select('badge_id, equipped').eq('user_id', user.id),
  ]);

  const name = row.first_name || row.username || user.email?.split('@')[0] || 'You';
  const equippedFromDb = (ub || []).filter(b => b.equipped).map(b => b.badge_id);

  return {
    id: row.id,
    username: row.username,
    name,
    firstName: row.first_name || name,
    age: row.age,
    initials: initialsFrom(name),
    bio: row.bio || '',
    region: row.region || '',
    radius: row.radius_mi ?? 25,
    shareLocation: row.share_location,
    socials: row.socials && Object.keys(row.socials).length
      ? row.socials : { instagram: false, twitter: false, tiktok: false, discord: false },
    interests: (ui || []).map(r => r.interests?.name).filter(Boolean),
    equipped: equippedFromDb.length ? equippedFromDb : DEFAULT_EQUIPPED,
    stats: { points: row.points || 0, connections: row.connections || 0, rank: 0 },
  };
}

// Load the active interest catalog (names) from the DB, for the picker/search.
export async function fetchInterestsCatalog() {
  const { data, error } = await supabase
    .from('interests').select('name').eq('status', 'active').order('name');
  if (error) throw error;
  return (data || []).map(r => r.name);
}

// Discover deck: other users who share at least one interest with me.
// (Precise distance is Phase 4 — for now we show the region as a stand-in.)
export async function fetchDiscover(me) {
  const { data, error } = await supabase.from('profiles')
    .select('id, first_name, username, age, bio, region, user_interests(interests(name))')
    .neq('id', me.id);
  if (error) throw error;
  const mine = new Set((me.interests || []).map(s => s.toLowerCase()));
  return (data || []).map(r => {
    const name = r.first_name || r.username || 'User';
    const interests = (r.user_interests || []).map(u => u.interests?.name).filter(Boolean);
    const shared = interests.filter(i => mine.has(i.toLowerCase()));
    return {
      id: r.id, name, initials: initialsFrom(name), age: r.age, bio: r.bio || '',
      region: r.region || '', distance: r.region || 'Nearby',
      interests, shared, match: Math.min(99, 55 + shared.length * 11),
    };
  })
  .filter(u => u.shared.length > 0)
  .sort((a, b) => b.match - a.match);
}

// Leaderboard: everyone, ranked by points.
export async function fetchLeaderboard(limit = 50) {
  const { data, error } = await supabase.from('profiles')
    .select('id, first_name, username, points, connections, user_interests(interests(name))')
    .order('points', { ascending: false }).order('username', { ascending: true }).limit(limit);
  if (error) throw error;
  return (data || []).map((r, i) => {
    const name = r.first_name || r.username || 'User';
    const interests = (r.user_interests || []).map(u => u.interests?.name).filter(Boolean);
    return {
      rank: i + 1, id: r.id, name, initials: initialsFrom(name),
      points: r.points || 0, connections: r.connections || 0,
      interest: interests[0] || '—', distance: '', trend: 'same', active: true,
    };
  });
}

// ── Messaging ────────────────────────────────────────────────────────────
function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
}

// My accepted conversations, each with the other member + message history.
export async function fetchConversations(me) {
  const { data: mine, error } = await supabase.from('conversation_members')
    .select('conversation_id').eq('user_id', me.id).eq('status', 'accepted');
  if (error) throw error;
  const ids = (mine || []).map(r => r.conversation_id);
  if (!ids.length) return [];

  const [{ data: members }, { data: msgs }] = await Promise.all([
    supabase.from('conversation_members')
      .select('conversation_id, user_id, profiles(first_name, username)').in('conversation_id', ids),
    supabase.from('messages')
      .select('conversation_id, sender_id, body, created_at')
      .in('conversation_id', ids).order('created_at', { ascending: true }),
  ]);

  const byConv = {};
  (msgs || []).forEach(m => { (byConv[m.conversation_id] ||= []).push(m); });

  return ids.map(cid => {
    const other = (members || []).find(m => m.conversation_id === cid && m.user_id !== me.id);
    const name = other ? (other.profiles?.first_name || other.profiles?.username || 'User') : 'Chat';
    const list = byConv[cid] || [];
    const last = list[list.length - 1];
    return {
      id: cid, otherId: other?.user_id, name, initials: initialsFrom(name),
      distance: '', shared: [], unread: 0,
      time: last ? fmtTime(last.created_at) : '',
      lastAt: last ? last.created_at : '',
      messages: list.map(m => ({ from: m.sender_id === me.id ? 'me' : 'them', text: m.body, time: fmtTime(m.created_at) })),
    };
  }).sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
}

// Pending chat invitations addressed to me.
export async function fetchInvites(me) {
  const { data: pend, error } = await supabase.from('conversation_members')
    .select('conversation_id').eq('user_id', me.id).eq('status', 'pending');
  if (error) throw error;
  const ids = (pend || []).map(r => r.conversation_id);
  if (!ids.length) return [];
  const { data: members } = await supabase.from('conversation_members')
    .select('conversation_id, user_id, status, profiles(first_name, username)').in('conversation_id', ids);
  return ids.map(cid => {
    const inviter = (members || []).find(m => m.conversation_id === cid && m.user_id !== me.id);
    const name = inviter ? (inviter.profiles?.first_name || inviter.profiles?.username || 'Someone') : 'Someone';
    return { id: cid, name, initials: initialsFrom(name), distance: '', shared: [], note: 'wants to chat' };
  });
}

export async function fetchMessages(me, conversationId) {
  const { data, error } = await supabase.from('messages')
    .select('sender_id, body, created_at').eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(m => ({ from: m.sender_id === me.id ? 'me' : 'them', text: m.body, time: fmtTime(m.created_at) }));
}

export async function sendMessage(me, conversationId, body) {
  const { error } = await supabase.from('messages')
    .insert({ conversation_id: conversationId, sender_id: me.id, body });
  if (error) throw error;
}

// Create a DM with another user (both accepted = an instant match) + opener.
export async function createDmWith(me, otherId, opener) {
  // reuse an existing DM if one already exists between us
  const { data: mineConvs } = await supabase.from('conversation_members')
    .select('conversation_id').eq('user_id', me.id);
  const myIds = (mineConvs || []).map(r => r.conversation_id);
  if (myIds.length) {
    const { data: shared } = await supabase.from('conversation_members')
      .select('conversation_id').eq('user_id', otherId).in('conversation_id', myIds);
    if (shared && shared.length) return shared[0].conversation_id;
  }

  // Generate the id client-side so we don't have to read the row back — the
  // conv_select policy (is_member) would block reading a conversation you just
  // created but aren't a member of yet.
  const convId = crypto.randomUUID();
  const ins = await supabase.from('conversations').insert({ id: convId, is_dm: true, created_by: me.id });
  if (ins.error) throw ins.error;
  // insert my membership first so the RLS is_member() check passes for the other row
  const m1 = await supabase.from('conversation_members')
    .insert({ conversation_id: convId, user_id: me.id, status: 'accepted' });
  if (m1.error) throw m1.error;
  const m2 = await supabase.from('conversation_members')
    .insert({ conversation_id: convId, user_id: otherId, status: 'accepted' });
  if (m2.error) throw m2.error;
  if (opener) await sendMessage(me, convId, opener);
  return convId;
}

export async function respondToInvite(me, conversationId, accept) {
  const { error } = await supabase.from('conversation_members')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('conversation_id', conversationId).eq('user_id', me.id);
  if (error) throw error;
}

// Persist editable profile fields + sync interest subscriptions.
export async function saveProfile(profile) {
  const { error } = await supabase.from('profiles').update({
    first_name: profile.firstName,
    age: profile.age ?? null,
    bio: profile.bio,
    region: profile.region,
    radius_mi: profile.radius,
    share_location: profile.shareLocation,
    socials: profile.socials,
  }).eq('id', profile.id);
  if (error) throw error;
  await syncInterests(profile.id, profile.interests);
}

// Resolve interest names to ids, creating any custom ones the user added.
async function resolveInterestIds(names, userId) {
  if (!names.length) return [];
  const { data: found, error } = await supabase
    .from('interests').select('id, name').in('name', names);
  if (error) throw error;
  const byName = new Map((found || []).map(r => [r.name, r.id]));
  const missing = names.filter(n => !byName.has(n));
  if (missing.length) {
    const { data: created, error: e2 } = await supabase.from('interests')
      .insert(missing.map(name => ({ name, created_by: userId })))
      .select('id, name');
    if (e2) throw e2;
    (created || []).forEach(r => byName.set(r.name, r.id));
  }
  return names.map(n => byName.get(n)).filter(Boolean);
}

async function syncInterests(userId, names) {
  const ids = await resolveInterestIds(names, userId);
  const { data: current } = await supabase
    .from('user_interests').select('interest_id').eq('user_id', userId);
  const currentIds = new Set((current || []).map(r => r.interest_id));
  const wanted = new Set(ids);
  const toAdd = ids.filter(id => !currentIds.has(id));
  const toRemove = [...currentIds].filter(id => !wanted.has(id));

  if (toAdd.length) {
    const { error } = await supabase.from('user_interests')
      .insert(toAdd.map(interest_id => ({ user_id: userId, interest_id })));
    if (error) throw error;
  }
  if (toRemove.length) {
    const { error } = await supabase.from('user_interests')
      .delete().eq('user_id', userId).in('interest_id', toRemove);
    if (error) throw error;
  }
}
