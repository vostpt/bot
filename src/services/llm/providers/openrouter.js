const OpenAI = require('openai');

const { withSpan, count, emitLog } = require('../../../telemetry');
const { getLlmConfig } = require('../../../../config/llm');
const { LlmProviderError } = require('../errors');

const BUDGET_MESSAGE = /insufficient\s+(credits|balance|funds)|not\s+enough\s+(credits|balance|funds)|payment\s+required|budget\s+exhausted|out\s+of\s+credits/i;
const TIMEOUT_MESSAGE = /timed?\s*out|timeout|time allotted|aborted|ETIMEDOUT|ECONNABORTED/i;

const redact = (text, secret) => {
  if (typeof text !== 'string') {
    return 'Erro do provider LLM';
  }

  if (!secret) {
    return text;
  }

  return text.split(secret).join('[redacted]');
};

const isBudgetError = (error) => Boolean(
  error
  && (error.status === 402 || error.code === 'insufficient_quota' || BUDGET_MESSAGE.test(error.message || '')),
);

const normalizeError = (error, config = {}) => {
  if (error instanceof LlmProviderError) {
    return error;
  }

  const status = Number(error && error.status) || (error && error.response && error.response.status) || undefined;
  const causeMessage = error && error.cause && error.cause.message ? ` ${error.cause.message}` : '';
  const causeCode = error && error.cause && error.cause.code ? error.cause.code : undefined;
  const message = redact(`${error && error.message ? error.message : ''}${causeMessage}`.trim(), config.apiKey);
  const code = (error && error.code)
    || causeCode
    || (status ? `HTTP_${status}` : undefined)
    || (TIMEOUT_MESSAGE.test(message) ? 'ETIMEDOUT' : 'LLM_ERROR');

  return new LlmProviderError(message, {
    status,
    code,
    budgetExhausted: isBudgetError({ status, code, message }),
    cause: error,
  });
};

const createClient = (config) => {
  const defaultHeaders = {};

  if (config.httpReferer) {
    defaultHeaders['HTTP-Referer'] = config.httpReferer;
  }

  if (config.xTitle) {
    defaultHeaders['X-Title'] = config.xTitle;
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: config.timeoutMs,
    maxRetries: 0,
    defaultHeaders,
  });
};

const requestCompletion = async (client, config, { messages, tools, model }) => {
  let response;

  try {
    const params = {
      model,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    };

    if (Array.isArray(tools) && tools.length > 0) {
      params.tools = tools;
    }

    response = await client.chat.completions.create(params);
  } catch (error) {
    throw normalizeError(error, config);
  }

  const choice = response && response.choices && response.choices[0];
  const content = choice && choice.message && choice.message.content;

  if (typeof content !== 'string' || content.trim() === '') {
    throw new LlmProviderError('Resposta vazia do provider LLM', {
      code: 'EMPTY_RESPONSE',
      status: 200,
    });
  }

  return { content, usage: response.usage };
};

const complete = async (client, config, options, model, phase) => withSpan('llm.completion', {
  attributes: {
    'llm.provider': 'openrouter',
    'llm.model': model,
    'llm.phase': phase,
  },
}, async () => {
  const result = await requestCompletion(client, config, { ...options, model });
  const usage = result && result.usage;

  if (usage) {
    const input = Number(usage.prompt_tokens || usage.input_tokens || 0);
    const output = Number(usage.completion_tokens || usage.output_tokens || 0);

    if (Number.isFinite(input)) {
      count('llmTokens', { model, type: 'input' }, input);
    }

    if (Number.isFinite(output)) {
      count('llmTokens', { model, type: 'output' }, output);
    }
  }

  return result;
});

/**
 * OpenRouter chat adapter. Uses the OpenAI-compatible API and never sends
 * Discord messages or logs credentials.
 */
const chat = async ({ messages, tools = [], config: suppliedConfig } = {}) => {
  const config = suppliedConfig || getLlmConfig();

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new LlmProviderError('Mensagens inválidas para o provider LLM', { code: 'INVALID_MESSAGES' });
  }

  const client = createClient(config);

  let result;

  try {
    result = await complete(client, config, { messages, tools }, config.model, 'primary');
  } catch (error) {
    const providerError = normalizeError(error, config);

    if (
      !providerError.budgetExhausted
      || !config.fallback
      || !config.fallback.enabled
      || !config.fallback.model
      || config.fallback.maxAttempts < 1
    ) {
      throw providerError;
    }

    // Budget detail stays internal: no Discord message and no credentials.
    console.warn(JSON.stringify({
      event: 'budget_exhausted',
      provider: 'openrouter',
      model: config.model,
      fallbackModel: config.fallback.model,
      status: providerError.status,
    }));
    emitLog('budget_exhausted', {
      severity: 'WARN',
      message: 'OpenRouter sem créditos; a tentar modelo de fallback',
      attributes: {
        'llm.provider': 'openrouter',
        'llm.model': config.model,
        'llm.fallback.model': config.fallback.model,
        'provider.status': providerError.status,
      },
    });

    result = await complete(client, config, { messages, tools }, config.fallback.model, 'fallback');
  }

  return result.content;
};

module.exports = {
  chat,
  isBudgetError,
  normalizeError,
  createClient,
  redact,
};
