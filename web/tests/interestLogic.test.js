import { describe, it, expect } from 'vitest';
import {
  normalizeInterest,
  isDuplicate,
  isInappropriate,
  subscribeToInterest,
  unsubscribeFromInterest,
  toggleInterestActive,
  createInterest,
  getActiveInterests,
  MAX_INTERESTS,
} from '../src/interestLogic.js';

// ── Test data ────────────────────────────────────────────────────────────────

const makeInterest = (id, name, active = true) => ({ id, name, active });

const pickleball    = makeInterest('pickleball',     'Pickleball');
const hiking        = makeInterest('hiking',          'Hiking');
const cooking       = makeInterest('cooking',         'Cooking');
const fermented     = makeInterest('fermented_foods', 'Fermented Foods');

// ── Unit Tests ───────────────────────────────────────────────────────────────

describe('normalizeInterest', () => {
  it('lowercases the input', () => {
    expect(normalizeInterest('Pickleball')).toBe('pickleball');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeInterest('  hiking  ')).toBe('hiking');
  });

  it('handles already-normalized input unchanged', () => {
    expect(normalizeInterest('cooking')).toBe('cooking');
  });
});

describe('isDuplicate', () => {
  it('detects an exact-case duplicate', () => {
    expect(isDuplicate('Pickleball', [pickleball, hiking])).toBe(true);
  });

  it('detects a case-insensitive duplicate', () => {
    expect(isDuplicate('PICKLEBALL', [pickleball])).toBe(true);
  });

  it('detects a whitespace-padded duplicate', () => {
    expect(isDuplicate('  pickleball  ', [pickleball])).toBe(true);
  });

  it('returns false for a genuinely new interest', () => {
    expect(isDuplicate('Fermented Foods', [pickleball, hiking])).toBe(false);
  });

  it('returns false when the existing list is empty', () => {
    expect(isDuplicate('Pickleball', [])).toBe(false);
  });
});

describe('isInappropriate', () => {
  it('flags a name containing a blocked term', () => {
    expect(isInappropriate('badword hobby')).toBe(true);
  });

  it('flags blocked terms regardless of case', () => {
    expect(isInappropriate('BADWORD')).toBe(true);
  });

  it('passes a clean interest name', () => {
    expect(isInappropriate('Fermented Foods')).toBe(false);
  });

  it('passes an empty string without throwing', () => {
    expect(isInappropriate('')).toBe(false);
  });
});

