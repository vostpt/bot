// Jest 25's node environment has no Fetch/Abort globals required by the SDK.
const nodeFetch = require('node-fetch');
const { AbortController, AbortSignal } = require('abort-controller');

global.fetch = nodeFetch;
global.Request = nodeFetch.Request;
global.Response = nodeFetch.Response;
global.Headers = nodeFetch.Headers;
global.AbortController = AbortController;
global.AbortSignal = AbortSignal;

const {
  runChat,
  MAX_ANSWER_CHARS,
  MAX_SEARCH_TOOLS,
  PLANNING_MAX_TOKENS,
  FINAL_MAX_TOKENS,
} = require('../../../src/services/llm/orchestrator');
const prompts = require('../../../src/services/llm/prompts/vostptia');

const tools = [
  { name: 'vost_prociv.get_all', description: 'Ocorrências atuais', inputs: { type: 'object' } },
  { name: 'vost_fires.get_important', description: 'Fogos importantes', inputs: { type: 'object' } },
];

const fireResult = {
  source: 'prociv',
  retrievedAt: '2026-03-25T12:00:00.000Z',
  available: true,
  data: [{ l: 'Lisboa', s: 'Centro' }],
};

const makeDeps = (chatMock, callToolMock = jest.fn(), result = fireResult) => ({
  chat: chatMock,
  searchTools: jest.fn().mockResolvedValue(tools),
  callTool: callToolMock.mockResolvedValue(result),
});

