import { describe, it, expect } from 'vitest';
import {
  BIO_MAX_LENGTH,
  MAX_EQUIPPED_BADGES,
  getBioValidation,
  canSaveProfile,
  updateProfileField,
  toggleSocial,
  removeInterest,
  toggleShareLocation,
  toggleBadgeEquipped,
  getEquippedBadges,
  getSaveErrorMessage,
} from '../src/profileLogic.js';
import { F2F_BADGES, F2F_BANNED } from '../src/data.js';

// ── Test data ────────────────────────────────────────────────────────────────

const mockProfile = {
  firstName: 'Petr',
  initials: 'PA',
  bio: "Hi, I'm Petr the Anteater!",
  region: 'Irvine, CA',
  radius: 75,
  shareLocation: true,
  interests: ['Skiing', 'Hiking', 'Crocheting'],
  socials: { instagram: true, twitter: true, tiktok: false, discord: true },
  equipped: ['pioneer', 'connector'],
};

// ── Unit Tests ───────────────────────────────────────────────────────────────

describe('getBioValidation', () => {
  it('accepts a bio within the character limit', () => {
    const result = getBioValidation(mockProfile.bio, F2F_BANNED);
    expect(result.overLimit).toBe(false);
    expect(result.flagged).toBeNull();
    expect(result.length).toBe(mockProfile.bio.length);
  });

  it('flags bio over 255 characters', () => {
    const longBio = 'a'.repeat(BIO_MAX_LENGTH + 1);
    const result = getBioValidation(longBio, F2F_BANNED);
    expect(result.overLimit).toBe(true);
    expect(result.length).toBe(BIO_MAX_LENGTH + 1);
  });

  it('accepts bio exactly at 255 characters', () => {
    const bio = 'a'.repeat(BIO_MAX_LENGTH);
    const result = getBioValidation(bio, F2F_BANNED);
    expect(result.overLimit).toBe(false);
  });

  it('detects banned words case-insensitively', () => {
    const result = getBioValidation('I really HATE this app', F2F_BANNED);
    expect(result.flagged).toBe('hate');
  });

  it('detects banned words embedded in longer text', () => {
    const result = getBioValidation('stop being such an idiot please', F2F_BANNED);
    expect(result.flagged).toBe('idiot');
  });
});

describe('canSaveProfile', () => {
  it('allows save when bio is valid and not saving', () => {
    const { overLimit, flagged } = getBioValidation(mockProfile.bio, F2F_BANNED);
    expect(canSaveProfile({ overLimit, flagged, saving: false })).toBe(true);
  });

  it('blocks save when bio is over limit', () => {
    expect(canSaveProfile({ overLimit: true, flagged: null, saving: false })).toBe(false);
  });

  it('blocks save when bio contains banned content', () => {
    expect(canSaveProfile({ overLimit: false, flagged: 'nsfw', saving: false })).toBe(false);
  });

  it('blocks save while a save is in progress', () => {
    expect(canSaveProfile({ overLimit: false, flagged: null, saving: true })).toBe(false);
  });
});

describe('updateProfileField', () => {
  it('updates a field without mutating the original', () => {
    const updated = updateProfileField(mockProfile, 'radius', 50);
    expect(updated.radius).toBe(50);
    expect(mockProfile.radius).toBe(75);
  });

  it('updates bio text', () => {
    const updated = updateProfileField(mockProfile, 'bio', 'New bio');
    expect(updated.bio).toBe('New bio');
  });
});

describe('toggleSocial', () => {
  it('toggles a platform off', () => {
    const result = toggleSocial(mockProfile.socials, 'instagram');
    expect(result.instagram).toBe(false);
    expect(result.twitter).toBe(true);
  });

  it('toggles a platform on', () => {
    const result = toggleSocial(mockProfile.socials, 'tiktok');
    expect(result.tiktok).toBe(true);
  });

  it('does not mutate the original socials object', () => {
    const original = { ...mockProfile.socials };
    toggleSocial(mockProfile.socials, 'discord');
    expect(mockProfile.socials).toEqual(original);
  });
});

describe('removeInterest', () => {
  it('removes a single interest', () => {
    const result = removeInterest(mockProfile.interests, 'Hiking');
    expect(result).toEqual(['Skiing', 'Crocheting']);
    expect(result).toHaveLength(2);
  });

  it('returns unchanged list if interest is not present', () => {
    const result = removeInterest(mockProfile.interests, 'Surfing');
    expect(result).toEqual(mockProfile.interests);
  });
});

describe('toggleShareLocation', () => {
  it('turns location sharing off', () => {
    const result = toggleShareLocation(mockProfile);
    expect(result.shareLocation).toBe(false);
  });

  it('turns location sharing back on', () => {
    const off = toggleShareLocation(mockProfile);
    const on = toggleShareLocation(off);
    expect(on.shareLocation).toBe(true);
  });
});

