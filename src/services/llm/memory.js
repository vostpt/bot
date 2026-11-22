const TTL_MS = 15 * 60 * 1000;
const MAX_TURNS = 10;
const MAX_MESSAGE_CHARS = 2000;

const conversations = new Map();

const buildKey = (channelId, authorId) => `${channelId}:${authorId}`;

const clearExpired = (now = Date.now()) => {
  conversations.forEach((conversation, key) => {
    if (now - conversation.updatedAt >= TTL_MS) {
      conversations.delete(key);
    }
  });
};

const getHistory = (key, now = Date.now()) => {
  clearExpired(now);
  const conversation = conversations.get(String(key));

  if (!conversation) {
    return [];
  }

  return conversation.turns.map((turn) => ({ ...turn }));
};

const append = (key, role, content, now = Date.now()) => {
  if (role !== 'user' && role !== 'assistant') {
    return;
  }

  clearExpired(now);

  const conversationKey = String(key);
  const conversation = conversations.get(conversationKey) || { turns: [], updatedAt: now };
  const text = String(content || '').slice(0, MAX_MESSAGE_CHARS);

  conversation.turns.push({ role, content: text, createdAt: now });

  while (conversation.turns.length > MAX_TURNS) {
    conversation.turns.shift();
  }

  conversation.updatedAt = now;
  conversations.set(conversationKey, conversation);
};

const clear = (key) => {
  conversations.delete(String(key));
};

const resetMemory = () => {
  conversations.clear();
};

module.exports = {
  TTL_MS,
  MAX_TURNS,
  MAX_MESSAGE_CHARS,
  buildKey,
  getHistory,
  append,
  clear,
  clearExpired,
  resetMemory,
};
