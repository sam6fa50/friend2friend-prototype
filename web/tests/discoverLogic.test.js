import { describe, it, expect } from 'vitest';
import {
  initialsFrom,
  toInterestSet,
  sharedInterests,
  matchScore,
  formatDistance,
  mapCandidate,
  sortByMatch,
  isViableCandidate,
  pointWKT,
  milesBetween,
  withinMutualRange,
  formatRegion,
  isPermissionDenied,
  MATCH_BASE,
  MATCH_CAP,
} from '../src/discoverLogic.js';

// ── Test data ────────────────────────────────────────────────────────────────

// Mirrors a row coming back from the discover_candidates RPC.
const sarahRow = {
  id: 'u-sarah',
  first_name: 'Sarah',
  username: 'sarah.chen',
  age: 26,
  bio: 'Rock climbing enthusiast',
  region: 'Irvine, CA',
  distance_mi: 1.23,
  interests: ['Rock Climbing', 'Photography', 'Hiking'],
};

const UCI = { lat: 33.6405, lng: -117.8443 };
const LA = { lat: 34.0522, lng: -118.2437 }; // ~36.5 mi NW of UCI

// ── initialsFrom ─────────────────────────────────────────────────────────────

describe('initialsFrom', () => {
  it('takes first + last initial for a multi-word name', () => {
    expect(initialsFrom('Petr the Anteater')).toBe('PA');
  });

  it('takes the first two letters of a single-word name', () => {
    expect(initialsFrom('Sam')).toBe('SA');
  });

  it('uppercases the result', () => {
    expect(initialsFrom('sarah chen')).toBe('SC');
  });

  it('collapses extra whitespace', () => {
    expect(initialsFrom('  Marcus   Johnson  ')).toBe('MJ');
  });

  it('falls back to an emoji for an empty name', () => {
    expect(initialsFrom('')).toBe('🙂');
    expect(initialsFrom('   ')).toBe('🙂');
    expect(initialsFrom(null)).toBe('🙂');
  });
});

// ── toInterestSet / sharedInterests ──────────────────────────────────────────

describe('toInterestSet', () => {
  it('lowercases every interest', () => {
    const set = toInterestSet(['Rock Climbing', 'HIKING']);
    expect(set.has('rock climbing')).toBe(true);
    expect(set.has('hiking')).toBe(true);
  });

  it('returns an empty set for null/undefined', () => {
    expect(toInterestSet(null).size).toBe(0);
    expect(toInterestSet(undefined).size).toBe(0);
  });
});

describe('sharedInterests', () => {
  it('returns interests shared with me, case-insensitively', () => {
    const mine = toInterestSet(['rock climbing', 'cooking']);
    expect(sharedInterests(['Rock Climbing', 'Photography'], mine)).toEqual(['Rock Climbing']);
  });

  it('preserves the candidate original casing in the result', () => {
    const mine = toInterestSet(['HIKING']);
    expect(sharedInterests(['Hiking'], mine)).toEqual(['Hiking']);
  });

  it('returns an empty array when nothing overlaps', () => {
    const mine = toInterestSet(['Surfing']);
    expect(sharedInterests(['Reading', 'Coffee'], mine)).toEqual([]);
  });

  it('handles a missing interest list', () => {
    expect(sharedInterests(null, toInterestSet(['Surfing']))).toEqual([]);
  });
});

// ── matchScore ───────────────────────────────────────────────────────────────

describe('matchScore', () => {
  it('returns the base score with zero shared interests', () => {
    expect(matchScore(0)).toBe(MATCH_BASE);
  });

  it('adds 11 per shared interest', () => {
    expect(matchScore(1)).toBe(66);
    expect(matchScore(3)).toBe(88);
  });

  it('caps at 99 so no card shows a perfect 100%', () => {
    expect(matchScore(100)).toBe(MATCH_CAP);
  });

  it('clamps negative counts to the base score', () => {
    expect(matchScore(-5)).toBe(MATCH_BASE);
  });
});

// ── formatDistance ───────────────────────────────────────────────────────────

describe('formatDistance', () => {
  it('formats a real distance to one decimal + " mi away"', () => {
    expect(formatDistance(1.234, 'Irvine, CA')).toBe('1.2 mi away');
  });

  it('formats a zero distance (not treated as missing)', () => {
    expect(formatDistance(0, 'Irvine, CA')).toBe('0.0 mi away');
  });

  it('falls back to the region when distance is null', () => {
    expect(formatDistance(null, 'Irvine, CA')).toBe('Irvine, CA');
  });

  it('falls back to "Nearby" when there is no distance or region', () => {
    expect(formatDistance(null, '')).toBe('Nearby');
    expect(formatDistance(undefined, undefined)).toBe('Nearby');
  });
});

