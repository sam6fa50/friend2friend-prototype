// Pure logic extracted from db.jsx (Discover deck + location/range matching).
// Kept free of Supabase/browser imports so it stays unit-testable in Vitest —
// same pattern as interestLogic.js / leaderboardLogic.js.

export const MATCH_BASE = 55;       // baseline match % with zero shared interests
export const MATCH_PER_SHARED = 11; // each shared interest adds this much
export const MATCH_CAP = 99;        // never show a "perfect" 100%

// "Petr the Anteater" -> "PA"; "Sam" -> "SA"; "" -> 🙂
export function initialsFrom(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '🙂';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// A lowercased Set of my interest names, for case-insensitive comparisons.
export function toInterestSet(interests) {
  return new Set((interests || []).map(s => s.toLowerCase()));
}

// Interests they share with me (case-insensitive). `mine` is a Set produced by
// toInterestSet(); preserves the candidate's original casing in the result.
export function sharedInterests(theirInterests, mine) {
  return (theirInterests || []).filter(i => mine.has(i.toLowerCase()));
}

// Match score for a card: base + per-shared, capped. Negative counts clamp to base.
export function matchScore(sharedCount) {
  return Math.min(MATCH_CAP, MATCH_BASE + Math.max(0, sharedCount) * MATCH_PER_SHARED);
}

// Human distance label. Real distance wins; otherwise a region name, else "Nearby".
export function formatDistance(distanceMi, region) {
  if (distanceMi != null) return `${distanceMi.toFixed(1)} mi away`;
  return region || 'Nearby';
}

// Map a DB candidate row to the shape the Discover card expects. `mine` is a
// toInterestSet() of the viewer's interests.
export function mapCandidate(row, mine) {
  const name = row.first_name || row.username || 'User';
  const interests = row.interests || [];
  const shared = sharedInterests(interests, mine);
  return {
    id: row.id,
    name,
    initials: initialsFrom(name),
    age: row.age,
    bio: row.bio || '',
    region: row.region || '',
    distance: formatDistance(row.distance_mi, row.region),
    interests,
    shared,
    match: matchScore(shared.length),
  };
}

// Sort a deck by match descending. Does not mutate the input.
export function sortByMatch(deck) {
  return [...deck].sort((a, b) => b.match - a.match);
}

// Fallback (pre-RPC) viability: shares >=1 interest and hasn't been swiped yet.
export function isViableCandidate(candidate, swipedIds) {
  return candidate.shared.length > 0 && !swipedIds.has(candidate.id);
}

// ── Location / range ─────────────────────────────────────────────────────────

// PostGIS point literal. NOTE the order is POINT(lng lat), not (lat lng) —
// a classic swap bug, hence its own tested helper.
export function pointWKT(lat, lng) {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

// Great-circle distance in miles (haversine). Mirrors the DB's ST_Distance so
// the client can reason about range without a round-trip. Points are {lat, lng}.
export function milesBetween(a, b) {
  const R = 3958.7613; // mean Earth radius, miles
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Mutual range rule: a pair is visible to each other only when their separation
// is within the SMALLER of the two radii (both must opt in via their radius).
export function withinMutualRange(distanceMi, myRadiusMi, theirRadiusMi) {
  return distanceMi <= Math.min(myRadiusMi, theirRadiusMi);
}

// ── Reverse geocoding ────────────────────────────────────────────────────────

// Turn a BigDataCloud reverse-geocode response into a "City, ST" string.
// Prefers `locality` (the actual city) over `city`, which can be a broader
// region (e.g. "Central Coast" instead of "Irvine"). Returns '' if nothing usable.
export function formatRegion(geo) {
  if (!geo) return '';
  const city = geo.locality || geo.city || geo.principalSubdivision || '';
  // principalSubdivisionCode looks like "US-CA"; keep the trailing state/region.
  const sub = (geo.principalSubdivisionCode || '').split('-').pop() || '';
  return [city, sub].filter(Boolean).join(', ');
}

// Whether a GeolocationPositionError represents the user denying permission.
// PERMISSION_DENIED === 1 in the W3C Geolocation API.
export function isPermissionDenied(err) {
  return !!err && err.code === 1;
}
