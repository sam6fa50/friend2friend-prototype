// Pure logic extracted from leaderboard.jsx
// These functions contain the business rules that need to be tested.

/**
 * Filters out hidden users from the leaderboard.
 * A user is hidden if they were blocked and the viewer clicked "Tap to hide".
 */
export function filterLeaderboard(board, hidden) {
  return board.filter(p => !hidden.includes(p.name));
}

/**
 * Determines how a leaderboard entry should be displayed.
 * Returns display properties based on blocked/hidden state.
 */
export function getEntryDisplay(entry, blocked, hidden) {
  const isBlocked = blocked.includes(entry.name);
  const isHidden = hidden.includes(entry.name);
  return {
    isBlocked,
    isHidden,
    displayName: isBlocked ? 'Blocked user' : entry.name,
    showDetails: !isBlocked,
    opacity: isBlocked ? 0.45 : 1,
    tapToHide: isBlocked,
  };
}

/**
 * Adds a user to the hidden list (called when tapping a blocked entry).
 */
export function hideBlockedUser(hidden, name) {
  if (hidden.includes(name)) return hidden;
  return [...hidden, name];
}

/**
 * Returns the rank badge type for a given rank number.
 */
export function getRankBadgeType(rank) {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return 'number';
}

/**
 * Returns the trend direction label for display.
 */
export function getTrendLabel(trend) {
  if (trend === 'up') return 'rising';
  if (trend === 'down') return 'falling';
  return 'steady';
}

/**
 * Sorts leaderboard entries by points descending.
 */
export function sortByPoints(board) {
  return [...board].sort((a, b) => b.points - a.points);
}
