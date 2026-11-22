const { getLlmConfig } = require('../../../config/llm');
const openrouter = require('./providers/openrouter');
const { LlmProviderError } = require('./errors');

const providers = {
  openrouter,
};

const chat = async ({ messages, tools = [], maxTokens } = {}) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new LlmProviderError('Mensagens inválidas', { code: 'INVALID_MESSAGES' });
  }

  const config = getLlmConfig();
  const provider = providers[config.provider];

  if (!provider) {
    throw new LlmProviderError('Provider LLM não implementado', { code: 'UNKNOWN_PROVIDER' });
  }

  const providerConfig = maxTokens ? { ...config, maxTokens } : config;

  return provider.chat({ messages, tools, config: providerConfig });
};

module.exports = {
  chat,
  LlmProviderError,
};
