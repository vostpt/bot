const previousMainChannel = process.env.MAIN_CHANNEL_ID;
const previousChatOnly = process.env.LLM_CHAT_ONLY;

process.env.MAIN_CHANNEL_ID = 'canal-principal';
process.env.LLM_CHAT_ONLY = 'true';

jest.mock('../../src/services/Discord', () => ({ sendMessageToChannel: jest.fn() }));
jest.mock('../../src/jobs', () => jest.fn());

const { sendMessageToChannel } = require('../../src/services/Discord');
const ready = require('../../src/events/ready');

const textChannel = (id, canSend = true) => ({
  id,
  type: 'text',
  permissionsFor: jest.fn().mockReturnValue({ has: jest.fn().mockReturnValue(canSend) }),
});

const collectionOf = (items) => ({
  get: id => items.find(item => item.id === id) || null,
  find: fn => items.find(fn) || null,
});

const buildClient = (items) => ({ user: {}, channels: collectionOf(items) });

let logSpy;
let warnSpy;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  warnSpy.mockRestore();
});

afterAll(() => {
  if (previousMainChannel === undefined) delete process.env.MAIN_CHANNEL_ID;
  else process.env.MAIN_CHANNEL_ID = previousMainChannel;

  if (previousChatOnly === undefined) delete process.env.LLM_CHAT_ONLY;
  else process.env.LLM_CHAT_ONLY = previousChatOnly;
});

describe('mensagem de arranque no Discord', () => {
  test('envia "Estou aqui" ao canal principal configurado', async () => {
    const main = textChannel('canal-principal');
    const other = textChannel('outro-canal');

    await ready(buildClient([main, other]));

    expect(sendMessageToChannel).toHaveBeenCalledTimes(1);
    expect(sendMessageToChannel).toHaveBeenCalledWith(main, 'Estou aqui');
  });

  test('usa o primeiro canal com permissão se o principal não existir', async () => {
    const withoutPermission = textChannel('sem-permissao', false);
    const usable = textChannel('canal-util');

    await ready(buildClient([withoutPermission, usable]));

    expect(sendMessageToChannel).toHaveBeenCalledWith(usable, 'Estou aqui');
  });

  test('falta de canal disponível é registada sem quebrar o arranque', async () => {
    await ready(buildClient([]));

    expect(sendMessageToChannel).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Não foi possível encontrar um canal para a mensagem de arranque');
  });

  test('falha de envio não quebra o arranque', async () => {
    const main = textChannel('canal-principal');
    sendMessageToChannel.mockRejectedValue(new Error('Discord indisponível'));

    await expect(ready(buildClient([main]))).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith('Não foi possível enviar a mensagem de arranque');
  });
});
