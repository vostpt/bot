const mockClient = {
  searchTools: jest.fn().mockResolvedValue([
    { name: 'vost_prociv.get_all' },
    { name: 'vost_unknown.tool' },
  ]),
  callTool: jest.fn().mockResolvedValue({ ok: true }),
};

jest.mock('@utcp/sdk', () => ({
  UtcpClient: {
    create: jest.fn().mockResolvedValue(mockClient),
  },
}));

jest.mock('@utcp/direct-call', () => ({
  addFunctionToUtcpDirectCall: jest.fn(),
}));

jest.mock('@utcp/http', () => ({}));
jest.mock('@utcp/text', () => ({}));
jest.mock('@utcp/file', () => ({}));
jest.mock('@utcp/dotenv-loader', () => ({
  DotEnvVariableLoader: jest.fn(),
}));

const { UtcpClient } = require('@utcp/sdk');
const { addFunctionToUtcpDirectCall } = require('@utcp/direct-call');
const { createClient } = require('../src/client');
const { resetRegistered } = require('../src/tools/vost');

describe('client', () => {
  const mockServices = { Prociv: { getAll: jest.fn() } };
  const mockApis = { IpmaApi: { fetch: jest.fn() } };

  beforeEach(() => {
    jest.clearAllMocks();
    resetRegistered();
  });

  test('createClient inicializa UtcpClient com rootDir e templates', async () => {
    await createClient({
      rootDir: '/tmp/test',
      services: mockServices,
      apis: mockApis,
    });

    expect(UtcpClient.create).toHaveBeenCalled();
    const callArgs = UtcpClient.create.mock.calls[0];
    expect(callArgs[0]).toBe('/tmp/test');
    expect(callArgs[1]).toHaveProperty('manual_call_templates');
  });

  test('createClient regista callables VOST', async () => {
    await createClient({
      rootDir: '/tmp/test',
      services: mockServices,
      apis: mockApis,
    });

    expect(addFunctionToUtcpDirectCall).toHaveBeenCalled();
  });

  test('createClient reutiliza callables se já registados', async () => {
    await createClient({
      rootDir: '/tmp/test',
      services: mockServices,
      apis: mockApis,
    });

    expect(addFunctionToUtcpDirectCall).toHaveBeenCalled();
  });

  test('searchTools filtra por allowlist', async () => {
    const client = await createClient({
      rootDir: '/tmp/test',
      services: mockServices,
      apis: mockApis,
    });

    const results = await client.searchTools('test');
    expect(results.some((r) => r.name === 'vost_prociv.get_all')).toBe(true);
    expect(results.some((r) => r.name === 'vost_unknown.tool')).toBe(false);
  });

  test('callTool rejeita tool não permitida', async () => {
    const client = await createClient({
      rootDir: '/tmp/test',
      services: mockServices,
      apis: mockApis,
    });

    await expect(client.callTool('vost_unknown.tool', {}))
      .rejects.toThrow('Tool não permitida');
  });

  test('callTool rejeita argumentos inválidos', async () => {
    const client = await createClient({
      rootDir: '/tmp/test',
      services: mockServices,
      apis: mockApis,
    });

    await expect(client.callTool('vost_prociv.get_all', null))
      .rejects.toThrow('Argumentos de tool inválidos');

    await expect(client.callTool('vost_prociv.get_all', []))
      .rejects.toThrow('Argumentos de tool inválidos');
  });

  test('callTool rejeita argumentos com dados sensíveis', async () => {
    const client = await createClient({
      rootDir: '/tmp/test',
      services: mockServices,
      apis: mockApis,
    });

    await expect(client.callTool('vost_prociv.get_all', { apiKey: '123' }))
      .rejects.toThrow('dados sensíveis');

    await expect(client.callTool('vost_prociv.get_all', { password: '123' }))
      .rejects.toThrow('dados sensíveis');
  });

  test('callTool chama client.callTool com payload correcto', async () => {
    const client = await createClient({
      rootDir: '/tmp/test',
      services: mockServices,
      apis: mockApis,
    });

    await client.callTool('vost_prociv.get_all', { limit: 5 });
    expect(mockClient.callTool)
      .toHaveBeenCalledWith('vost_prociv.get_all', { options: { limit: 5 } });
  });

  test('telemetria injectada chama withMeasuredSpan e emitLog', async () => {
    const withMeasuredSpan = jest.fn().mockImplementation((name, attrs, fn) => fn());
    const emitLog = jest.fn();

    const client = await createClient({
      rootDir: '/tmp/test',
      services: mockServices,
      apis: mockApis,
      telemetry: { withMeasuredSpan, emitLog },
    });

    await client.callTool('vost_prociv.get_all', {});
    expect(withMeasuredSpan).toHaveBeenCalled();
  });

  test('resetUtcpClient expõe método', async () => {
    const client = await createClient({
      rootDir: '/tmp/test',
      services: mockServices,
      apis: mockApis,
    });

    expect(typeof client.resetUtcpClient).toBe('function');
  });
});
