import { describe, it, expect } from 'vitest';
import {
  validateMessage,
  splitMessage,
  acceptInvite,
  declineInvite,
  sendMessage,
  markRead,
  MAX_MESSAGE_LENGTH,
} from '../src/messageLogic.js';

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
  unread: 2,
  time: '2m',
  messages: [
    { from: 'them', text: 'Hey! Have you been to the new gym?', time: '2:30 PM' },
  ],
};

// ── Unit Tests ───────────────────────────────────────────────────────────────

describe('validateMessage', () => {
  it('rejects an empty string', () => {
    const result = validateMessage('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a whitespace-only string', () => {
    const result = validateMessage('   ');
    expect(result.valid).toBe(false);
  });

  it('accepts a normal message', () => {
    const result = validateMessage('Hey! Want to go climbing this weekend?');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts a message exactly at the 1024-character limit', () => {
    const text = 'a'.repeat(MAX_MESSAGE_LENGTH);
    const result = validateMessage(text);
    expect(result.valid).toBe(true);
  });

  it('rejects a message over the 1024-character limit', () => {
    const text = 'a'.repeat(MAX_MESSAGE_LENGTH + 1);
    const result = validateMessage(text);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/1024/);
  });
});

describe('splitMessage', () => {
  it('returns a single chunk for a short message', () => {
    const chunks = splitMessage('Hello!');
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe('Hello!');
  });

  it('splits a message over 1024 characters into two chunks', () => {
    const text = 'a'.repeat(MAX_MESSAGE_LENGTH + 100);
    const chunks = splitMessage(text);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(MAX_MESSAGE_LENGTH);
    expect(chunks[1]).toHaveLength(100);
  });

  it('splits a very long message into the correct number of chunks', () => {
    const text = 'x'.repeat(MAX_MESSAGE_LENGTH * 3);
    const chunks = splitMessage(text);
    expect(chunks).toHaveLength(3);
  });
});

describe('acceptInvite', () => {
  it('removes the invite from the invites list', () => {
    const { invites } = acceptInvite([mockInvite], [], 'inv-1');
    expect(invites).toHaveLength(0);
  });

  it('adds a new conversation to the conversations list', () => {
    const { conversations } = acceptInvite([mockInvite], [], 'inv-1');
    expect(conversations).toHaveLength(1);
    expect(conversations[0].name).toBe('Jordan Kim');
  });

  it('new conversation starts with an acceptance message', () => {
    const { conversations } = acceptInvite([mockInvite], [], 'inv-1');
    expect(conversations[0].messages[0].text).toMatch(/thanks for accepting/i);
  });

  it('prepends the new conversation so it appears first', () => {
    const existing = [mockConversation];
    const { conversations } = acceptInvite([mockInvite], existing, 'inv-1');
    expect(conversations[0].name).toBe('Jordan Kim');
    expect(conversations[1].name).toBe('Sarah Chen');
  });

  it('does nothing if the invite id does not exist', () => {
    const { invites, conversations } = acceptInvite([mockInvite], [], 'nonexistent');
    expect(invites).toHaveLength(1);
    expect(conversations).toHaveLength(0);
  });
});

describe('declineInvite', () => {
  it('removes the invite from the list', () => {
    const result = declineInvite([mockInvite], 'inv-1');
    expect(result).toHaveLength(0);
  });

  it('does not add any conversation', () => {
    // declineInvite only returns updated invites, no conversations side-effect
    const result = declineInvite([mockInvite], 'inv-1');
    expect(result).toEqual([]);
  });

  it('leaves other invites untouched', () => {
    const otherInvite = { ...mockInvite, id: 'inv-2', name: 'Alex Rivera' };
    const result = declineInvite([mockInvite, otherInvite], 'inv-1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alex Rivera');
  });
});

describe('sendMessage', () => {
  it('appends the message to the correct conversation', () => {
    const updated = sendMessage([mockConversation], 'c-1', 'See you there!');
    const convo = updated.find(c => c.id === 'c-1');
    expect(convo.messages).toHaveLength(2);
    expect(convo.messages[1].text).toBe('See you there!');
    expect(convo.messages[1].from).toBe('me');
  });

  it('trims whitespace from the message', () => {
    const updated = sendMessage([mockConversation], 'c-1', '  hello  ');
    const convo = updated.find(c => c.id === 'c-1');
    const last = convo.messages[convo.messages.length - 1];
    expect(last.text).toBe('hello');
  });

  it('does not modify other conversations', () => {
    const otherConvo = { ...mockConversation, id: 'c-2', name: 'Marcus Johnson', messages: [] };
    const updated = sendMessage([mockConversation, otherConvo], 'c-1', 'Hey!');
    const other = updated.find(c => c.id === 'c-2');
    expect(other.messages).toHaveLength(0);
  });

  it('ignores empty messages', () => {
    const updated = sendMessage([mockConversation], 'c-1', '   ');
    const convo = updated.find(c => c.id === 'c-1');
    expect(convo.messages).toHaveLength(1); // unchanged
  });
});

describe('markRead', () => {
  it('sets unread to 0 for the target conversation', () => {
    const updated = markRead([mockConversation], 'c-1');
    expect(updated.find(c => c.id === 'c-1').unread).toBe(0);
  });

  it('does not affect other conversations', () => {
    const otherConvo = { ...mockConversation, id: 'c-2', unread: 5 };
    const updated = markRead([mockConversation, otherConvo], 'c-1');
    expect(updated.find(c => c.id === 'c-2').unread).toBe(5);
  });
});
