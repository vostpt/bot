process.env.LLM_CHAT_ONLY = 'true';

jest.mock('../../src/services/Discord', () => ({
  sendMessageToAuthor: jest.fn(),
  sendMessageAnswer: jest.fn(),
  sendMessageToChannel: jest.fn(),
}));

jest.mock('../../src/helpers', () => ({ react: jest.fn() }));
jest.mock('../../src/jobs', () => jest.fn());

const { sendMessageToAuthor, sendMessageToChannel } = require('../../src/services/Discord');
const { react } = require('../../src/helpers');
const Jobs = require('../../src/jobs');
const messageEvent = require('../../src/events/message');
const ready = require('../../src/events/ready');
const { chatOnlyMode, llmChatEnabled } = require('../../config/bot');

const collection = (values = {}) => ({
  filter: (fn) => Object.values(values).filter(fn),
  map: (fn) => Object.values(values).map(fn),
  forEach: (fn) => Object.values(values).forEach(fn),
  find: (fn) => Object.values(values).find(fn),
  has: (key) => Object.prototype.hasOwnProperty.call(values, key),
  get: (key) => values[key],
  set: (key, value) => { values[key] = value; },
});

const buildClient = () => {
  const chatExecute = jest.fn().mockResolvedValue(undefined);
  const otherExecute = jest.fn().mockResolvedValue(undefined);
  const timestamps = {
    has: jest.fn().mockReturnValue(false),
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  return {
    client: {
      user: {},
      commands: collection({
        chat: { name: 'chat', active: true, cooldown: 0, execute: chatExecute },
        all: { name: 'all', active: true, cooldown: 0, execute: otherExecute },
      }),
      triggers: collection({ greetings: { execute: jest.fn() } }),
      cooldowns: collection({ chat: timestamps, all: timestamps }),
    },
    chatExecute,
    otherExecute,
    timestamps,
  };
};

const buildMessage = (content) => ({
  content,
  author: { bot: false, id: 'user-1', username: 'teste', send: jest.fn() },
  channel: { id: 'canal-1', send: jest.fn() },
  isMemberMentioned: jest.fn().mockReturnValue(true),
});

let logSpy;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  delete process.env.LLM_CHAT_ONLY;
});

describe('modo apenas !chat', () => {
  test('a configuração expõe o modo e o chat continua ativo', () => {
    expect(chatOnlyMode).toBe(true);
    expect(llmChatEnabled).toBe(true);
  });

  test('!chat continua a ser despachado, incluindo sem argumentos', async () => {
    const { client, chatExecute } = buildClient();

    await messageEvent(client, buildMessage('!chat Onde há fogo agora?'));
    await messageEvent(client, buildMessage('!chat'));

    expect(chatExecute).toHaveBeenCalledTimes(2);
    expect(chatExecute.mock.calls[1][1]).toEqual([]);
  });

  test('outros comandos, ?commands, menções e triggers não respondem', async () => {
    const { client, otherExecute } = buildClient();

    await messageEvent(client, buildMessage('!all'));
    await messageEvent(client, buildMessage('?commands'));
    await messageEvent(client, buildMessage('Olá VOSTPTia'));

    expect(otherExecute).not.toHaveBeenCalled();
    expect(client.triggers.get('greetings').execute).not.toHaveBeenCalled();
    expect(sendMessageToAuthor).not.toHaveBeenCalled();
    expect(sendMessageToChannel).not.toHaveBeenCalled();
    expect(react).not.toHaveBeenCalled();
  });

  test('jobs não são iniciados no arranque', () => {
    const { client } = buildClient();

    ready(client);

    expect(Jobs).not.toHaveBeenCalled();
  });
});