// ── mapCandidate ─────────────────────────────────────────────────────────────

describe('mapCandidate', () => {
  const mine = toInterestSet(['rock climbing', 'hiking']);

  it('maps a full RPC row into the Discover card shape', () => {
    const card = mapCandidate(sarahRow, mine);
    expect(card).toMatchObject({
      id: 'u-sarah',
      name: 'Sarah',
      initials: 'SA',
      age: 26,
      bio: 'Rock climbing enthusiast',
      region: 'Irvine, CA',
      distance: '1.2 mi away',
    });
  });

  it('computes shared interests and match score together', () => {
    const card = mapCandidate(sarahRow, mine);
    expect(card.shared).toEqual(['Rock Climbing', 'Hiking']);
    expect(card.match).toBe(matchScore(2)); // 77
  });

  it('falls back to username, then "User", for a missing first name', () => {
    expect(mapCandidate({ id: 'a', username: 'zot' }, mine).name).toBe('zot');
    expect(mapCandidate({ id: 'b' }, mine).name).toBe('User');
  });

  it('uses the region label when there is no distance', () => {
    const card = mapCandidate({ ...sarahRow, distance_mi: null }, mine);
    expect(card.distance).toBe('Irvine, CA');
  });

  it('defaults empty bio/region/interests safely', () => {
    const card = mapCandidate({ id: 'c', first_name: 'New' }, mine);
    expect(card.bio).toBe('');
    expect(card.region).toBe('');
    expect(card.interests).toEqual([]);
    expect(card.shared).toEqual([]);
    expect(card.match).toBe(MATCH_BASE);
  });
});

// ── sortByMatch ──────────────────────────────────────────────────────────────

describe('sortByMatch', () => {
  it('orders a deck by match descending', () => {
    const deck = [{ match: 55 }, { match: 99 }, { match: 77 }];
    expect(sortByMatch(deck).map(c => c.match)).toEqual([99, 77, 55]);
  });

  it('does not mutate the original deck', () => {
    const deck = [{ match: 55 }, { match: 99 }];
    sortByMatch(deck);
    expect(deck.map(c => c.match)).toEqual([55, 99]);
  });
});

// ── isViableCandidate (fallback filter) ──────────────────────────────────────

describe('isViableCandidate', () => {
  it('keeps a candidate who shares an interest and has not been swiped', () => {
    expect(isViableCandidate({ id: 'x', shared: ['Hiking'] }, new Set())).toBe(true);
  });

  it('drops a candidate with no shared interests', () => {
    expect(isViableCandidate({ id: 'x', shared: [] }, new Set())).toBe(false);
  });

  it('drops a candidate the user has already swiped', () => {
    expect(isViableCandidate({ id: 'x', shared: ['Hiking'] }, new Set(['x']))).toBe(false);
  });
});

// ── pointWKT ─────────────────────────────────────────────────────────────────

describe('pointWKT', () => {
  it('emits a PostGIS literal in lng-then-lat order', () => {
    // POINT takes (x=lng, y=lat) — guarding against the classic swap bug.
    expect(pointWKT(33.6405, -117.8443)).toBe('SRID=4326;POINT(-117.8443 33.6405)');
  });
});

// ── milesBetween (haversine, mirrors ST_Distance) ────────────────────────────

describe('milesBetween', () => {
  it('is zero for the same point', () => {
    expect(milesBetween(UCI, UCI)).toBe(0);
  });

  it('is symmetric (A→B equals B→A)', () => {
    expect(milesBetween(UCI, LA)).toBeCloseTo(milesBetween(LA, UCI), 6);
  });

  it('matches the known UCI↔LA distance (~36.5 mi)', () => {
    expect(milesBetween(UCI, LA)).toBeGreaterThan(35);
    expect(milesBetween(UCI, LA)).toBeLessThan(38);
  });
});

// ── withinMutualRange (the core "no one-sided visibility" rule) ───────────────