describe('toggleBadgeEquipped', () => {
  it('equips an earned badge not yet equipped', () => {
    const result = toggleBadgeEquipped(mockProfile, 'explorer', true);
    expect(result.equipped).toContain('explorer');
    expect(result.equipped).toHaveLength(3);
  });

  it('unequips an already-equipped badge', () => {
    const result = toggleBadgeEquipped(mockProfile, 'pioneer', true);
    expect(result.equipped).not.toContain('pioneer');
    expect(result.equipped).toContain('connector');
  });

  it('does not equip when badge is not earned', () => {
    const result = toggleBadgeEquipped(mockProfile, 'social', false);
    expect(result.equipped).toEqual(mockProfile.equipped);
  });

  it('does not exceed the 5-badge cap', () => {
    let profile = {
      ...mockProfile,
      equipped: ['pioneer', 'connector', 'explorer', 'streak', 'social'],
    };
    const result = toggleBadgeEquipped(profile, 'climber', true);
    expect(result.equipped).toHaveLength(MAX_EQUIPPED_BADGES);
    expect(result.equipped).not.toContain('climber');
  });
});

describe('getEquippedBadges', () => {
  it('returns only equipped badge definitions', () => {
    const result = getEquippedBadges(F2F_BADGES, mockProfile.equipped);
    expect(result).toHaveLength(2);
    expect(result.map(b => b.id)).toEqual(['pioneer', 'connector']);
  });

  it('returns empty array when nothing is equipped', () => {
    expect(getEquippedBadges(F2F_BADGES, [])).toHaveLength(0);
  });
});

describe('getSaveErrorMessage', () => {
  it('uses the error message when present', () => {
    expect(getSaveErrorMessage(new Error('Network timeout'))).toBe('Network timeout');
  });

  it('returns a default message for unknown errors', () => {
    expect(getSaveErrorMessage({})).toBe('Could not save. Please try again.');
  });
});

// ── Integration Tests ─────────────────────────────────────────────────────────

describe('Integration: edit profile then save', () => {
  it('valid bio edits allow save; invalid bio blocks save', () => {
    let profile = { ...mockProfile };
    profile = updateProfileField(profile, 'bio', 'Updated bio — looking for climbing partners!');
    const valid = getBioValidation(profile.bio, F2F_BANNED);
    expect(canSaveProfile({ ...valid, saving: false })).toBe(true);

    profile = updateProfileField(profile, 'bio', 'a'.repeat(BIO_MAX_LENGTH + 10));
    const invalid = getBioValidation(profile.bio, F2F_BANNED);
    expect(canSaveProfile({ ...invalid, saving: false })).toBe(false);
  });

  it('full flow — tweak socials, radius, interests, then verify save eligibility', () => {
    let profile = { ...mockProfile };

    profile = updateProfileField(profile, 'socials', toggleSocial(profile.socials, 'tiktok'));
    expect(profile.socials.tiktok).toBe(true);

    profile = updateProfileField(profile, 'radius', 100);
    expect(profile.radius).toBe(100);

    profile = updateProfileField(profile, 'interests', removeInterest(profile.interests, 'Crocheting'));
    expect(profile.interests).toHaveLength(2);

    const { overLimit, flagged } = getBioValidation(profile.bio, F2F_BANNED);
    expect(canSaveProfile({ overLimit, flagged, saving: false })).toBe(true);
  });
});

describe('Integration: badge equip workflow', () => {
  it('equip up to cap, then further equips are rejected', () => {
    let profile = { ...mockProfile, equipped: [] };

    for (const id of ['pioneer', 'connector', 'explorer', 'streak']) {
      profile = toggleBadgeEquipped(profile, id, true);
    }
    expect(profile.equipped).toHaveLength(4);

    profile = toggleBadgeEquipped(profile, 'social', true);
    expect(profile.equipped).toHaveLength(5);

    profile = toggleBadgeEquipped(profile, 'climber', true);
    expect(profile.equipped).toHaveLength(5);
    expect(profile.equipped).not.toContain('climber');
  });

  it('equipped badges list stays in sync after toggle', () => {
    let profile = toggleBadgeEquipped(mockProfile, 'explorer', true);
    const equipped = getEquippedBadges(F2F_BADGES, profile.equipped);
    expect(equipped.map(b => b.id)).toContain('explorer');

    profile = toggleBadgeEquipped(profile, 'explorer', true);
    const afterUnequip = getEquippedBadges(F2F_BADGES, profile.equipped);
    expect(afterUnequip.map(b => b.id)).not.toContain('explorer');
  });
});

describe('Integration: location sharing toggle', () => {
  it('toggle off then on preserves other profile fields', () => {
    let profile = toggleShareLocation(mockProfile);
    expect(profile.shareLocation).toBe(false);
    expect(profile.region).toBe(mockProfile.region);
    expect(profile.radius).toBe(mockProfile.radius);

    profile = toggleShareLocation(profile);
    expect(profile.shareLocation).toBe(true);
    expect(profile.bio).toBe(mockProfile.bio);
  });
});
