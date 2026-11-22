const { createVostWrappers } = require('../../src/tools/vost');

describe('tools/vost', () => {
  const mockServices = {
    Prociv: {
      getAll: jest.fn().mockResolvedValue([{ id: 1 }]),
      getById: jest.fn().mockResolvedValue({ id: 2 }),
      getByCityAndLocal: jest.fn().mockResolvedValue([{ id: 3 }]),
      filterByStatus: jest.fn().mockResolvedValue([{ id: 4 }]),
    },
    Fires: {
      getImportantForestFires: jest.fn().mockResolvedValue([{ id: 5 }]),
      getByDistrict: jest.fn().mockResolvedValue([{ id: 6 }]),
    },
    Earthquakes: {
      getByDate: jest.fn().mockResolvedValue([{ id: 7 }]),
    },
    Weather: {
      getByDay: jest.fn().mockResolvedValue([{ id: 8 }]),
    },
    Acronyms: {
      getExactAcronym: jest.fn().mockResolvedValue([{ id: 9 }]),
    },
    Sns: {
      getAlerts: jest.fn().mockResolvedValue([{ id: 10 }]),
    },
    Corona: {
      getAll: jest.fn().mockResolvedValue([{ id: 11 }]),
      getResume: jest.fn().mockResolvedValue({ id: 12 }),
    },
  };

  const mockApis = {
    IpmaApi: {
      fetch: jest.fn().mockResolvedValue([{ id: 13 }]),
    },
    MeteoAlarmApi: {
      fetch: jest.fn().mockResolvedValue({ portugal: [{ id: 14 }] }),
    },
    JournalApi: {
      getJournal: jest.fn().mockResolvedValue([]),
    },
  };

  const wrappers = createVostWrappers({ services: mockServices, apis: mockApis });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('vost_prociv.get_all chama Prociv.getAll', async () => {
    await wrappers['vost_prociv.get_all']({ limit: 5 });
    expect(mockServices.Prociv.getAll).toHaveBeenCalled();
  });

  test('vost_prociv.get_by_id chama Prociv.getById com id', async () => {
    await wrappers['vost_prociv.get_by_id']({ id: 'ABC123' });
    expect(mockServices.Prociv.getById).toHaveBeenCalledWith('ABC123');
  });

  test('vost_prociv.get_by_city chama Prociv.getByCityAndLocal em minúsculas', async () => {
    await wrappers['vost_prociv.get_by_city']({ city: 'Lisboa' });
    expect(mockServices.Prociv.getByCityAndLocal).toHaveBeenCalledWith('lisboa');
  });

  test('vost_prociv.filter_by_status chama Prociv.filterByStatus', async () => {
    await wrappers['vost_prociv.filter_by_status']({ status: 'Ativa' });
    expect(mockServices.Prociv.filterByStatus).toHaveBeenCalledWith('Ativa');
  });

  test('vost_fires.get_important chama Fires.getImportantForestFires', async () => {
    await wrappers['vost_fires.get_important']({ limit: 5 });
    expect(mockServices.Fires.getImportantForestFires).toHaveBeenCalled();
  });

  test('vost_fires.get_by_district chama Fires.getByDistrict', async () => {
    await wrappers['vost_fires.get_by_district']({ district: 'Lisboa' });
    expect(mockServices.Fires.getByDistrict).toHaveBeenCalledWith('Lisboa');
  });

  test('vost_ipma.get_current_warnings chama IpmaApi.fetch', async () => {
    await wrappers['vost_ipma.get_current_warnings']({ limit: 5 });
    expect(mockApis.IpmaApi.fetch).toHaveBeenCalled();
  });

  test('vost_meteoalarm.get_current devolve warnings por país', async () => {
    const result = await wrappers['vost_meteoalarm.get_current']({ country: 'portugal', limit: 5 });
    expect(result.available).toBe(true);
    expect(result.data).toEqual([{ id: 14 }]);
  });

  test('vost_earthquakes.get_by_date chama Earthquakes.getByDate com data PT', async () => {
    await wrappers['vost_earthquakes.get_by_date']({ date: '2024-03-15' });
    expect(mockServices.Earthquakes.getByDate).toHaveBeenCalled();
  });

  test('vost_weather.get_by_day chama Weather.getByDay', async () => {
    await wrappers['vost_weather.get_by_day']({ day: 1 });
    expect(mockServices.Weather.getByDay).toHaveBeenCalledWith(1);
  });

  test('vost_acronyms.get_exact chama Acronyms.getExactAcronym', async () => {
    await wrappers['vost_acronyms.get_exact']({ acronym: 'ANPC' });
    expect(mockServices.Acronyms.getExactAcronym).toHaveBeenCalledWith('ANPC');
  });

  test('vost_sns.get_alerts chama Sns.getAlerts', async () => {
    await wrappers['vost_sns.get_alerts']({ limit: 5 });
    expect(mockServices.Sns.getAlerts).toHaveBeenCalled();
  });

  test('vost_corona.get_all chama Corona.getAll', async () => {
    await wrappers['vost_corona.get_all']({ limit: 5 });
    expect(mockServices.Corona.getAll).toHaveBeenCalled();
  });

  test('vost_corona.get_resume chama Corona.getResume', async () => {
    await wrappers['vost_corona.get_resume']({ date: '20240315' });
    expect(mockServices.Corona.getResume).toHaveBeenCalledWith('20240315');
  });

  test('vost_journal.get_recent chama JournalApi.getJournal', async () => {
    const result = await wrappers['vost_journal.get_recent']({ limit: 5 });
    expect(mockApis.JournalApi.getJournal).toHaveBeenCalled();
    expect(result.available).toBe(true);
  });

  test('tools devolvem unavailableResult para datas no passado', async () => {
    const result = await wrappers['vost_prociv.get_all']({
      date: '2020-01-01',
    });
    expect(result.available).toBe(false);
    expect(result.reason).toBe('sem dados históricos');
    expect(mockServices.Prociv.getAll).not.toHaveBeenCalled();
  });
});
