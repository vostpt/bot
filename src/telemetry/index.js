/* eslint-disable no-console */
/**
 * OpenTelemetry facade.
 *
 * Nothing is loaded, registered or exported unless an OTLP collector is
 * configured via OTEL_EXPORTER_OTLP_ENDPOINT. Without it every helper below is
 * a no-op and the bot behaves exactly as before.
 */

const { version: SERVICE_VERSION } = require('../../package.json');

const METRICS = {
  messages: {
    name: 'vostbot.discord.messages',
    kind: 'counter',
    description: 'Mensagens do Discord processadas',
    unit: '{message}',
  },
  commands: {
    name: 'vostbot.commands',
    kind: 'counter',
    description: 'Comandos executados',
    unit: '{command}',
  },
  chatRequests: {
    name: 'vostbot.chat.requests',
    kind: 'counter',
    description: 'Pedidos !chat',
    unit: '{request}',
  },
  chatDuration: {
    name: 'vostbot.chat.duration',
    kind: 'histogram',
    description: 'Duração do comando !chat',
    unit: 's',
  },
  llmCalls: {
    name: 'vostbot.llm.calls',
    kind: 'counter',
    description: 'Chamadas ao provider LLM',
    unit: '{call}',
  },
  llmTokens: {
    name: 'vostbot.llm.tokens',
    kind: 'counter',
    description: 'Tokens usados no provider LLM',
    unit: '{token}',
  },
  llmDuration: {
    name: 'vostbot.llm.duration',
    kind: 'histogram',
    description: 'Duração das chamadas ao provider LLM',
    unit: 's',
  },
  toolCalls: {
    name: 'vostbot.utcp.tool.calls',
    kind: 'counter',
    description: 'Chamadas a ferramentas UTCP',
    unit: '{call}',
  },
  toolDuration: {
    name: 'vostbot.utcp.tool.duration',
    kind: 'histogram',
    description: 'Duração das chamadas a ferramentas UTCP',
    unit: 's',
  },
};

let sdk = null;
let otel = null;
let enabled = false;
let signalsRegistered = false;

const isEnabled = () => enabled;

const hasOptIn = () => /^(1|true|yes|sim)$/i.test(String(process.env.OTEL_ENABLED || '').trim());

const cleanAttributes = (attributes) => {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
    return {};
  }

  return Object.entries(attributes).reduce((clean, [key, value]) => {
    if (value === undefined || value === null) {
      return clean;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      clean[key] = value;
    }

    return clean;
  }, {});
};

const secondsSince = (start) => Number(process.hrtime.bigint() - start) / 1e9;

const buildInstruments = (meter) => Object.entries(METRICS).reduce((items, [key, spec]) => {
  const options = { description: spec.description, unit: spec.unit };

  items[key] = spec.kind === 'counter'
    ? meter.createCounter(spec.name, options)
    : meter.createHistogram(spec.name, options);

  return items;
}, {});

const count = (key, attributes = {}, value = 1) => {
  if (!enabled || !otel) {
    return;
  }

  const instrument = otel.instruments[key];

  if (instrument) {
    instrument.add(value, cleanAttributes(attributes));
  }
};

const observe = (key, value, attributes = {}) => {
  if (!enabled || !otel) {
    return;
  }

  const instrument = otel.instruments[key];

  if (instrument) {
    instrument.record(value, cleanAttributes(attributes));
  }
};

const emitLog = (event, { message, severity = 'INFO', attributes = {} } = {}) => {
  if (!enabled || !otel) {
    return;
  }

  const severityText = String(severity).toUpperCase();
  const severityNumber = otel.api.SeverityNumber[severityText] || otel.api.SeverityNumber.INFO;

  otel.logger.emit({
    severityNumber,
    severityText,
    body: message || event,
    attributes: cleanAttributes({ 'event.name': event, ...attributes }),
  });
};

