jest.mock('../../src/services/Discord', () => ({
  sendMessageToAuthor: jest.fn(),
  sendMessageAnswer: jest.fn(),
  sendMessageToChannel: jest.fn(),
}));

jest.mock('../../src/helpers', () => ({ react: jest.fn() }));

const { sendMessageToAuthor, sendMessageToChannel } = require('../../src/services/Discord');
const { react } = require('../../src/helpers');
const messageEvent = require('../../src/events/message');

const collection = (values = {}) => ({
  filter: (fn) => collection(Object.entries(values).filter(([, value]) => fn(value))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})),
  map: (fn) => Object.values(values).map(fn),
  forEach: (fn) => Object.values(values).forEach(fn),
  find: (fn) => Object.values(values).find(fn),
  has: (key) => Object.prototype.hasOwnProperty.call(values, key),
  get: (key) => values[key],
  set: (key, value) => { values[key] = value; },
});

const buildClient = () => {
  const execute = jest.fn().mockResolvedValue(undefined);
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
        chat: {
          name: 'chat',
          active: true,
          aliases: [],
          usage: '**!chat <pergunta>** - pergunta ao VOSTPTia.',
          cooldown: 0,
          execute,
        },
      }),
      triggers: collection({}),
      cooldowns: collection({ chat: timestamps }),
    },
    execute,
    timestamps,
  };
};

const buildMessage = (content) => ({
  content,
  author: { bot: false, id: 'user-1', username: 'teste', send: jest.fn() },
  channel: { id: 'canal-1', send: jest.fn() },
  isMemberMentioned: jest.fn().mockReturnValue(false),
});

let logSpy;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
});

describe('regressão do processamento de mensagens', () => {
  test('?commands continua por DM e passa a incluir apenas a usage do novo comando', async () => {
    const { client } = buildClient();
    const msg = buildMessage('?commands');

    await messageEvent(client, msg);

    expect(sendMessageToAuthor).toHaveBeenCalledTimes(1);
    expect(sendMessageToAuthor.mock.calls[0][1]).toContain('!chat <pergunta>');
    expect(react).toHaveBeenCalledWith(msg, ['📧', '📥']);
  });

  test('regista a receção da mensagem com origem, canal e conteúdo', async () => {
    const { client } = buildClient();
    const msg = buildMessage('!chat Olá');

    await messageEvent(client, msg);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[DISCORD-MESSAGE]'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('!chat Olá'));
  });

  test('sinaliza mensagens recebidas sem conteúdo', async () => {
    const { client } = buildClient();
    const msg = buildMessage('');

    await messageEvent(client, msg);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('(sem texto'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('len=0'));
  });

  test('!chat é despachado pelo loader existente sem reações do evento', async () => {
    const { client, execute } = buildClient();
    const msg = buildMessage('!chat Onde há fogo agora?');

    await messageEvent(client, msg);

    expect(execute).toHaveBeenCalledWith(msg, ['Onde', 'há', 'fogo', 'agora?']);
    expect(react).not.toHaveBeenCalled();
    expect(sendMessageToChannel).not.toHaveBeenCalled();
  });

  test('menção ao bot mantém a resposta aleatória existente', async () => {
    const { client, execute } = buildClient();
    const msg = buildMessage('Olá VOSTPTia');
    msg.isMemberMentioned.mockReturnValue(true);

    await messageEvent(client, msg);

    expect(sendMessageToChannel).toHaveBeenCalledWith(msg.channel, expect.any(String));
    expect(execute).not.toHaveBeenCalled();
  });

  test('triggers continuam a ser executados e o desconhecido mantém a resposta atual', async () => {
    const { client } = buildClient();
    const triggerExecute = jest.fn();
    client.triggers.set('greetings', { execute: triggerExecute });
    const msg = buildMessage('!inexistente');

    await messageEvent(client, msg);

    expect(triggerExecute).toHaveBeenCalledWith(msg, client);
    expect(sendMessageToAuthor.mock.calls[0][1]).toContain('não existe');
  });
});
