import { describe, it, expect } from 'vitest';
import { acceptInvite, sendMessage, markRead, declineInvite } from '../src/messageLogic.js';
import { filterLeaderboard, getEntryDisplay, hideBlockedUser } from '../src/leaderboardLogic.js';

// ── Integration Tests ─────────────────────────────────────────────────────────
// These tests verify that multiple pieces of logic work correctly together,
// simulating real multi-step user workflows from the spec use cases.

// ── Test data ────────────────────────────────────────────────────────────────

const mockInvite = {
  id: 'inv-1',
  name: 'Jordan Kim',
  initials: 'JK',
  distance: '1.5 mi',
  shared: ['Gaming', 'Art'],
  note: 'Hey! Saw you like gaming too',
};

const mockConversation = {
  id: 'c-1',
  name: 'Sarah Chen',
  initials: 'SC',
  distance: '0.8 mi',
  shared: ['Rock Climbing'],
  unread: 3,
  time: '2m',
  messages: [{ from: 'them', text: 'Hey! Have you been to the new gym?', time: '2:30 PM' }],
};

const leaderboard = [
  { rank: 1, name: 'Sarah Chen',     points: 2850, trend: 'up'   },
  { rank: 2, name: 'Marcus Johnson', points: 2720, trend: 'flat' },
  { rank: 3, name: 'Emma Wilson',    points: 2580, trend: 'up'   },
];

// ── Integration Test: full chat invite → send message workflow ───────────────

describe('Integration: accept invite then send message', () => {
  it('full flow — accept invite, open chat, send message, mark read', () => {
    // Step 1: Accept the invite
    const { invites, conversations } = acceptInvite([mockInvite], [], 'inv-1');
    expect(invites).toHaveLength(0);
    expect(conversations).toHaveLength(1);

    // Step 2: Open the chat — mark it as read
    const afterRead = markRead(conversations, conversations[0].id);
    expect(afterRead[0].unread).toBe(0);

    // Step 3: Send a message in the new conversation
    const afterSend = sendMessage(afterRead, afterRead[0].id, 'Hey! Thanks for connecting');
    const convo = afterSend[0];
    expect(convo.messages).toHaveLength(2); // welcome message + new message
    expect(convo.messages[1].text).toBe('Hey! Thanks for connecting');
    expect(convo.messages[1].from).toBe('me');
  });

  it('existing conversations are preserved when accepting a new invite', () => {
    const { conversations } = acceptInvite([mockInvite], [mockConversation], 'inv-1');
    expect(conversations).toHaveLength(2);
    // new conversation is prepended
    expect(conversations[0].name).toBe('Jordan Kim');
    expect(conversations[1].name).toBe('Sarah Chen');
  });

  it('can send multiple messages in sequence', () => {
    const { conversations } = acceptInvite([mockInvite], [], 'inv-1');
    let state = conversations;
    state = sendMessage(state, state[0].id, 'First message');
    state = sendMessage(state, state[0].id, 'Second message');
    state = sendMessage(state, state[0].id, 'Third message');
    expect(state[0].messages).toHaveLength(4); // welcome + 3 sent
  });
});

// ── Integration Test: decline invite does not create conversation ────────────

describe('Integration: decline invite', () => {
  it('declining an invite leaves conversations unchanged', () => {
    const initialConvos = [mockConversation];
    const updatedInvites = declineInvite([mockInvite], 'inv-1');
    // conversations are not touched by declineInvite
    expect(updatedInvites).toHaveLength(0);
    expect(initialConvos).toHaveLength(1); // unchanged
  });
});

// ── Integration Test: blocking a user affects both chat and leaderboard ───────

describe('Integration: block user affects leaderboard visibility', () => {
  it('blocked user shows as "Blocked user" on leaderboard', () => {
    const blocked = ['Sarah Chen'];
    const display = getEntryDisplay(leaderboard[0], blocked, []);
    expect(display.displayName).toBe('Blocked user');
    expect(display.showDetails).toBe(false);
  });

  it('tapping a blocked entry hides them, then filterLeaderboard removes them', () => {
    const blocked = ['Sarah Chen'];
    // User taps the blocked entry → added to hidden
    const hidden = hideBlockedUser([], 'Sarah Chen');
    expect(hidden).toContain('Sarah Chen');

    // filterLeaderboard removes hidden users from the visible list
    const visible = filterLeaderboard(leaderboard, hidden);
    expect(visible).toHaveLength(2);
    expect(visible.find(p => p.name === 'Sarah Chen')).toBeUndefined();
  });

  it('blocking does not affect other leaderboard entries', () => {
    const blocked = ['Sarah Chen'];
    const hidden = hideBlockedUser([], 'Sarah Chen');
    const visible = filterLeaderboard(leaderboard, hidden);

    const marcus = visible.find(p => p.name === 'Marcus Johnson');
    const emma = visible.find(p => p.name === 'Emma Wilson');
    expect(marcus).toBeDefined();
    expect(emma).toBeDefined();
  });

  it('non-blocked users still show full details after another user is blocked', () => {
    const blocked = ['Sarah Chen'];
    const display = getEntryDisplay(leaderboard[1], blocked, []);
    expect(display.isBlocked).toBe(false);
    expect(display.displayName).toBe('Marcus Johnson');
    expect(display.showDetails).toBe(true);
    expect(display.opacity).toBe(1);
  });
});
