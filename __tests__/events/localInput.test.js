const EventEmitter = require('events');

const mockRl = new EventEmitter();
mockRl.prompt = jest.fn();
mockRl.close = jest.fn();

jest.mock('readline', () => ({ createInterface: () => mockRl }));
jest.mock('../../src/events/message', () => jest.fn());

const messageEvent = require('../../src/events/message');
const { startLocalInput, AUTHOR_ID, CHANNEL_ID } = require('../../src/events/localInput');

const flush = () => new Promise(resolve => setImmediate(resolve));

const buildClient = () => {
  const deleteMock = jest.fn();
  const hasMock = jest.fn().mockReturnValue(true);

  return {
    destroy: jest.fn(),
    cooldowns: {
      get: jest.fn().mockReturnValue({ has: hasMock, delete: deleteMock }),
    },
    deleteMock,
  };
};

let logSpy;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
});

describe('input local no painel do bot', () => {
  test('texto simples é enviado como !chat sem passar pelo Discord', async () => {
    const client = buildClient();

    startLocalInput(client);
    mockRl.emit('line', 'Onde há fogo agora?');
    await flush();

    expect(messageEvent).toHaveBeenCalledTimes(1);
    const msg = messageEvent.mock.calls[0][1];

    expect(msg.content).toBe('!chat Onde há fogo agora?');
    expect(msg.channel.id).toBe(CHANNEL_ID);
    expect(msg.author.id).toBe(AUTHOR_ID);
    expect(msg.author.bot).toBe(false);
    expect(msg.local).toBe(true);
    expect(client.deleteMock).toHaveBeenCalledWith(AUTHOR_ID);
    expect(mockRl.prompt).toHaveBeenCalled();
  });

  test('linhas com ! são despachadas como comando', async () => {
    const client = buildClient();

    startLocalInput(client);
    mockRl.emit('line', '!all');
    await flush();

    expect(messageEvent.mock.calls[0][1].content).toBe('!all');
  });

  test('respostas do comando aparecem no terminal com prefixo', async () => {
    const client = buildClient();

    startLocalInput(client);

    messageEvent.mockImplementationOnce(async (fakeClient, message) => {
      await message.reply('Há 2 ocorrências.');
    });

    mockRl.emit('line', 'teste');
    await flush();

    expect(logSpy).toHaveBeenCalledWith('[VOSTPTia] Há 2 ocorrências.');
  });

  test('exit fecha apenas o input e mantém o bot ligado', async () => {
    const client = buildClient();

    startLocalInput(client);
    mockRl.emit('line', 'exit');
    await flush();

    expect(mockRl.close).toHaveBeenCalled();
    expect(client.destroy).not.toHaveBeenCalled();
    expect(messageEvent).not.toHaveBeenCalled();
  });
});
