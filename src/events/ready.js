const Jobs = require('../jobs');
const { locale } = require('../../config/locale');
const {
  betaMode, chatOnlyMode, agentsEnabled, channels: configuredChannels,
} = require('../../config/bot');
const { sendMessageToChannel } = require('../services/Discord');

const STARTUP_MESSAGE = 'Estou aqui';

const canSend = (client, channel) => {
  if (!channel || channel.type !== 'text') {
    return false;
  }

  if (typeof channel.permissionsFor !== 'function') {
    return true;
  }

  const permissions = channel.permissionsFor(client.user);

  return !permissions || permissions.has('SEND_MESSAGES');
};

const findStartupChannel = (client) => {
  const available = client && client.channels;

  if (!available || typeof available.find !== 'function') {
    return null;
  }

  const mainId = configuredChannels.MAIN_CHANNEL_ID;
  const main = mainId && typeof available.get === 'function' ? available.get(mainId) : null;

  if (canSend(client, main)) {
    return main;
  }

  return available.find(channel => canSend(client, channel)) || null;
};

const restoreAgents = async (client) => {
  if (!agentsEnabled) {
    return;
  }

  try {
    const { createAgentService } = require('../services/agents');

    client.agents = createAgentService(client);
    await client.agents.scheduler.restore();
  } catch (error) {
    console.warn('Não foi possível restaurar os agentes agendados', error && error.message);
  }
};

const announceReady = async (client) => {
  const target = findStartupChannel(client);

  if (!target) {
    console.warn('Não foi possível encontrar um canal para a mensagem de arranque');
    return;
  }

  try {
    await sendMessageToChannel(target, STARTUP_MESSAGE);
    // eslint-disable-next-line no-console
    console.log(`Mensagem de arranque enviada para #${target.name || target.id}`);
  } catch (error) {
    console.warn('Não foi possível enviar a mensagem de arranque');
  }
};

/**
* Start bot scheduled jobs
*
* @param {Client} client
*/
const ready = async (client) => {
  if (chatOnlyMode) {
    // eslint-disable-next-line no-console
    console.log('Chat-only mode enabled; jobs disabled');
  } else if (!betaMode) {
    (new Jobs(client)).startProd();
  } else {
    (new Jobs(client)).startBeta();
    // eslint-disable-next-line no-console
    console.log('Beta mode enabled');
  }

  const currentDate = new Date().toLocaleString(locale);

  // eslint-disable-next-line no-console
  console.log(`READY :: Bot started @ ${currentDate}`);

  await announceReady(client);
  await restoreAgents(client);
};

module.exports = ready;
module.exports.STARTUP_MESSAGE = STARTUP_MESSAGE;