describe('orquestrador do agente único', () => {
  test('escolhe ferramentas por searchTools e devolve resposta com fontes', async () => {
    const chatMock = jest.fn()
      .mockResolvedValueOnce('{"calls":[{"name":"vost_prociv.get_all","arguments":{"limit":5}}]}')
      .mockResolvedValueOnce('Há uma ocorrência em Lisboa. Fonte: prociv.');
    const deps = makeDeps(chatMock);

    const result = await runChat({
      question: 'Onde há fogo agora?',
      dateContext: { supported: true, start: '2026-03-25T00:00:00+00:00', end: '2026-03-25T23:59:59+00:00', label: 'hoje' },
      deps,
    });

    expect(result).toEqual({
      answer: 'Há uma ocorrência em Lisboa. Fonte: prociv.',
      sources: ['prociv'],
    });
    expect(deps.searchTools).toHaveBeenCalledWith('Onde há fogo agora?', MAX_SEARCH_TOOLS);
    expect(deps.callTool).toHaveBeenCalledWith('vost_prociv.get_all', { limit: 5 });
    expect(chatMock).toHaveBeenCalledTimes(2);
    expect(chatMock.mock.calls[0][0].maxTokens).toBe(PLANNING_MAX_TOKENS);
    expect(chatMock.mock.calls[1][0].maxTokens).toBe(FINAL_MAX_TOKENS);
  });

  test('accepted tools fornecidas pelo chamador dispensam searchTools', async () => {
    const chatMock = jest.fn()
      .mockResolvedValueOnce('```json\n{"calls":[{"name":"vost_fires.get_important","arguments":{}}]}\n```')
      .mockResolvedValueOnce('Sem fogos importantes agora.');
    const deps = makeDeps(chatMock);

    await runChat({ question: 'Fogos?', tools, deps });

    expect(deps.searchTools).not.toHaveBeenCalled();
    expect(deps.callTool).toHaveBeenCalledWith('vost_fires.get_important', {});
  });

  test('available false chega ao prompt final e não é escondido', async () => {
    const unavailable = {
      source: 'fires',
      retrievedAt: '2026-03-25T12:00:00.000Z',
      available: false,
      reason: 'sem dados históricos',
      data: [],
    };
    const chatMock = jest.fn()
      .mockResolvedValueOnce('{"calls":[{"name":"vost_fires.get_important","arguments":{"start":"2026-03-04T12:00:00Z"}}]}')
      .mockResolvedValueOnce('Não tenho dados históricos de fogos para esse período.');
    const deps = makeDeps(chatMock, jest.fn(), unavailable);

    const result = await runChat({ question: 'Fogos faz 3 semanas?', deps });

    expect(result.answer).toMatch(/não tenho dados históricos/i);
    const finalPrompt = chatMock.mock.calls[1][0].messages[1].content;
    expect(finalPrompt).toContain('sem dados históricos');
    expect(finalPrompt).toContain('"disponivel":false');
  });

  test('tool fora da allowlist nunca é executada', async () => {
    const chatMock = jest.fn().mockResolvedValueOnce('{"calls":[{"name":"Twitter.post","arguments":{"status":"spam"}}]}');
    const deps = makeDeps(chatMock);

    await expect(runChat({ question: 'Publica isso', deps })).rejects.toThrow('não autorizada');
    expect(deps.callTool).not.toHaveBeenCalled();
    expect(chatMock).toHaveBeenCalledTimes(1);
  });

  test('tool fora dos resultados de searchTools nunca é executada', async () => {
    const chatMock = jest.fn().mockResolvedValueOnce('{"calls":[{"name":"vost_journal.get_recent","arguments":{}}]}');
    const deps = makeDeps(chatMock);

    await expect(runChat({ question: 'Decretos?', deps })).rejects.toThrow('não autorizada');
    expect(deps.callTool).not.toHaveBeenCalled();
  });

  test('limita chamadas a 4 e rejeita plano com mais ferramentas', async () => {
    const calls = Array.from({ length: 5 }, () => ({ name: 'vost_prociv.get_all', arguments: {} }));
    const deps = makeDeps(jest.fn().mockResolvedValue(JSON.stringify({ calls })));

    await expect(runChat({ question: 'Muitas ferramentas?', deps })).rejects.toThrow('limite');
    expect(deps.callTool).not.toHaveBeenCalled();
  });

  test('propaga erro do provider sem enviar mensagem própria', async () => {
    const error = new Error('provider indisponível');
    const deps = makeDeps(jest.fn().mockRejectedValue(error));

    await expect(runChat({ question: 'Olá', deps })).rejects.toThrow('provider indisponível');
  });

  test('rejeita JSON inválido, pergunta vazia e resposta final vazia', async () => {
    await expect(runChat({ question: '', deps: makeDeps(jest.fn()) })).rejects.toThrow('Pergunta inválida');
    await expect(runChat({ question: 'Olá', deps: makeDeps(jest.fn().mockResolvedValue('não é json')) }))
      .rejects.toThrow('JSON válido');

    const emptyDeps = makeDeps(jest.fn()
      .mockResolvedValueOnce('{"calls":[]}')
      .mockResolvedValueOnce('   '));

    await expect(runChat({ question: 'Olá', deps: emptyDeps })).rejects.toThrow('Resposta final vazia');
  });

  test('EMPTY_RESPONSE no final prova retry com mais tokens', async () => {
    const emptyError = Object.assign(new Error('Resposta vazia do provider LLM'), { code: 'EMPTY_RESPONSE' });
    const chatMock = jest.fn()
      .mockResolvedValueOnce('{"calls":[]}')
      .mockRejectedValueOnce(emptyError)
      .mockResolvedValueOnce('Resposta após retry');
    const deps = makeDeps(chatMock);

    const result = await runChat({ question: 'Olá', deps });

    expect(result.answer).toBe('Resposta após retry');
    expect(chatMock).toHaveBeenCalledTimes(3);
    expect(chatMock.mock.calls[2][0].maxTokens).toBe(FINAL_MAX_TOKENS + 800);
  });

  test('segundo EMPTY_RESPONSE usa resumo mínimo com mais tokens', async () => {
    const emptyError = Object.assign(new Error('Resposta vazia do provider LLM'), { code: 'EMPTY_RESPONSE' });
    const chatMock = jest.fn()
      .mockResolvedValueOnce('{"calls":[]}')
      .mockRejectedValueOnce(emptyError)
      .mockRejectedValueOnce(emptyError)
      .mockResolvedValueOnce('Resposta com resumo mínimo');
    const deps = makeDeps(chatMock);

    const result = await runChat({ question: 'O que podes consultar?', deps });

    expect(result.answer).toBe('Resposta com resumo mínimo');
    expect(chatMock).toHaveBeenCalledTimes(4);
    expect(chatMock.mock.calls[3][0].maxTokens).toBe(FINAL_MAX_TOKENS + 1600);
    const lastPrompt = chatMock.mock.calls[3][0].messages[1].content;
    expect(lastPrompt).not.toContain('"samples"');
  });

  test('limita o tamanho da resposta final', async () => {
    const longAnswer = 'a'.repeat(MAX_ANSWER_CHARS + 500);
    const deps = makeDeps(jest.fn()
      .mockResolvedValueOnce('{"calls":[]}')
      .mockResolvedValueOnce(longAnswer));

    const result = await runChat({ question: 'Olá', deps });

    expect(result.answer).toHaveLength(MAX_ANSWER_CHARS);
  });

  test('prompt versionado contém as regras da persona', () => {
    const system = prompts.systemPrompt();

    expect(prompts.VERSION).toBe('1.0.0');
    expect(system).toMatch(/VOSTPTia/);
    expect(system).toMatch(/português de Portugal/);
    expect(system).toMatch(/Nunca inventes/);
    expect(system).toMatch(/available/);
    expect(system).toMatch(/Não executes ações de escrita/);
  });
});
