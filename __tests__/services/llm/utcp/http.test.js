const nock = require('nock');

const utcp = require('../../../../src/services/llm/utcp/client');
const { httpManual } = require('../../../../src/services/llm/utcp/manuals');
const { isAllowed } = require('../../../../src/services/llm/utcp/allowlist');

beforeEach(() => {
  nock.cleanAll();
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
});

afterAll(() => {
  nock.enableNetConnect();
  nock.cleanAll();
});

describe('tools HTTP', () => {
  test('todas as tools HTTP usam GET e estão na allowlist', async () => {
    httpManual.tools.forEach((tool) => {
      expect(tool.tool_call_template.http_method).toBe('GET');
      expect(isAllowed(tool.name)).toBe(true);
    });

    const found = await utcp.searchTools('relatorio tempo', 50);
    expect(found.map(({ name }) => name)).toEqual(expect.arrayContaining([
      'vost_http.weather_report_pt',
      'vost_http.fire_risk_map',
    ]));
  });

  test('substitui argumento no URL e devolve a resposta', async () => {
    const scope = nock('https://api.vost.pt')
      .get('/v1/acronyms/')
      .query({ search: 'vost', exact: '1' })
      .reply(200, [{ acronym: 'VOST', meaning: 'Voluntários' }]);

    const result = await utcp.callTool('vost_http.acronym_lookup', { search: 'vost' });

    expect(result).toEqual([{ acronym: 'VOST', meaning: 'Voluntários' }]);
    expect(scope.isDone()).toBe(true);
  });

  test('propaga 404 e 500 como erro, sem devolver dados vazios', async () => {
    nock('https://api.vost.pt').get('/v1/acronyms/').query(true).reply(404, { error: 'não encontrado' });

    await expect(utcp.callTool('vost_http.acronym_lookup', { search: 'xyz' }))
      .rejects.toThrow();

    nock('https://api.vost.pt').get('/v1/acronyms/').query(true).reply(500, { error: 'falha' });

    await expect(utcp.callTool('vost_http.acronym_lookup', { search: 'xyz' }))
      .rejects.toThrow();
  });

  test('manual não contém credenciais nem URLs HTTP inseguras', () => {
    const manual = JSON.stringify(httpManual);

    expect(manual).not.toMatch(/\$\{/);
    expect(manual).not.toMatch(/"url": "http:\/\//);
  });
});
