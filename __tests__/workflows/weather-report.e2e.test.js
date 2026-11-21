const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');

const mockReportImages = {
  pt: Readable.from([Buffer.from('portugal report image')]),
  mad: Readable.from([Buffer.from('madeira report image')]),
  az: Readable.from([Buffer.from('azores report image')]),
};
const mockFetchReportImages = jest.fn();
const mockGetReportUrls = jest.fn();

jest.mock('../../src/api', () => ({
  WeatherApi: {
    getDailyReportImg: mockFetchReportImages,
    getDailyReportURL: mockGetReportUrls,
  },
}));

jest.mock('../../config/bot', () => ({
  channels: {
    WARNINGS_CHANNEL_ID: 'channel-mainland',
    WARNINGS_MD_CHANNEL_ID: 'channel-madeira',
    WARNINGS_AZ_CHANNEL_ID: 'channel-azores',
  },
}));

jest.mock('../../config/telegram', () => ({
  telegramKeys: { chat_id: '@vostpt-test' },
  telegramKeysRally: { key: 'rally-test-token', chat_id: '@rally-test' },
}));

const originalPublishMode = process.env.PUBLISH_MODE;
const originalLogFile = process.env.PUBLISH_LOG_FILE;
process.env.PUBLISH_MODE = 'dry-run';
const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'vost-weather-e2e-'));
const publicationLog = path.join(outputDirectory, 'publications.jsonl');
process.env.PUBLISH_LOG_FILE = publicationLog;

const Weather = require('../../src/services/Weather');

describe('daily weather report end-to-end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync(publicationLog, '');
    mockFetchReportImages.mockResolvedValue(mockReportImages);
    mockGetReportUrls.mockReturnValue({
      pt: 'https://images.test/weather-pt.png',
      mad: 'https://images.test/weather-mad.png',
      az: 'https://images.test/weather-az.png',
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

  test('builds regional reports and logs all intended social and Discord posts', async () => {
    const client = {
      channels: {
        cache: new Map(),
        fetch: jest.fn(async (id) => ({ id, name: `shadow-${id}` })),
      },
    };

    await Weather.getDailyReport(client);

    const entries = fs.readFileSync(publicationLog, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    const byDestination = entries.reduce((result, entry) => {
      result[entry.destination] = [...(result[entry.destination] || []), entry];
      return result;
    }, {});

    expect(byDestination.discord).toHaveLength(3);
    expect(byDestination.twitter).toHaveLength(2);
    expect(byDestination.mastodon).toHaveLength(3);
    expect(byDestination.telegram).toHaveLength(3);
    expect(byDestination.bluesky).toHaveLength(3);
    expect(entries.every((entry) => entry.mode === 'dry-run')).toBe(true);

    expect(byDestination.discord.map(({ payload }) => payload.channelId)).toEqual([
      'channel-mainland',
      'channel-madeira',
      'channel-azores',
    ]);
    expect(byDestination.twitter.map(({ payload }) => payload.account)).toEqual(['main', 'azores']);
    expect(byDestination.facebook).toBeUndefined();

    expect(byDestination.bluesky[0].payload).toMatchObject({
      text: expect.stringContaining('Portugal Continental'),
      media: 'https://images.test/weather-pt.png',
      description: 'Métricas de Extremos Diários Verificados pelas estações do IPMA',
    });
    expect(byDestination.telegram[1].payload).toMatchObject({
      chatId: '@vostpt-test',
      photoURL: 'https://images.test/weather-mad.png',
      options: { caption: expect.stringContaining('Madeira') },
    });
    expect(byDestination.mastodon[2].payload.text).toContain('Açores');
    expect(client.channels.fetch).toHaveBeenCalledTimes(3);
  });
});
