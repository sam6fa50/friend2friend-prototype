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