describe('subscribeToInterest', () => {
  it('adds a new interest to an empty list', () => {
    const result = subscribeToInterest(pickleball, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pickleball');
  });

  it('sets active = true on subscription', () => {
    const result = subscribeToInterest(pickleball, []);
    expect(result[0].active).toBe(true);
  });

  it('does not add a duplicate subscription', () => {
    const result = subscribeToInterest(pickleball, [pickleball]);
    expect(result).toHaveLength(1);
  });

  it('allows subscribing up to the 20th interest (boundary)', () => {
    const nineteen = Array.from({ length: 19 }, (_, i) => makeInterest(`i_${i}`, `Interest ${i}`));
    const result = subscribeToInterest(pickleball, nineteen);
    expect(result).toHaveLength(20);
  });

  it('throws when subscribing past the 20-interest limit', () => {
    const full = Array.from({ length: 20 }, (_, i) => makeInterest(`i_${i}`, `Interest ${i}`));
    expect(() => subscribeToInterest(pickleball, full)).toThrow('Interest limit reached');
  });

  it('does not mutate the original list', () => {
    const original = [hiking];
    subscribeToInterest(pickleball, original);
    expect(original).toHaveLength(1);
  });
});

describe('unsubscribeFromInterest', () => {
  it('removes the specified interest by id', () => {
    const result = unsubscribeFromInterest('pickleball', [pickleball, hiking]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('hiking');
  });

  it('returns the list unchanged if the id is not found', () => {
    const result = unsubscribeFromInterest('nonexistent', [pickleball]);
    expect(result).toHaveLength(1);
  });

  it('returns an empty list when unsubscribing the only interest', () => {
    const result = unsubscribeFromInterest('pickleball', [pickleball]);
    expect(result).toHaveLength(0);
  });

  it('does not mutate the original list', () => {
    const original = [pickleball, hiking];
    unsubscribeFromInterest('pickleball', original);
    expect(original).toHaveLength(2);
  });
});

describe('toggleInterestActive', () => {
  it('sets active = false for a currently active interest', () => {
    const result = toggleInterestActive('pickleball', [makeInterest('pickleball', 'Pickleball', true)]);
    expect(result[0].active).toBe(false);
  });

  it('sets active = true for a currently inactive interest', () => {
    const result = toggleInterestActive('pickleball', [makeInterest('pickleball', 'Pickleball', false)]);
    expect(result[0].active).toBe(true);
  });

  it('only toggles the targeted interest, not others', () => {
    const list = [
      makeInterest('pickleball', 'Pickleball', true),
      makeInterest('hiking',     'Hiking',     true),
    ];
    const result = toggleInterestActive('pickleball', list);
    expect(result[0].active).toBe(false);
    expect(result[1].active).toBe(true);
  });

  it('returns the list unchanged if the id is not found', () => {
    const result = toggleInterestActive('nonexistent', [makeInterest('pickleball', 'Pickleball', true)]);
    expect(result[0].active).toBe(true);
  });
});

describe('createInterest', () => {
  it('creates a new interest with the correct shape', () => {
    const result = createInterest('Fermented Foods', [pickleball]);
    expect(result).toMatchObject({ name: 'Fermented Foods', active: true });
    expect(result.id).toBeTruthy();
  });

  it('throws on a duplicate name — case-insensitive', () => {
    expect(() => createInterest('PICKLEBALL', [pickleball])).toThrow('Interest already exists');
  });

  it('throws on an inappropriate name', () => {
    expect(() => createInterest('badword club', [pickleball])).toThrow('inappropriate content');
  });

  it('throws on an empty name', () => {
    expect(() => createInterest('', [])).toThrow('cannot be empty');
  });

  it('throws on a whitespace-only name', () => {
    expect(() => createInterest('   ', [])).toThrow('cannot be empty');
  });
});

describe('getActiveInterests', () => {
  it('returns only active interests', () => {
    const list = [
      makeInterest('pickleball', 'Pickleball', true),
      makeInterest('hiking',     'Hiking',     false),
      makeInterest('cooking',    'Cooking',    true),
    ];
    const result = getActiveInterests(list);
    expect(result).toHaveLength(2);
    expect(result.every(i => i.active)).toBe(true);
  });

  it('returns an empty array when all interests are inactive', () => {
    expect(getActiveInterests([makeInterest('pickleball', 'Pickleball', false)])).toHaveLength(0);
  });
});

// ── Integration Tests ────────────────────────────────────────────────────────

describe('subscribe then unsubscribe full flow', () => {
  it('subscribes two interests then removes one, leaving one active', () => {
    let subscribed = [];
    subscribed = subscribeToInterest(pickleball, subscribed);
    subscribed = subscribeToInterest(hiking, subscribed);
    subscribed = unsubscribeFromInterest('pickleball', subscribed);

    expect(subscribed).toHaveLength(1);
    expect(subscribed[0].id).toBe('hiking');
  });
});

describe('toggle active / inactive flow', () => {
  it('toggling one interest inactive does not affect others in the active list', () => {
    let subscribed = [pickleball, hiking];
    subscribed = toggleInterestActive('pickleball', subscribed);

    const active = getActiveInterests(subscribed);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe('hiking');
  });

  it('re-toggling restores the interest to active', () => {
    let subscribed = [pickleball];
    subscribed = toggleInterestActive('pickleball', subscribed);
    subscribed = toggleInterestActive('pickleball', subscribed);
    expect(subscribed[0].active).toBe(true);
  });
});

describe('create niche interest then subscribe', () => {
  it('full flow: create → subscribe → appears in active list', () => {
    const newInterest = createInterest('Fermented Foods', [pickleball]);
    let subscribed = [];
    subscribed = subscribeToInterest(newInterest, subscribed);

    expect(subscribed).toHaveLength(1);
    expect(getActiveInterests(subscribed)[0].name).toBe('Fermented Foods');
  });
});

describe('duplicate and moderation enforcement', () => {
  it('creating "Pickleball" when "pickleball" already exists is blocked', () => {
    expect(() => createInterest('Pickleball', [pickleball])).toThrow('Interest already exists');
  });

  it('inappropriate interest is blocked before it can be subscribed to', () => {
    expect(() => createInterest('slur1 fans', [pickleball])).toThrow('inappropriate content');
  });

  it('20-limit blocks subscribe even after a valid create', () => {
    const full = Array.from({ length: 20 }, (_, i) => makeInterest(`i_${i}`, `Interest ${i}`));
    const newInterest = createInterest('Fermented Foods', []);
    expect(() => subscribeToInterest(newInterest, full)).toThrow('Interest limit reached');
  });
});
