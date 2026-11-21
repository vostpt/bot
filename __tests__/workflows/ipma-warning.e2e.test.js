const fs = require('fs');
const os = require('os');
const path = require('path');

const warning = {
  idAreaAviso: 'LSB',
  awarenessTypeName: 'Vento',
  awarenessLevelID: 'orange',
  startTime: '2030-01-01 10:00',
  endTime: '2030-01-01 18:00',
  end: '2030-01-01T18:00:00.000Z',
};

const mockFindOne = jest.fn();
const mockCreateWarning = jest.fn();
const mockFetchWarnings = jest.fn();
const mockPostNewWarning = jest.fn();

jest.mock('../../src/api', () => ({
  IpmaApi: { fetch: mockFetchWarnings },
  WarningsApi: { postNewWarning: mockPostNewWarning },
}));

jest.mock('../../src/database/models', () => ({
  db: {
    IpmaWarnings: {
      findOne: mockFindOne,
      create: mockCreateWarning,
    },
  },
  Op: { lte: Symbol('lte') },
}));

jest.mock('../../config/bot', () => ({
  channels: {
    WARNINGS_CHANNEL_ID: 'channel-mainland',
    WARNINGS_AZ_CHANNEL_ID: 'channel-azores',
    WARNINGS_MD_CHANNEL_ID: 'channel-madeira',
  },
}));

const originalPublishMode = process.env.PUBLISH_MODE;
const originalLogFile = process.env.PUBLISH_LOG_FILE;
process.env.PUBLISH_MODE = 'dry-run';
const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'vost-ipma-e2e-'));
const publicationLog = path.join(outputDirectory, 'publications.jsonl');
process.env.PUBLISH_LOG_FILE = publicationLog;

const Ipma = require('../../src/services/Ipma');

describe('IPMA warning to publication log end-to-end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync(publicationLog, '');
    mockFetchWarnings.mockResolvedValue([warning]);
    mockFindOne.mockResolvedValue(null);
    mockCreateWarning.mockResolvedValue(undefined);
    mockPostNewWarning.mockResolvedValue({ status: 200 });
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

  test('builds an orange warning and logs each intended destination without sending', async () => {
    const client = {
      channels: {
        cache: new Map(),
        fetch: jest.fn(async (id) => ({ id, name: `shadow-${id}` })),
      },
    };

    await Ipma.getWarnings(client);

    const entries = fs.readFileSync(publicationLog, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    const destinations = entries.map((entry) => entry.destination);

    expect(destinations).toEqual(expect.arrayContaining([
      'discord',
      'twitter',
      'facebook',
      'telegram',
      'mastodon',
      'bluesky',
    ]));
    expect(entries.every((entry) => entry.mode === 'dry-run')).toBe(true);

    const facebookEntry = entries.find((entry) => entry.destination === 'facebook');
    expect(facebookEntry.payload).toMatchObject({
      account: 'main',
      message: expect.stringContaining('#AvisoLaranja devido a #Vento'),
      media: 'warnings/Twitter_Post_AvisoLaranja_Vento.png',
    });

    const twitterEntry = entries.find((entry) => entry.destination === 'twitter');
    expect(twitterEntry.payload).toMatchObject({
      account: 'main',
      sequence: 1,
      text: expect.stringContaining('#AvisoLaranja devido a #Vento'),
    });

    const discordEntry = entries.find((entry) => entry.destination === 'discord');
    expect(discordEntry.payload).toMatchObject({
      channelId: 'channel-mainland',
      text: expect.stringContaining('Novos Avisos do Continente'),
    });

    expect(client.channels.fetch).toHaveBeenCalledWith('channel-mainland');
    expect(mockCreateWarning).toHaveBeenCalledTimes(1);
  });
});
