// Jest 25's node environment has no Fetch globals; nock 14 and the OpenAI SDK need them.
const nodeFetch = require('node-fetch');

global.fetch = nodeFetch;
global.Request = nodeFetch.Request;
global.Response = nodeFetch.Response;
global.Headers = nodeFetch.Headers;

const { AbortController, AbortSignal } = require('abort-controller');

global.AbortController = AbortController;
global.AbortSignal = AbortSignal;

const nock = require('nock');

const { chat } = require('../../../src/services/llm');
const { LlmProviderError } = require('../../../src/services/llm/errors');

const BASE_URL = 'https://openrouter.ai';
const PATH = '/api/v1/chat/completions';
const API_KEY = 'sk-test-no-real-credential';

const setEnv = (overrides = {}) => {
  process.env.LLM_PROVIDER = 'openrouter';
  process.env.LLM_API_KEY = API_KEY;
  process.env.LLM_BASE_URL = `${BASE_URL}/api/v1`;
  process.env.LLM_MODEL = 'modelo-principal';
  process.env.LLM_MAX_TOKENS = '1200';
  process.env.LLM_TEMPERATURE = '0.3';
  process.env.LLM_TIMEOUT_MS = '5000';
  process.env.LLM_FALLBACK_ENABLED = 'false';
  process.env.LLM_FALLBACK_MODEL = '';
  process.env.LLM_FALLBACK_MAX_ATTEMPTS = '1';

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
};

const replySuccess = (model, content = 'Resposta do modelo') => ({
  choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
  usage: { total_tokens: 10 },
  model,
});

beforeEach(() => {
  setEnv();
  nock.cleanAll();
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
  nock.cleanAll();
  delete process.env.LLM_API_KEY;
  delete process.env.LLM_MODEL;
});

describe('adapter OpenRouter', () => {
  test('devolve o texto da resposta e envia a chave apenas como bearer', async () => {
    let authorization;

    nock(BASE_URL)
      .post(PATH, (body) => {
        authorization = body;
        return body.model === 'modelo-principal' && body.max_tokens === 1200;
      })
      .reply(200, function reply() {
        expect(String(this.req.headers.authorization)).toBe(`Bearer ${API_KEY}`);
        return replySuccess('modelo-principal');
      });

    const answer = await chat({ messages: [{ role: 'user', content: 'Olá' }] });

    expect(answer).toBe('Resposta do modelo');
    expect(authorization.messages).toEqual([{ role: 'user', content: 'Olá' }]);
    expect(nock.isDone()).toBe(true);
  });

  test('aceita limite de tokens por chamada', async () => {
    nock(BASE_URL)
      .post(PATH, (body) => body.max_tokens === 1800)
      .reply(200, replySuccess('modelo-principal', 'ok'));

    await expect(chat({ messages: [{ role: 'user', content: 'Olá' }], maxTokens: 1800 }))
      .resolves.toBe('ok');
  });

  test('normaliza erro 401 preservando status e código, sem fallback', async () => {
    nock(BASE_URL).post(PATH).reply(401, { error: { message: 'invalid api key' } });

    await expect(chat({ messages: [{ role: 'user', content: 'Olá' }] }))
      .rejects.toMatchObject({
        name: 'LlmProviderError',
        status: 401,
        code: 'HTTP_401',
        budgetExhausted: false,
      });
  });

  test('timeout gera LlmProviderError com código de timeout', async () => {
    const timeoutError = new Error('Request timed out');
    timeoutError.code = 'ETIMEDOUT';

    nock(BASE_URL).post(PATH).replyWithError(timeoutError);

    await expect(chat({ messages: [{ role: 'user', content: 'Olá' }] }))
      .rejects.toMatchObject({ name: 'LlmProviderError', code: 'ETIMEDOUT' });
  });

  test('402 dispara fallback uma única vez com os mesmos messages e tools', async () => {
    setEnv({
      LLM_FALLBACK_ENABLED: 'true',
      LLM_FALLBACK_MODEL: 'modelo-gratuito',
      LLM_FALLBACK_MAX_ATTEMPTS: '5',
    });

    const tools = [{ type: 'function', function: { name: 'vost_prociv.get_all', parameters: {} } }];

    nock(BASE_URL)
      .post(PATH, (body) => body.model === 'modelo-principal')
      .reply(402, { error: { message: 'Insufficient Credits.' } });

    nock(BASE_URL)
      .post(PATH, (body) => body.model === 'modelo-gratuito' && body.tools.length === 1
        && body.messages[0].content === 'Olá')
      .reply(200, replySuccess('modelo-gratuito', 'Resposta gratuita'));

    const answer = await chat({ messages: [{ role: 'user', content: 'Olá' }], tools });

    expect(answer).toBe('Resposta gratuita');
    expect(nock.isDone()).toBe(true);
  });

  test('mensagem de créditos insuficientes com status 400 também dispara fallback', async () => {
    setEnv({ LLM_FALLBACK_ENABLED: 'true', LLM_FALLBACK_MODEL: 'modelo-gratuito' });

    nock(BASE_URL).post(PATH).reply(400, { error: { message: 'insufficient balance' } });
    nock(BASE_URL).post(PATH).reply(200, replySuccess('modelo-gratuito', 'ok'));

    await expect(chat({ messages: [{ role: 'user', content: 'Olá' }] })).resolves.toBe('ok');
  });

  test('429 e 5xx não disparam fallback', async () => {
    setEnv({ LLM_FALLBACK_ENABLED: 'true', LLM_FALLBACK_MODEL: 'modelo-gratuito' });

    for (const status of [429, 500]) {
      nock(BASE_URL).post(PATH).reply(status, { error: { message: 'falha temporária' } });

      await expect(chat({ messages: [{ role: 'user', content: 'Olá' }] }))
        .rejects.toMatchObject({ status, budgetExhausted: false });
    }

    expect(nock.pendingMocks()).toHaveLength(0);
  });

  test('falha do fallback gera LlmProviderError', async () => {
    setEnv({ LLM_FALLBACK_ENABLED: 'true', LLM_FALLBACK_MODEL: 'modelo-gratuito' });

    nock(BASE_URL).post(PATH).reply(402, { error: { message: 'payment required' } });
    nock(BASE_URL).post(PATH).reply(503, { error: { message: 'indisponível' } });

    await expect(chat({ messages: [{ role: 'user', content: 'Olá' }] }))
      .rejects.toMatchObject({ name: 'LlmProviderError', status: 503 });
  });

  test('402 sem modelo de fallback configurado não repete a chamada', async () => {
    setEnv({ LLM_FALLBACK_ENABLED: 'true', LLM_FALLBACK_MODEL: '' });

    nock(BASE_URL).post(PATH).reply(402, { error: { message: 'payment required' } });

    await expect(chat({ messages: [{ role: 'user', content: 'Olá' }] }))
      .rejects.toBeInstanceOf(LlmProviderError);

    expect(nock.isDone()).toBe(true);
  });

  test('não expõe a chave em mensagens de erro', async () => {
    nock(BASE_URL)
      .post(PATH)
      .reply(401, { error: { message: `chave inválida: ${API_KEY}` } });

    let caught;

    try {
      await chat({ messages: [{ role: 'user', content: 'Olá' }] });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(LlmProviderError);
    expect(caught.message).not.toContain(API_KEY);
    expect(caught.message).toContain('[redacted]');
  });
});
