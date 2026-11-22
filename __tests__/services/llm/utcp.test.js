const utcp = require('../../../src/services/llm/utcp/client');
const { ALLOWED_TOOLS, isAllowed } = require('../../../src/services/llm/utcp/allowlist');
const { getAllToolNames, vostManual, httpManual } = require('../../../src/services/llm/utcp/manuals');

afterAll(() => {
  utcp.resetUtcpClient();
});

describe('cliente UTCP', () => {
  test('inicializa em CommonJS e encontra tools de fogo por searchTools', async () => {
    const tools = await utcp.searchTools('fogo');

    expect(Array.isArray(tools)).toBe(true);
    expect(tools.map(({ name }) => name)).toEqual(expect.arrayContaining([
      'vost_prociv.get_all',
      'vost_fires.get_important',
    ]));
  });

  test('todas as tools dos manuais estão na allowlist', () => {
    getAllToolNames().forEach((name) => {
      expect(isAllowed(name)).toBe(true);
      expect(ALLOWED_TOOLS).toContain(name);
    });
  });

  test('rejeita tool fora da allowlist sem a executar', async () => {
    await expect(utcp.callTool('Twitter.post', { status: 'teste' }))
      .rejects.toThrow('Tool não permitida');
    await expect(utcp.callTool('vost_journal.checkNewDecrees', {}))
      .rejects.toThrow('Tool não permitida');
  });

  test('não regista ferramentas de escrita nem publicação', () => {
    const names = getAllToolNames().join(' ').toLowerCase();

    expect(names).not.toMatch(/post|publish|update|upload|send|notify|write|delete|create|ftp|spreadsheet/);
  });

  test('manuais não contêm credenciais escritas', () => {
    const manuals = JSON.stringify([vostManual, httpManual]);

    expect(manuals).not.toMatch(/\$\{/);
    expect(manuals).not.toMatch(/sk-[A-Za-z0-9]/);
  });

  test('rejeita argumentos com chaves sensíveis', async () => {
    await expect(utcp.callTool('vost_prociv.get_all', { apiKey: 'teste' }))
      .rejects.toThrow('dados sensíveis');
  });
});
