const mockAxiosGet = jest.fn();
const mockScheduledCallbacks = [];

jest.mock('axios', () => ({ get: mockAxiosGet }));

jest.mock('node-schedule', () => ({
  RecurrenceRule: jest.fn(() => ({})),
  Range: jest.fn((...values) => values),
  scheduleJob: jest.fn((_rule, callback) => {
    mockScheduledCallbacks.push(callback);
    return { cancel: jest.fn() };
  }),
}));

jest.mock('../../src/services', () => ({}));

jest.mock('../../config/bot', () => ({
  channels: { FIRES_CHANNEL_ID: 'channel-fire-risk' },
}));

const fireRiskPage = [
  'var concPT={"type":"FeatureCollection","features":[{"type":"Feature","properties":{"DICO":"0101"},"geometry":{"type":"Polygon","coordinates":[[[-8.9,41.2],[-8.8,41.2],[-8.8,41.3],[-8.9,41.3],[-8.9,41.2]]]}}]};',
  'var rcmF=[];',
  'rcmF[0]={"dataPrev":"2030-01-01","local":{"0101":{"data":{"rcm":4}}}};',
].join('');

const Jobs = require('../../src/jobs');

describe('scheduled fire-risk map workflow end-to-end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScheduledCallbacks.length = 0;
    mockAxiosGet.mockResolvedValue({ data: fireRiskPage });
  });

  test('fetches and renders the risk map, then sends it to the configured Discord channel', async () => {
    const send = jest.fn().mockResolvedValue({ id: 'sent' });
    const client = {
      channels: {
        fetch: jest.fn().mockResolvedValue({ send }),
      },
    };
    const jobs = new Jobs(client);

    jobs.fireRisk();
    expect(mockScheduledCallbacks).toHaveLength(1);
    await mockScheduledCallbacks[0]();

    expect(mockAxiosGet).toHaveBeenCalledWith('https://www.ipma.pt/pt/riscoincendio/rcm.pt/');
    expect(client.channels.fetch).toHaveBeenCalledWith('channel-fire-risk');
    expect(send).toHaveBeenCalledTimes(1);

    const [payload] = send.mock.calls[0];
    expect(payload.content).toBe('🔥 Risco de Incêndio para hoje');
    expect(payload.files[0].name).toBe('rcm_map.png');
    expect(Buffer.isBuffer(payload.files[0].attachment)).toBe(true);
    expect(payload.files[0].attachment.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  });
});
