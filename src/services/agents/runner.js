const DEFAULT_ERROR_MESSAGE = 'Infelizmente não te posso responder';

const createAgentRunner = ({
  client,
  chat = (...args) => require('../llm/orchestrator').runChat(...args),
  resolveDateRange = (...args) => require('../llm/time').resolveDateRange(...args),
  sendMessageToChannel = (...args) => require('../Discord').sendMessageToChannel(...args),
  ERROR_MESSAGE = DEFAULT_ERROR_MESSAGE,
} = {}) => {
  const resolveTargets = async (agent) => {
    const channel = client && client.channels && typeof client.channels.get === 'function'
      ? client.channels.get(agent.channelId)
      : null;

    let owner = client && client.users && typeof client.users.get === 'function'
      ? client.users.get(agent.ownerId)
      : null;

    if (!owner && client && typeof client.fetchUser === 'function') {
      owner = await client.fetchUser(agent.ownerId);
    }

    return { channel, owner };
  };

  const deliver = async (target, label, text) => {
    if (!target || typeof target.send !== 'function') {
      console.warn(`[agents] destinatário indisponível: ${label}`);
      return false;
    }

    try {
      await sendMessageToChannel(target, text);
      return true;
    } catch (error) {
      console.error(`[agents] falha ao enviar para ${label}`, error);
      return false;
    }
  };

  const runAgent = async (agent) => {
    let channel = null;
    let owner = null;

    try {
      ({ channel, owner } = await resolveTargets(agent));

      const dateContext = resolveDateRange(agent.prompt);
      const result = await chat({
        question: agent.prompt,
        history: [],
        dateContext,
      });
      const answer = result && typeof result === 'object' ? result.answer : result;

      await deliver(channel, 'canal', answer);
      await deliver(owner, 'utilizador', answer);
    } catch (error) {
      console.error('[agents] falha ao executar agente', error);
      await deliver(channel, 'canal', ERROR_MESSAGE);
      await deliver(owner, 'utilizador', ERROR_MESSAGE);
    }
  };

  return { runAgent };
};

module.exports = {
  createAgentRunner,
  DEFAULT_ERROR_MESSAGE,
};
