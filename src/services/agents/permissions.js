const memberFor = (message) => {
  if (message.member) {
    return message.member;
  }

  const guild = message.guild;

  if (!guild || typeof guild.member !== 'function') {
    return null;
  }

  return guild.member(message.author) || null;
};

const isAdmin = (message) => {
  if (!message || message.local || !message.guild || !message.author) {
    return false;
  }

  const { guild, author } = message;

  if (guild.ownerID && String(guild.ownerID) === String(author.id)) {
    return true;
  }

  const member = memberFor(message);

  return !!(member
    && typeof member.hasPermission === 'function'
    && member.hasPermission('ADMINISTRATOR'));
};

const ownerIdOf = (agent) => {
  if (!agent) {
    return null;
  }

  if (agent.ownerId) {
    return agent.ownerId;
  }

  if (agent.owner && typeof agent.owner === 'object') {
    return agent.owner.id || null;
  }

  return typeof agent.owner === 'string' ? agent.owner : null;
};

const canManage = (message, agent) => {
  if (!message || !message.author || !agent) {
    return false;
  }

  const ownerId = ownerIdOf(agent);

  if (ownerId && String(ownerId) === String(message.author.id)) {
    return true;
  }

  return isAdmin(message);
};

module.exports = {
  canManage,
  isAdmin,
};
