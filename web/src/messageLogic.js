// Pure logic extracted from messages.jsx
// These functions contain the business rules that need to be tested.

export const MAX_MESSAGE_LENGTH = 1024;

/**
 * Validates a message before sending.
 * Returns { valid: boolean, error?: string }
 */
export function validateMessage(text) {
  if (!text || !text.trim()) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (text.trim().length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message exceeds ${MAX_MESSAGE_LENGTH} character limit` };
  }
  return { valid: true };
}

/**
 * Splits a message that exceeds MAX_MESSAGE_LENGTH into chunks.
 * Mirrors the spec requirement: messages over 1024 chars are sent in split messages.
 */
export function splitMessage(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_MESSAGE_LENGTH) {
    chunks.push(text.slice(i, i + MAX_MESSAGE_LENGTH));
  }
  return chunks;
}

/**
 * Accepts a chat invite: removes from invites, adds to conversations.
 */
export function acceptInvite(invites, conversations, inviteId) {
  const invite = invites.find(iv => iv.id === inviteId);
  if (!invite) return { invites, conversations };

  const newConvo = {
    id: 'c-' + invite.id,
    name: invite.name,
    initials: invite.initials,
    distance: invite.distance,
    shared: invite.shared,
    unread: 0,
    time: 'now',
    messages: [{ from: 'them', text: 'Hey! Thanks for accepting 🙌', time: 'now' }],
  };

  return {
    invites: invites.filter(iv => iv.id !== inviteId),
    conversations: [newConvo, ...conversations],
  };
}

/**
 * Declines a chat invite: removes from invites only.
 */
export function declineInvite(invites, inviteId) {
  return invites.filter(iv => iv.id !== inviteId);
}

/**
 * Adds a new message to a conversation.
 */
export function sendMessage(conversations, convoId, text) {
  const trimmed = text.trim();
  if (!trimmed) return conversations;
  const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return conversations.map(c =>
    c.id === convoId
      ? { ...c, time: 'now', messages: [...c.messages, { from: 'me', text: trimmed, time: now }] }
      : c
  );
}

/**
 * Marks a conversation as read (unread = 0).
 */
export function markRead(conversations, convoId) {
  return conversations.map(c => c.id === convoId ? { ...c, unread: 0 } : c);
}
