const { agentsEnabled, cooldown, llmChatChannels } = require('../../config/bot');
const { sendMessageAnswer } = require('../services/Discord');
const { HELP_TEXT, formatAgentList } = require('../services/agents/help');
const { isAdmin } = require('../services/agents/permissions');

const ERROR_MESSAGE = 'Não foi possível concluir o pedido.';
const NO_GUILD = 'Os agentes só podem ser geridos num servidor.';
const NO_SERVICE = 'A funcionalidade de agentes está indisponível.';

const guildIdFor = message => (message.guild && message.guild.id)
  || (message.local ? 'local' : null);

module.exports = {
  name: 'agents',
  active: agentsEnabled,
  args: false,
  cooldown,
  limitToChannels: llmChatChannels,
  usage: HELP_TEXT,

  async execute(message) {
    const service = message && message.client && message.client.agents;

    if (!service) {
      await sendMessageAnswer(message, `${NO_SERVICE}\n\n${HELP_TEXT}`);
      return;
    }

    const guildId = guildIdFor(message);

    if (!guildId) {
      await sendMessageAnswer(message, `${NO_GUILD}\n\n${HELP_TEXT}`);
      return;
    }

    const repository = service.repository || {};
    const list = typeof repository.listAgents === 'function' ? repository.listAgents : repository.list;

    if (typeof list !== 'function') {
      await sendMessageAnswer(message, `${NO_SERVICE}\n\n${HELP_TEXT}`);
      return;
    }

    try {
      const agents = await list.call(repository, { guildId });

      await sendMessageAnswer(message, formatAgentList(agents, {
        viewerId: message.author && message.author.id,
        isAdmin: isAdmin(message),
        isLocal: !!message.local,
      }));
    } catch (error) {
      console.error(error);
      await sendMessageAnswer(message, `${ERROR_MESSAGE}\n\n${HELP_TEXT}`);
    }
  },
};

module.exports.ERROR_MESSAGE = ERROR_MESSAGE;