const withSpan = async (name, options = {}, fn) => {
  if (!enabled || !otel) {
    return fn();
  }

  const { api, tracer } = otel;
  const span = tracer.startSpan(name, {
    attributes: cleanAttributes(options.attributes),
    kind: options.kind ? api.SpanKind[options.kind] : undefined,
  });

  return api.context.with(api.trace.setSpan(api.context.active(), span), async () => {
    try {
      const result = await fn(span);
      span.setStatus({ code: api.SpanStatusCode.OK });
      return result;
    } catch (error) {
      if (error instanceof Error) {
        span.recordException(error);
      }

      span.setStatus({
        code: api.SpanStatusCode.ERROR,
        message: error && error.message ? String(error.message) : 'Erro',
      });
      throw error;
    } finally {
      span.end();
    }
  });
};

const withMeasuredSpan = async (name, options = {}, fn) => {
  if (!enabled) {
    return fn();
  }

  const start = process.hrtime.bigint();
  const metricAttributes = options.metricAttributes || {};

  return withSpan(name, options, async (span) => {
    try {
      const result = await fn(span);

      if (options.countKey) {
        count(options.countKey, { ...metricAttributes, result: 'ok' });
      }

      return result;
    } catch (error) {
      if (options.countKey) {
        count(options.countKey, { ...metricAttributes, result: 'error' });
      }

      throw error;
    } finally {
      if (options.durationKey) {
        observe(options.durationKey, secondsSince(start), metricAttributes);
      }
    }
  });
};

const shutdownTelemetry = async () => {
  if (!sdk) {
    return;
  }

  const current = sdk;
  sdk = null;
  otel = null;
  enabled = false;

  try {
    await current.shutdown();
  } catch (error) {
    console.warn('📡 Falha ao encerrar OpenTelemetry');
    if (process.env.OTEL_DEBUG) {
      console.error(error);
    }
  }
};

const initTelemetry = () => {
  if (enabled || sdk) {
    return true;
  }

  const endpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '').trim();

  // An endpoint can be injected by the runtime/harness without a real
  // collector behind it. Only export when collection was explicitly enabled.
  if (!endpoint || !hasOptIn()) {
    return false;
  }

  try {
    const api = require('@opentelemetry/api');
    const { startNodeSdk } = require('@opentelemetry/sdk-node');

    const resourceEnv = process.env.OTEL_RESOURCE_ATTRIBUTES || '';
    const resourceAttributes = {};

    if (!process.env.OTEL_SERVICE_NAME && !/(^|,)service\.name=/.test(resourceEnv)) {
      resourceAttributes['service.name'] = 'vostpt-bot';
    }

    if (!/(^|,)service\.version=/.test(resourceEnv)) {
      resourceAttributes['service.version'] = SERVICE_VERSION;
    }

    sdk = startNodeSdk({ resourceAttributes, instrumentations: [] });

    const meter = api.metrics.getMeter('vostpt-bot');
    otel = {
      api,
      tracer: api.trace.getTracer('vostpt-bot'),
      meter,
      logger: api.logs.getLogger('vostpt-bot'),
      instruments: buildInstruments(meter),
    };
    enabled = true;

    if (!signalsRegistered) {
      signalsRegistered = true;
      const onSignal = () => {
        shutdownTelemetry().finally(() => process.exit(0));
      };
      process.once('SIGINT', onSignal);
      process.once('SIGTERM', onSignal);
    }

    console.log('📡 OpenTelemetry ativo');
    return true;
  } catch (error) {
    sdk = null;
    otel = null;
    enabled = false;
    console.warn('📡 OpenTelemetry não iniciado; continuar sem telemetria');
    if (process.env.OTEL_DEBUG) {
      console.error(error);
    }
    return false;
  }
};

module.exports = {
  METRICS,
  initTelemetry,
  shutdownTelemetry,
  isEnabled,
  withSpan,
  withMeasuredSpan,
  count,
  observe,
  emitLog,
};
