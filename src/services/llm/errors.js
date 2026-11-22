/**
 * Error type used at the LLM boundary. The original status/code are kept so
 * the OpenRouter adapter can distinguish budget failures from other failures.
 */
class LlmProviderError extends Error {
  constructor(message, options = {}) {
    super(message);

    this.name = 'LlmProviderError';
    this.status = options.status;
    this.code = options.code;
    this.budgetExhausted = Boolean(options.budgetExhausted);

    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

module.exports = { LlmProviderError };
