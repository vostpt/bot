jest.mock('../../../../src/services', () => ({
  Prociv: {
    getAll: jest.fn(),
    getById: jest.fn(),
    getByCityAndLocal: jest.fn(),
    filterByStatus: jest.fn(),
  },
  Fires: {
    getImportantForestFires: jest.fn(),
    getByDistrict: jest.fn(),
  },
  Ipma: { getWarnings: jest.fn() },
  Earthquakes: { getByDate: jest.fn() },
  Weather: { getByDay: jest.fn() },
  Acronyms: { getExactAcronym: jest.fn() },
  Sns: { getAlerts: jest.fn() },
  Corona: { getAll: jest.fn(), getResume: jest.fn() },
  Journal: { checkNewDecrees: jest.fn() },
}));

jest.mock('../../../../src/api', () => ({
  IpmaApi: { fetch: jest.fn() },
  MeteoAlarmApi: { fetch: jest.fn() },
  JournalApi: { getJournal: jest.fn() },
}));

jest.mock('../../../../src/database/models', () => ({
  db: { Decrees: { create: jest.fn() } },
}));

const services = require('../../../../src/services');
const apis = require('../../../../src/api');
const { db } = require('../../../../src/database/models');
const utcp = require('../../../../src/services/llm/utcp/client');

const occurrences = Array.from({ length: 60 }, (_, index) => ({ id: String(index), l: 'Lisboa', s: 'Centro' }));

beforeEach(() => {
  jest.clearAllMocks();
  services.Prociv.getAll.mockResolvedValue(occurrences);
  services.Prociv.getById.mockResolvedValue([occurrences[0]]);
  services.Prociv.getByCityAndLocal.mockResolvedValue([occurrences[0]]);
  services.Prociv.filterByStatus.mockResolvedValue([occurrences[1]]);
  services.Fires.getImportantForestFires.mockResolvedValue(occurrences.slice(0, 3));
  services.Fires.getByDistrict.mockResolvedValue(occurrences.slice(0, 2));
  services.Earthquakes.getByDate.mockResolvedValue([{ time: '2026-01-01T10:00:00Z', magnitud: 2.1 }]);
  services.Weather.getByDay.mockResolvedValue([{ local: 'Lisboa', tMax: 20 }]);
  services.Acronyms.getExactAcronym.mockResolvedValue([{ acronym: 'VOST', meaning: 'Voluntários' }]);
  services.Sns.getAlerts.mockResolvedValue([{ title: 'Alerta' }]);
  services.Corona.getAll.mockResolvedValue([{ title: 'Relatório' }]);
  services.Corona.getResume.mockResolvedValue({ resume: 'Resumo' });
  apis.IpmaApi.fetch.mockResolvedValue([{ awarenessTypeName: 'Vento' }]);
  apis.MeteoAlarmApi.fetch.mockResolvedValue({ portugal: [{ type: 'wind', severity: 'orange' }] });
  apis.JournalApi.getJournal.mockResolvedValue([{ title: 'Decreto', pubDate: new Date().toUTCString() }]);
});

