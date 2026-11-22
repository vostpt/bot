const { createAgentRunner } = require('./runner');
const { createAgentScheduler } = require('./scheduler');

const ERROR_MESSAGE = 'Infelizmente não te posso responder';

const createAgentService = (client) => {
  const repository = require('./repository');

  const runner = createAgentRunner({
    client,
    chat: require('../llm/orchestrator').runChat,
    resolveDateRange: require('../llm/time').resolveDateRange,
    sendMessageToChannel: require('../Discord').sendMessageToChannel,
    ERROR_MESSAGE,
  });

  const scheduler = createAgentScheduler({
    client,
    repository,
    runner,
  });

  return { repository, runner, scheduler };
};

module.exports = {
  createAgentService,
  ERROR_MESSAGE,
};
