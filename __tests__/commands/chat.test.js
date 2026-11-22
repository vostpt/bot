// Jest 25's node environment has no Fetch/Abort globals required by the SDK.
const nodeFetch = require('node-fetch');
const { AbortController, AbortSignal } = require('abort-controller');

global.fetch = nodeFetch;
global.Request = nodeFetch.Request;
global.Response = nodeFetch.Response;
global.Headers = nodeFetch.Headers;
global.AbortController = AbortController;
global.AbortSignal = AbortSignal;

process.env.LLM_CHAT_ENABLED = 'true';
process.env.LLM_ALLOWED_CHANNELS = '';

jest.mock('../../src/services/Discord', () => ({
  sendMessageAnswer: jest.fn(),
  sendMessageToChannel: jest.fn(),
}));

jest.mock('../../src/services/llm/orchestrator', () => ({ runChat: jest.fn() }));

const { sendMessageAnswer, sendMessageToChannel } = require('../../src/services/Discord');
const orchestrator = require('../../src/services/llm/orchestrator');
const memory = require('../../src/services/llm/memory');
const command = require('../../src/commands/chat');

const message = () => ({
  channel: { id: 'canal-1', send: jest.fn() },
  author: { id: 'user-1' },
  reply: jest.fn(),
  react: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
  memory.resetMemory();
  orchestrator.runChat.mockResolvedValue({ answer: 'Há 2 ocorrências em Lisboa.', sources: ['prociv'] });
});

describe('comando !chat', () => {
  test('tem definição isolada, sem aliases e com o cooldown existente', () => {
    expect(command.name).toBe('chat');
    expect(command.aliases).toBeUndefined();
    expect(command.args).toBe(true);
    expect(command.active).toBe(true);
    expect(command.cooldown).toBe(require('../../config/bot').cooldown);
    expect(command.usage).toContain('!chat <pergunta>');
  });

  test('sem pergunta envia a frase de erro com menção ao autor', async () => {
    const msg = message();

    await command.execute(msg, []);

    expect(sendMessageToChannel).toHaveBeenCalledWith(msg.channel, '<@user-1> Infelizmente não te posso responder');
    expect(msg.reply).not.toHaveBeenCalled();
    expect(msg.react).not.toHaveBeenCalled();
    expect(orchestrator.runChat).not.toHaveBeenCalled();
  });

  test('com pergunta envia a resposta e guarda o turno na memória', async () => {
    const msg = message();

    await command.execute(msg, ['Onde', 'há', 'fogo', 'agora?']);

    expect(orchestrator.runChat).toHaveBeenCalledWith(expect.objectContaining({
      question: 'Onde há fogo agora?',
      history: [],
      dateContext: expect.objectContaining({ supported: true }),
    }));
    expect(sendMessageAnswer).toHaveBeenCalledWith(msg, 'Há 2 ocorrências em Lisboa.');
    expect(sendMessageToChannel).not.toHaveBeenCalled();
    expect(msg.react).not.toHaveBeenCalled();

    const history = memory.getHistory(memory.buildKey('canal-1', 'user-1'));
    expect(history.map(({ role }) => role)).toEqual(['user', 'assistant']);
  });

  test('usa o histórico curto da conversa anterior', async () => {
    const msg = message();
    const key = memory.buildKey('canal-1', 'user-1');

    memory.append(key, 'user', 'Quantas ocorrências há agora?');
    memory.append(key, 'assistant', 'Há duas.');

    await command.execute(msg, ['E na semana passada?']);

    expect(orchestrator.runChat.mock.calls[0][0].history).toHaveLength(2);
  });

  test('qualquer erro do orquestrador envia a frase de erro com menção', async () => {
    const msg = message();
    orchestrator.runChat.mockRejectedValue(new Error('falha interna com token secreto'));

    await command.execute(msg, ['teste']);

    expect(sendMessageToChannel).toHaveBeenCalledWith(msg.channel, '<@user-1> Infelizmente não te posso responder');
    expect(sendMessageAnswer).not.toHaveBeenCalled();
    expect(msg.reply).not.toHaveBeenCalled();
    expect(msg.react).not.toHaveBeenCalled();
  });

  test('erro de tool é tratado como erro do orquestrador', async () => {
    const msg = message();
    orchestrator.runChat.mockRejectedValue(new Error('Tool falhou'));

    await command.execute(msg, ['fogo']);

    expect(sendMessageToChannel).toHaveBeenCalledWith(msg.channel, command.errorReply(msg));
    expect(command.ERROR_MESSAGE).toBe('Infelizmente não te posso responder');
  });

  test('no input local a menção é legível no terminal', async () => {
    const msg = message();
    msg.local = true;
    msg.author.username = 'local';

    await command.execute(msg, []);

    expect(sendMessageToChannel).toHaveBeenCalledWith(msg.channel, '@local Infelizmente não te posso responder');
  });

  test('falha de memória não impede a resposta', async () => {
    const msg = message();
    jest.spyOn(memory, 'getHistory').mockImplementationOnce(() => { throw new Error('memória falhou'); });
    jest.spyOn(memory, 'append').mockImplementation(() => { throw new Error('memória falhou'); });

    await command.execute(msg, ['teste']);

    expect(sendMessageAnswer).toHaveBeenCalledWith(msg, 'Há 2 ocorrências em Lisboa.');
    expect(sendMessageToChannel).not.toHaveBeenCalled();

    memory.append.mockRestore();
    memory.getHistory.mockRestore();
  });

  test('LLM_CHAT_ENABLED=false mantém o comando registado mas desativado', () => {
    process.env.LLM_CHAT_ENABLED = 'false';
    jest.resetModules();

    const disabled = require('../../src/commands/chat');

    expect(disabled.name).toBe('chat');
    expect(disabled.active).toBe(false);

    process.env.LLM_CHAT_ENABLED = 'true';
    jest.resetModules();
  });

  test('LLM_ALLOWED_CHANNELS limita os canais do novo comando', () => {
    process.env.LLM_ALLOWED_CHANNELS = '111, 222';
    jest.resetModules();

    const limited = require('../../src/commands/chat');

    expect(limited.limitToChannels).toEqual(['111', '222']);

    process.env.LLM_ALLOWED_CHANNELS = '';
    jest.resetModules();
  });
});
