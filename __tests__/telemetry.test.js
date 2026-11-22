describe('telemetry sem coletor OTLP', () => {
  const originalEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const originalOptIn = process.env.OTEL_ENABLED;

  beforeEach(() => {
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    jest.resetModules();
  });

  afterEach(() => {
    if (originalEndpoint === undefined) {
      delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    } else {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = originalEndpoint;
    }

    if (originalOptIn === undefined) {
      delete process.env.OTEL_ENABLED;
    } else {
      process.env.OTEL_ENABLED = originalOptIn;
    }
  });

  test('não inicializa nem ativa telemetria', () => {
    const telemetry = require('../src/telemetry');

    expect(telemetry.initTelemetry()).toBe(false);
    expect(telemetry.isEnabled()).toBe(false);
  });

  test('endpoint herdado sem OTEL_ENABLED não ativa telemetria', () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:3000';
    delete process.env.OTEL_ENABLED;
    jest.resetModules();

    const telemetry = require('../src/telemetry');

    expect(telemetry.initTelemetry()).toBe(false);
    expect(telemetry.isEnabled()).toBe(false);
  });

  test('os helpers não alteram o resultado nem lançam erros', async () => {
    const telemetry = require('../src/telemetry');

    telemetry.initTelemetry();

    expect(await telemetry.withSpan('test.span', {}, async () => 'ok')).toBe('ok');
    expect(await telemetry.withMeasuredSpan('test.measured', {}, async () => 42)).toBe(42);

    expect(() => {
      telemetry.count('messages', { source: 'test' });
      telemetry.observe('chatDuration', 0.1);
      telemetry.emitLog('test.event', { message: 'sem coletor' });
    }).not.toThrow();
  });

  test('preserva erros das funções instrumentadas', async () => {
    const telemetry = require('../src/telemetry');
    const failure = new Error('falha esperada');

    await expect(telemetry.withSpan('test.span', {}, async () => {
      throw failure;
    })).rejects.toBe(failure);
  });
});
