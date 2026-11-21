const fs = require('fs');
const os = require('os');
const path = require('path');

const mockGetFires = jest.fn();

jest.mock('../../src/api', () => ({
  FireApi: { getIF: mockGetFires },
}));

jest.mock('../../config/bot', () => ({
  channels: { FIRES_CHANNEL_ID: 'channel-fires' },
}));

const originalPublishMode = process.env.PUBLISH_MODE;
const originalLogFile = process.env.PUBLISH_LOG_FILE;
process.env.PUBLISH_MODE = 'dry-run';
const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'vost-fires-e2e-'));
const publicationLog = path.join(outputDirectory, 'publications.jsonl');
process.env.PUBLISH_LOG_FILE = publicationLog;

const Fires = require('../../src/services/Fires');

const fire = (id, type, overrides = {}) => ({
  id,
  tipo: type,
  d: '01/01 00:00',
  l: 'Lisboa',
  s: 'Centro',
  o: 100,
  t: 20,
  a: 1,
  e: 'Em curso',
  ea: 'Resolução',
  ...overrides,
});

describe('forest fire alerts end-to-end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync(publicationLog, '');
    mockGetFires.mockResolvedValue({
      data: [
        fire('001', '1'),
        fire('002', '1', { o: 10, l: 'Porto' }),
        fire('003', '2'),
        fire('004', '7'),
      ],
    });
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalPublishMode === undefined) delete process.env.PUBLISH_MODE;
    else process.env.PUBLISH_MODE = originalPublishMode;
    if (originalLogFile === undefined) delete process.env.PUBLISH_LOG_FILE;
    else process.env.PUBLISH_LOG_FILE = originalLogFile;
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  });

  test('groups new, severe, updated, and urgent events into Discord previews', async () => {
    const client = {
      channels: {
        cache: new Map(),
        fetch: jest.fn(async (id) => ({ id, name: 'fires' })),
      },
    };

    await Fires.getForestFires(client);

    const entries = fs.readFileSync(publicationLog, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    const messages = entries.map((entry) => entry.payload.text);

    expect(entries).toHaveLength(3);
    expect(entries.every((entry) => entry.destination === 'discord')).toBe(true);
    expect(entries.every((entry) => entry.payload.channelId === 'channel-fires')).toBe(true);
    expect(messages[0]).toContain('@here');
    expect(messages[0]).toContain('004');
    const newEvents = messages.find((message) => message.includes('Novas Ocorrências'));
    const updatedEvents = messages.find((message) => message.includes('Ocorrências actualizadas'));
    expect(newEvents).toContain('001');
    expect(newEvents).toContain('002');
    expect(updatedEvents).toContain('003');
    expect(client.channels.fetch).toHaveBeenCalledWith('channel-fires');
  });
});
