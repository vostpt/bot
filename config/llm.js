const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MAX_TOKENS = 1200;
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_PROVIDER = 'openrouter';

const boolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return /^(1|true|yes|sim)$/i.test(String(value));
};

const number = (name, value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} inválido`);
  }

  return parsed;
};

const getLlmConfig = () => {
  const provider = process.env.LLM_PROVIDER || DEFAULT_PROVIDER;

  const config = {
    provider,
    apiKey: process.env.LLM_API_KEY || '',
    baseURL: process.env.LLM_BASE_URL || DEFAULT_BASE_URL,
    model: process.env.LLM_MODEL || '',
    maxTokens: number('LLM_MAX_TOKENS', process.env.LLM_MAX_TOKENS, DEFAULT_MAX_TOKENS, { min: 1 }),
    temperature: number('LLM_TEMPERATURE', process.env.LLM_TEMPERATURE, DEFAULT_TEMPERATURE, { min: 0, max: 2 }),
    timeoutMs: number('LLM_TIMEOUT_MS', process.env.LLM_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, { min: 1 }),
    httpReferer: process.env.LLM_HTTP_REFERER || '',
    xTitle: process.env.LLM_X_TITLE || '',
    fallback: {
      enabled: boolean(process.env.LLM_FALLBACK_ENABLED, true),
      model: process.env.LLM_FALLBACK_MODEL || '',
      maxAttempts: number(
        'LLM_FALLBACK_MAX_ATTEMPTS',
        process.env.LLM_FALLBACK_MAX_ATTEMPTS,
        1,
        { min: 0 },
      ),
    },
  };

  if (provider !== 'openrouter') {
    throw new Error(`LLM_PROVIDER não suportado: ${provider}`);
  }

  if (!config.apiKey) {
    throw new Error('LLM_API_KEY não configurada');
  }

  if (!config.model) {
    throw new Error('LLM_MODEL não configurado');
  }

  config.fallback.maxAttempts = Math.min(config.fallback.maxAttempts, 1);

  if (config.fallback.enabled && !config.fallback.model) {
    config.fallback.enabled = false;
  }

  return config;
};

module.exports = {
  getLlmConfig,
  boolean,
  DEFAULT_BASE_URL,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_PROVIDER,
};
