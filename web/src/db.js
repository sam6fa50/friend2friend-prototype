// ── Data access: profile load/save (Supabase) ─────────────────────────────
import { supabase } from './supabaseClient.js'
import { F2F_BADGES } from './data.js'
import { initialsFrom, mapCandidate, sortByMatch, toInterestSet, isViableCandidate,
  pointWKT, formatRegion } from './discoverLogic.js'

// Re-export so existing importers of `initialsFrom` from db.js keep working.
export { initialsFrom }

// Default equipped set for brand-new accounts that have no badge rows yet.
// Once the user saves their profile we persist their real selection (see
// syncBadges) and read it back, so this only seeds the very first load.
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
  const badgeRows = ub || [];
  const equippedFromDb = badgeRows.filter(b => b.equipped).map(b => b.badge_id);

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
    // Once the user has any badge rows we trust the DB (even if they've
    // unequipped everything); only seed the default for a fresh account.
    equipped: badgeRows.length ? equippedFromDb : DEFAULT_EQUIPPED,
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

// Record a Discover decision so the deck excludes people you've already seen.
export async function recordSwipe(me, targetId, direction) {
  const { error } = await supabase.from('swipes')
    .upsert({ swiper_id: me.id, target_id: targetId, direction }, { onConflict: 'swiper_id,target_id' });
  if (error) console.warn('recordSwipe failed (is 0003_swipes applied?):', error.message);
}

// Save my current GPS position (PostGIS geography point) for range matching,
// plus an optional human-readable region ("City, ST") for display.
export async function updateMyLocation(me, lat, lng, region) {
  const patch = { location: pointWKT(lat, lng), location_at: new Date().toISOString() };
  if (region) patch.region = region;
  const { error } = await supabase.from('profiles').update(patch).eq('id', me.id);
  if (error) console.warn('updateMyLocation failed:', error.message);
}

// Turn lat/lng into a human "City, ST" string using a keyless, CORS-friendly
// reverse-geocoder that runs straight from the browser. Degrades to '' on any
// failure so a flaky lookup never blocks saving the real coordinates.
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    if (!res.ok) return '';
    return formatRegion(await res.json());
  } catch (e) {
    console.warn('reverseGeocode failed:', e.message);
    return '';
  }
}

// Discover deck. Prefers the location-aware RPC (real distance + mutual range);
// falls back to a client-side shared-interest match if 0004 isn't applied yet.
export async function fetchDiscover(me) {
  const mine = toInterestSet(me.interests);

  const rpc = await supabase.rpc('discover_candidates');
  if (!rpc.error) {
    return sortByMatch((rpc.data || []).map(r => mapCandidate(r, mine)));
  }
  console.warn('discover_candidates RPC unavailable, using fallback:', rpc.error.message);

  // Fallback (pre-0004): no distance, exclude swiped client-side.
  let swiped = new Set();
  const sw = await supabase.from('swipes').select('target_id').eq('swiper_id', me.id);
  if (!sw.error) swiped = new Set((sw.data || []).map(r => r.target_id));
  const { data, error } = await supabase.from('profiles')
    .select('id, first_name, username, age, bio, region, user_interests(interests(name))')
    .neq('id', me.id);
  if (error) throw error;
  const deck = (data || []).map(r => mapCandidate({
    id: r.id, first_name: r.first_name, username: r.username, age: r.age, bio: r.bio, region: r.region,
    interests: (r.user_interests || []).map(u => u.interests?.name).filter(Boolean),
  }, mine));
  return sortByMatch(deck.filter(u => isViableCandidate(u, swiped)));
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
  await syncBadges(profile.id, profile.equipped || []);
}

// Persist which badges the user has equipped. We grant a row for every badge
// the catalog marks as earned (the prototype's static achievement set) and set
// `equipped` per the user's selection. Idempotent via upsert.
async function syncBadges(userId, equippedIds) {
  const earned = F2F_BADGES.filter(b => b.earned).map(b => b.id);
  if (!earned.length) return;
  const rows = earned.map(id => ({ user_id: userId, badge_id: id, equipped: equippedIds.includes(id) }));
  const { error } = await supabase.from('user_badges')
    .upsert(rows, { onConflict: 'user_id,badge_id' });
  if (error) throw error;
}

// ── Blocking ───────────────────────────────────────────────────────────────
// The blocks I've created, as { id, scopes } for each blocked user. Used to
// gray out the leaderboard and drive client-side filtering; the DB also
// enforces blocks server-side (RLS + the discover RPC).
export async function fetchBlocked(me) {
  const { data, error } = await supabase.from('blocks')
    .select('blocked_id, scopes').eq('blocker_id', me.id);
  if (error) throw error;
  return (data || []).map(r => ({ id: r.blocked_id, scopes: r.scopes }));
}

// Block a user with the chosen scopes ({ profile, geo, messages, leaderboard }).
// Idempotent: re-blocking updates the scopes.
export async function blockUser(me, targetId, scopes) {
  const { error } = await supabase.from('blocks')
    .upsert({ blocker_id: me.id, blocked_id: targetId, scopes }, { onConflict: 'blocker_id,blocked_id' });
  if (error) throw error;
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