describe('withinMutualRange', () => {
  it('is visible when distance is within both radii', () => {
    expect(withinMutualRange(5, 25, 50)).toBe(true);
  });

  it('uses the SMALLER radius — out of range if either side is too tight', () => {
    // 30 mi apart: my 50mi reach includes them, but their 25mi reach excludes me.
    expect(withinMutualRange(30, 50, 25)).toBe(false);
  });

  it('is symmetric: swapping the radii gives the same answer', () => {
    expect(withinMutualRange(30, 25, 50)).toBe(withinMutualRange(30, 50, 25));
  });

  it('includes the exact boundary distance', () => {
    expect(withinMutualRange(25, 25, 50)).toBe(true);
  });

  it('excludes a hair past the smaller radius', () => {
    expect(withinMutualRange(25.01, 25, 50)).toBe(false);
  });
});

// ── formatRegion (reverse-geocode parsing) ───────────────────────────────────

describe('formatRegion', () => {
  it('prefers locality over the broader city field', () => {
    const geo = { locality: 'Irvine', city: 'Central Coast', principalSubdivisionCode: 'US-CA' };
    expect(formatRegion(geo)).toBe('Irvine, CA');
  });

  it('falls back to city when there is no locality', () => {
    expect(formatRegion({ city: 'Riverside', principalSubdivisionCode: 'US-CA' })).toBe('Riverside, CA');
  });

  it('falls back to principalSubdivision when there is no city', () => {
    expect(formatRegion({ principalSubdivision: 'California', principalSubdivisionCode: 'US-CA' }))
      .toBe('California, CA');
  });

  it('extracts the state code from "US-CA"', () => {
    expect(formatRegion({ locality: 'Austin', principalSubdivisionCode: 'US-TX' })).toBe('Austin, TX');
  });

  it('returns just the city when there is no subdivision code', () => {
    expect(formatRegion({ locality: 'Irvine' })).toBe('Irvine');
  });

  it('returns an empty string for an empty or missing response', () => {
    expect(formatRegion({})).toBe('');
    expect(formatRegion(null)).toBe('');
  });
});

// ── isPermissionDenied ───────────────────────────────────────────────────────

describe('isPermissionDenied', () => {
  it('is true for PERMISSION_DENIED (code 1)', () => {
    expect(isPermissionDenied({ code: 1, PERMISSION_DENIED: 1 })).toBe(true);
  });

  it('is false for other geolocation error codes', () => {
    expect(isPermissionDenied({ code: 2 })).toBe(false); // POSITION_UNAVAILABLE
    expect(isPermissionDenied({ code: 3 })).toBe(false); // TIMEOUT
  });

  it('is false for null/undefined', () => {
    expect(isPermissionDenied(null)).toBe(false);
    expect(isPermissionDenied(undefined)).toBe(false);
  });
});

// ── Integration: build a Discover deck from raw rows ──────────────────────────

describe('Integration: deck assembly (filter shared + exclude swiped + sort)', () => {
  it('keeps only shared-interest, unswiped candidates, ranked by match', () => {
    const mine = toInterestSet(['Rock Climbing', 'Hiking', 'Cooking']);
    const rows = [
      { id: 'sarah',  first_name: 'Sarah',  interests: ['Rock Climbing', 'Hiking'] }, // 2 shared → 77
      { id: 'jamie',  first_name: 'Jamie',  interests: ['Rock Climbing', 'Hiking', 'Cooking'] }, // 3 → 88
      { id: 'tyler',  first_name: 'Tyler',  interests: ['Pickleball', 'Running'] }, // 0 shared → dropped
      { id: 'priya',  first_name: 'Priya',  interests: ['Cooking'] }, // 1 shared → 66, but already swiped
    ];
    const swiped = new Set(['priya']);

    const deck = sortByMatch(
      rows.map(r => mapCandidate(r, mine)).filter(c => isViableCandidate(c, swiped)),
    );

    expect(deck.map(c => c.id)).toEqual(['jamie', 'sarah']);
    expect(deck.map(c => c.match)).toEqual([88, 77]);
  });
});

// ── Integration: mutual range guarantees symmetric visibility ─────────────────

describe('Integration: mutual visibility via PostGIS-equivalent range check', () => {
  it('A and B see each other only when both radii cover the gap', () => {
    const dist = milesBetween(UCI, LA); // ~36.5 mi
    // Both set a wide radius → mutual visibility.
    expect(withinMutualRange(dist, 50, 50)).toBe(true);
    // B narrows to 25 mi → neither should see the other (no one-sided leak).
    const aSeesB = withinMutualRange(dist, 50, 25);
    const bSeesA = withinMutualRange(dist, 25, 50);
    expect(aSeesB).toBe(false);
    expect(bSeesA).toBe(false);
    expect(aSeesB).toBe(bSeesA);
  });
});
