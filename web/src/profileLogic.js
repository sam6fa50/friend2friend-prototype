// Pure logic extracted from profile.jsx
// These functions contain the business rules that need to be tested.

export const BIO_MAX_LENGTH = 255;
export const MAX_EQUIPPED_BADGES = 5;
export const MAX_INTERESTS = 20;

/**
 * Returns bio validation state for the profile editor.
 */
export function getBioValidation(bio, bannedWords) {
  const overLimit = bio.length > BIO_MAX_LENGTH;
  const flagged = bannedWords.find(w => bio.toLowerCase().includes(w)) ?? null;
  return { overLimit, flagged, length: bio.length };
}

/**
 * Whether the user can save the profile (bio valid and not mid-save).
 */
export function canSaveProfile({ overLimit, flagged, saving }) {
  return !overLimit && !flagged && !saving;
}

/**
 * Immutable update of a single profile field.
 */
export function updateProfileField(profile, key, value) {
  return { ...profile, [key]: value };
}

/**
 * Toggles a social platform on/off.
 */
export function toggleSocial(socials, platform) {
  return { ...socials, [platform]: !socials[platform] };
}

/**
 * Removes an interest from the list.
 */
export function removeInterest(interests, interest) {
  return interests.filter(x => x !== interest);
}

/**
 * Toggles location sharing.
 */
export function toggleShareLocation(profile) {
  return updateProfileField(profile, 'shareLocation', !profile.shareLocation);
}

/**
 * Toggles badge equip state. No-op if badge is not earned or cap is reached.
 */
export function toggleBadgeEquipped(profile, badgeId, earned) {
  if (!earned) return profile;
  const equipped = profile.equipped ?? [];
  if (equipped.includes(badgeId)) {
    return { ...profile, equipped: equipped.filter(x => x !== badgeId) };
  }
  if (equipped.length >= MAX_EQUIPPED_BADGES) return profile;
  return { ...profile, equipped: [...equipped, badgeId] };
}

/**
 * Returns badge definitions that are currently equipped.
 */
export function getEquippedBadges(allBadges, equippedIds = []) {
  return allBadges.filter(b => equippedIds.includes(b.id));
}

/**
 * Formats a save error for display.
 */
export function getSaveErrorMessage(err) {
  return err?.message || 'Could not save. Please try again.';
}
