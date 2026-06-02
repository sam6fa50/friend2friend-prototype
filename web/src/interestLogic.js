export const MAX_INTERESTS = 20;

const BLOCKED_TERMS = ['slur1', 'slur2', 'badword'];

export function normalizeInterest(name) {
  return name.trim().toLowerCase();
}

export function isDuplicate(newName, existingInterests) {
  const normalized = normalizeInterest(newName);
  return existingInterests.some(i => normalizeInterest(i.name) === normalized);
}

export function isInappropriate(name) {
  const normalized = normalizeInterest(name);
  return BLOCKED_TERMS.some(term => normalized.includes(term));
}

export function subscribeToInterest(interest, subscribedList) {
  if (subscribedList.length >= MAX_INTERESTS) {
    throw new Error('Interest limit reached: maximum 20 interests allowed.');
  }
  if (subscribedList.some(i => i.id === interest.id)) {
    return subscribedList;
  }
  return [...subscribedList, { ...interest, active: true }];
}

export function unsubscribeFromInterest(interestId, subscribedList) {
  return subscribedList.filter(i => i.id !== interestId);
}

export function toggleInterestActive(interestId, subscribedList) {
  return subscribedList.map(i =>
    i.id === interestId ? { ...i, active: !i.active } : i
  );
}

export function createInterest(name, existingInterests) {
  if (!name || name.trim() === '') {
    throw new Error('Interest name cannot be empty.');
  }
  if (isInappropriate(name)) {
    throw new Error('Interest name contains inappropriate content.');
  }
  if (isDuplicate(name, existingInterests)) {
    const match = existingInterests.find(
      i => normalizeInterest(i.name) === normalizeInterest(name)
    );
    throw new Error(`Interest already exists: "${match.name}"`);
  }
  return {
    id: `custom_${normalizeInterest(name).replace(/\s+/g, '_')}`,
    name: name.trim(),
    active: true,
  };
}

export function getActiveInterests(subscribedList) {
  return subscribedList.filter(i => i.active);
}