describe('tools direct-call read-only', () => {
  test('todas as tools de leitura aparecem em searchTools', async () => {
    const found = await utcp.searchTools('vost', 50);

    [
      'vost_prociv.get_all',
      'vost_prociv.get_by_id',
      'vost_prociv.get_by_city',
      'vost_prociv.filter_by_status',
      'vost_fires.get_important',
      'vost_fires.get_by_district',
      'vost_ipma.get_current_warnings',
      'vost_meteoalarm.get_current',
      'vost_earthquakes.get_by_date',
      'vost_weather.get_by_day',
      'vost_acronyms.get_exact',
      'vost_sns.get_alerts',
      'vost_corona.get_all',
      'vost_corona.get_resume',
      'vost_journal.get_recent',
    ].forEach((name) => expect(found.map((tool) => tool.name)).toContain(name));
  });

  test('normaliza resultado e aplica limite padrão e máximo', async () => {
    const result = await utcp.callTool('vost_prociv.get_all', {});

    expect(result).toMatchObject({ source: 'prociv', available: true });
    expect(result.data).toHaveLength(10);
    expect(Number.isNaN(Date.parse(result.retrievedAt))).toBe(false);

    const limited = await utcp.callTool('vost_prociv.get_all', { limit: 2 });
    expect(limited.data).toHaveLength(2);

    const clamped = await utcp.callTool('vost_prociv.get_all', { limit: 999 });
    expect(clamped.data).toHaveLength(50);
  });

  test('respeita filtros por id, cidade e estado', async () => {
    await utcp.callTool('vost_prociv.get_by_id', { id: '123' });
    expect(services.Prociv.getById).toHaveBeenCalledWith('123');

    await utcp.callTool('vost_prociv.get_by_city', { city: 'Lisboa', limit: 3 });
    expect(services.Prociv.getByCityAndLocal).toHaveBeenCalledWith('lisboa');

    await utcp.callTool('vost_prociv.filter_by_status', { status: 'curso', limit: 3 });
    expect(services.Prociv.filterByStatus).toHaveBeenCalledWith('curso');
  });

  test('período passado de fogos devolve available false sem chamar o serviço', async () => {
    const result = await utcp.callTool('vost_fires.get_important', {
      start: '2026-01-01T00:00:00Z',
      end: '2026-01-02T00:00:00Z',
    });

    expect(result).toMatchObject({
      source: 'fires',
      available: false,
      reason: 'sem dados históricos',
      data: [],
    });
    expect(services.Fires.getImportantForestFires).not.toHaveBeenCalled();
  });

  test('prociv com data passada também devolve available false', async () => {
    const result = await utcp.callTool('vost_prociv.get_all', { date: '01/01/2020' });

    expect(result.available).toBe(false);
    expect(result.reason).toBe('sem dados históricos');
    expect(services.Prociv.getAll).not.toHaveBeenCalled();
  });

  test('avisos IPMA usam fetch da API, nunca o serviço que publica', async () => {
    const result = await utcp.callTool('vost_ipma.get_current_warnings', { limit: 1 });

    expect(apis.IpmaApi.fetch).toHaveBeenCalledTimes(1);
    expect(services.Ipma.getWarnings).not.toHaveBeenCalled();
    expect(result).toMatchObject({ source: 'ipma', available: true });
    expect(result.data).toHaveLength(1);
  });

  test('MeteoAlarm devolve avisos do país pedido sem publicar', async () => {
    const result = await utcp.callTool('vost_meteoalarm.get_current', { country: 'portugal', limit: 1 });

    expect(apis.MeteoAlarmApi.fetch).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([{ type: 'wind', severity: 'orange' }]);
  });

  test('journal lê RSS recente sem gravar nem publicar', async () => {
    const result = await utcp.callTool('vost_journal.get_recent', { limit: 5 });

    expect(apis.JournalApi.getJournal).toHaveBeenCalledTimes(1);
    expect(db.Decrees.create).not.toHaveBeenCalled();
    expect(services.Journal.checkNewDecrees).not.toHaveBeenCalled();
    expect(result).toMatchObject({ source: 'dre', available: true });
  });

  test('journal com data antiga não inventa documentos', async () => {
    const result = await utcp.callTool('vost_journal.get_recent', { date: '01/01/2020', limit: 5 });

    expect(result.data).toEqual([]);
    expect(result.note).toMatch(/recentes/);
  });

  test('erro da fonte é propagado, não transformado em dados vazios', async () => {
    services.Prociv.getAll.mockRejectedValue(new Error('API indisponível'));

    await expect(utcp.callTool('vost_prociv.get_all', {}))
      .rejects.toThrow('API indisponível');
  });

  test('wrappers restantes devolvem dados limitados com fonte', async () => {
    const cases = [
      ['vost_earthquakes.get_by_date', { date: '01/01/2026' }, 'ipma-sismos'],
      ['vost_weather.get_by_day', { day: 0 }, 'ipma'],
      ['vost_acronyms.get_exact', { acronym: 'VOST' }, 'acronimos-vost'],
      ['vost_sns.get_alerts', {}, 'sns24'],
      ['vost_corona.get_all', {}, 'dgs'],
      ['vost_corona.get_resume', { date: '01/01/2026' }, 'dgs'],
      ['vost_fires.get_by_district', { district: 'Lisboa' }, 'fires'],
    ];

    for (const [name, args, source] of cases) {
      const result = await utcp.callTool(name, args);
      expect(result.source).toBe(source);
      expect(result.available).toBe(true);
    }
  });
});
