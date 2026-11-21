const { agentsEnabled, cooldown, llmChatChannels } = require('../../config/bot');
const { sendMessageAnswer } = require('../services/Discord');
const { HELP_TEXT, formatAgentList } = require('../services/agents/help');
const { canManage, isAdmin } = require('../services/agents/permissions');
const {
  AgentInputError, parseCreate, parseUpdate, parseCancel,
} = require('../services/agents/parser');

const ERROR_MESSAGE = 'Não foi possível concluir o pedido.';
const NOT_FOUND = 'Não encontrei esse agente com esse nome.';
const NOT_ALLOWED = 'Só o dono ou um administrador pode alterar esse agente.';
const NO_GUILD = 'Os agentes só podem ser geridos num servidor.';
const NO_SERVICE = 'A funcionalidade de agentes está indisponível.';

const guildIdFor = message => (message.guild && message.guild.id)
  || (message.local ? 'local' : null);

const serviceFor = message => (message && message.client && message.client.agents) || null;

const repositoryMethod = (repository, ...names) => {
  const name = names.find(candidate => repository && typeof repository[candidate] === 'function');

  if (!name) {
    throw new Error('Repositório de agentes indisponível');
  }

  return repository[name].bind(repository);
};

const usageError = async (message, text) => sendMessageAnswer(message, `${text}\n\n${HELP_TEXT}`);

const unexpectedError = async (message, error) => {
  console.error(error);
  await usageError(message, ERROR_MESSAGE);
};

const armAgent = async (service, agent) => {
  const kind = agent && (agent.kind || (agent.schedule && agent.schedule.kind));

  if (kind === 'now') {
    await service.runner.runAgent(agent);

    const update = repositoryMethod(service.repository, 'updateAgent', 'update');
    await update(agent.id, { status: 'done', lastRunAt: new Date() });
    return;
  }

  await service.scheduler.scheduleAgent(agent);
};

const listAgents = async (message, service, guildId, ownerId) => {
  const filter = ownerId ? { guildId, ownerId } : { guildId };
  const list = repositoryMethod(service.repository, 'listAgents', 'list');
  const agents = await list(filter);

  await sendMessageAnswer(message, formatAgentList(agents, {
    viewerId: message.author && message.author.id,
    isAdmin: isAdmin(message),
    isLocal: !!message.local,
  }));
};

const inputOptions = (message, guildId) => ({
  now: () => new Date(),
  guildId,
  channelId: message.channel && message.channel.id,
  ownerId: message.author && message.author.id,
  local: !!message.local,
});

const findAgent = async (message, service, nameKey, guildId) => {
  const getAgent = repositoryMethod(service.repository, 'getAgent', 'get');
  const owned = await getAgent({
    guildId,
    nameKey,
    ownerId: message.author && message.author.id,
  });

  if (owned || !isAdmin(message)) {
    return owned;
  }

  return getAgent({ guildId, nameKey });
};

const createAgent = async (message, service, tokens, options) => {
  const input = parseCreate(tokens, options);
  const create = repositoryMethod(service.repository, 'create', 'createAgent');
  const agent = await create({
    guildId: options.guildId,
    channelId: options.channelId,
    ownerId: options.ownerId,
    name: input.name,
    nameKey: input.nameKey,
    prompt: input.prompt,
    schedule: input.schedule,
    ...input.schedule,
  });

  await armAgent(service, agent);
  await sendMessageAnswer(message, `Agente **${(agent && agent.name) || input.name}** criado com sucesso.`);
};

const updateAgent = async (message, service, tokens, options) => {
  const input = parseUpdate(tokens, options);
  const current = await findAgent(message, service, input.nameKey, options.guildId);

  if (!current) {
    await usageError(message, NOT_FOUND);
    return;
  }

  if (!canManage(message, current)) {
    await usageError(message, NOT_ALLOWED);
    return;
  }

  const patch = {};

  if (input.name !== undefined) {
    patch.name = input.name;
  }

  if (input.nameKey !== undefined) {
    patch.nameKey = input.nameKey;
  }

  if (input.prompt !== undefined) {
    patch.prompt = input.prompt;
  }

  if (input.schedule !== undefined) {
    patch.schedule = input.schedule;
  }

  const update = repositoryMethod(service.repository, 'updateAgent', 'update');
  const updated = await update(current.id, patch);

  if (input.schedule !== undefined) {
    await service.scheduler.cancelAgent(current.id);
    await armAgent(service, updated || current);
  }

  await sendMessageAnswer(message, `Agente **${input.name || current.name}** atualizado.`);
};

const cancelAgent = async (message, service, tokens, options) => {
  const input = parseCancel(tokens);
  const current = await findAgent(message, service, input.nameKey, options.guildId);

  if (!current) {
    await usageError(message, NOT_FOUND);
    return;
  }

  if (!canManage(message, current)) {
    await usageError(message, NOT_ALLOWED);
    return;
  }

  const remove = repositoryMethod(service.repository, 'deleteAgent', 'delete');

  await service.scheduler.cancelAgent(current.id);
  await remove({
    guildId: options.guildId,
    nameKey: input.nameKey,
    ownerId: current.ownerId,
  });
  await sendMessageAnswer(message, `Agente **${current.name || input.name}** cancelado.`);
};

module.exports = {
  name: 'agent',
  active: agentsEnabled,
  args: true,
  cooldown,
  limitToChannels: llmChatChannels,
  usage: HELP_TEXT,

  async execute(message, args) {
    const tokens = Array.isArray(args)
      ? args.slice()
      : String(args || '').split(' ').filter(token => token.length > 0);
    const subcommand = (tokens.shift() || '').toLowerCase();

    if (!subcommand || subcommand === '--help' || subcommand === 'help') {
      await sendMessageAnswer(message, HELP_TEXT);
      return;
    }

    const service = serviceFor(message);

    if (!service) {
      await usageError(message, NO_SERVICE);
      return;
    }

    const guildId = guildIdFor(message);

    if (!guildId) {
      await usageError(message, NO_GUILD);
      return;
    }

    if (!['create', 'list', 'update', 'cancel', 'delete', 'remove'].includes(subcommand)) {
      await usageError(message, 'Subcomando desconhecido.');
      return;
    }

    const options = inputOptions(message, guildId);

    try {
      if (subcommand === 'list') {
        await listAgents(message, service, guildId, message.author && message.author.id);
      } else if (subcommand === 'create') {
        await createAgent(message, service, tokens, options);
      } else if (subcommand === 'update') {
        await updateAgent(message, service, tokens, options);
      } else {
        await cancelAgent(message, service, tokens, options);
      }
    } catch (error) {
      if (error instanceof AgentInputError || (error && error.name === 'AgentInputError')) {
        await usageError(message, error.message || 'Argumentos inválidos.');
        return;
      }

      await unexpectedError(message, error);
    }
  },
};

module.exports.ERROR_MESSAGE = ERROR_MESSAGE;
module.exports.guildIdFor = guildIdFor;
