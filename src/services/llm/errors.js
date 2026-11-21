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
