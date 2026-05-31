import { describe, it, expect } from 'vitest';
import {
  filterLeaderboard,
  getEntryDisplay,
  hideBlockedUser,
  getRankBadgeType,
  getTrendLabel,
  sortByPoints,
} from '../src/leaderboardLogic.js';

// ── Test data ────────────────────────────────────────────────────────────────

const board = [
  { rank: 1, name: 'Sarah Chen',     points: 2850, trend: 'up'   },
  { rank: 2, name: 'Marcus Johnson', points: 2720, trend: 'flat' },
  { rank: 3, name: 'Emma Wilson',    points: 2580, trend: 'up'   },
  { rank: 4, name: 'Alex Rivera',    points: 2100, trend: 'down' },
];

// ── Unit Tests ───────────────────────────────────────────────────────────────

describe('filterLeaderboard', () => {
  it('returns the full board when nothing is hidden', () => {
    expect(filterLeaderboard(board, [])).toHaveLength(4);
  });

  it('removes a hidden user from the board', () => {
    const result = filterLeaderboard(board, ['Sarah Chen']);
    expect(result).toHaveLength(3);
    expect(result.find(p => p.name === 'Sarah Chen')).toBeUndefined();
  });

  it('removes multiple hidden users', () => {
    const result = filterLeaderboard(board, ['Sarah Chen', 'Emma Wilson']);
    expect(result).toHaveLength(2);
  });

  it('returns empty array if all users are hidden', () => {
    const names = board.map(p => p.name);
    expect(filterLeaderboard(board, names)).toHaveLength(0);
  });
});

describe('getEntryDisplay', () => {
  it('shows full details for a non-blocked user', () => {
    const display = getEntryDisplay(board[0], [], []);
    expect(display.isBlocked).toBe(false);
    expect(display.showDetails).toBe(true);
    expect(display.displayName).toBe('Sarah Chen');
    expect(display.opacity).toBe(1);
  });

  it('hides details and replaces name for a blocked user', () => {
    const display = getEntryDisplay(board[0], ['Sarah Chen'], []);
    expect(display.isBlocked).toBe(true);
    expect(display.displayName).toBe('Blocked user');
    expect(display.showDetails).toBe(false);
    expect(display.opacity).toBe(0.45);
  });

  it('shows "Tap to hide" hint for blocked users', () => {
    const display = getEntryDisplay(board[0], ['Sarah Chen'], []);
    expect(display.tapToHide).toBe(true);
  });

  it('marks hidden users correctly', () => {
    const display = getEntryDisplay(board[0], ['Sarah Chen'], ['Sarah Chen']);
    expect(display.isHidden).toBe(true);
  });
});

describe('hideBlockedUser', () => {
  it('adds a blocked user to the hidden list', () => {
    const result = hideBlockedUser([], 'Sarah Chen');
    expect(result).toContain('Sarah Chen');
  });

  it('does not add the same user twice', () => {
    const result = hideBlockedUser(['Sarah Chen'], 'Sarah Chen');
    expect(result).toHaveLength(1);
  });

  it('preserves existing hidden users when adding a new one', () => {
    const result = hideBlockedUser(['Marcus Johnson'], 'Sarah Chen');
    expect(result).toHaveLength(2);
    expect(result).toContain('Marcus Johnson');
    expect(result).toContain('Sarah Chen');
  });
});

describe('getRankBadgeType', () => {
  it('returns gold for rank 1', () => {
    expect(getRankBadgeType(1)).toBe('gold');
  });

  it('returns silver for rank 2', () => {
    expect(getRankBadgeType(2)).toBe('silver');
  });

  it('returns bronze for rank 3', () => {
    expect(getRankBadgeType(3)).toBe('bronze');
  });

  it('returns number for ranks below 3', () => {
    expect(getRankBadgeType(4)).toBe('number');
    expect(getRankBadgeType(100)).toBe('number');
  });
});

describe('getTrendLabel', () => {
  it('returns rising for up trend', () => {
    expect(getTrendLabel('up')).toBe('rising');
  });

  it('returns falling for down trend', () => {
    expect(getTrendLabel('down')).toBe('falling');
  });

  it('returns steady for flat trend', () => {
    expect(getTrendLabel('flat')).toBe('steady');
  });
});

describe('sortByPoints', () => {
  it('sorts entries by points descending', () => {
    const shuffled = [board[2], board[0], board[3], board[1]];
    const sorted = sortByPoints(shuffled);
    expect(sorted[0].points).toBe(2850);
    expect(sorted[1].points).toBe(2720);
    expect(sorted[2].points).toBe(2580);
    expect(sorted[3].points).toBe(2100);
  });

  it('does not mutate the original array', () => {
    const original = [...board];
    sortByPoints(board);
    expect(board[0].name).toBe(original[0].name);
  });
});
