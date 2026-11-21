const fs = require('fs');
const os = require('os');
const path = require('path');

const mockGetJournal = jest.fn();
const mockFindDecree = jest.fn();
const mockSaveDecree = jest.fn();

jest.mock('../../src/api', () => ({
  JournalApi: { getJournal: mockGetJournal },
}));

jest.mock('../../config/bot', () => ({
  channels: { JOURNAL_CHANNEL_ID: 'channel-journal' },
}));

jest.mock('../../src/database/models', () => ({
  db: {
    Decrees: {
      findOne: mockFindDecree,
      create: mockSaveDecree,
    },
  },
  Op: { lte: Symbol('lte') },
}));

const originalPublishMode = process.env.PUBLISH_MODE;
const originalLogFile = process.env.PUBLISH_LOG_FILE;
process.env.PUBLISH_MODE = 'dry-run';
const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'vost-journal-e2e-'));
const publicationLog = path.join(outputDirectory, 'publications.jsonl');
process.env.PUBLISH_LOG_FILE = publicationLog;

const Journal = require('../../src/services/Journal');

describe('Official Journal workflow end-to-end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync(publicationLog, '');
    mockGetJournal.mockResolvedValue([
      {
        serie: 1,
        title: 'A new regulation',
        link: 'https://diariodarepublica.pt/decree/1',
        contentSnippet: 'ADMINISTRAÇÃO INTERNA\nA regulation description.',
      },
      {
        serie: 2,
        title: 'A second-series notice',
        link: 'https://diariodarepublica.pt/decree/2',
        contentSnippet: 'CULTURA\nA notice description.',
      },
    ]);
    mockFindDecree.mockResolvedValue(null);
    mockSaveDecree.mockResolvedValue(undefined);
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

  test('formats new decrees and publishes each to its intended destinations', async () => {
    const client = {
      channels: {
        cache: new Map(),
        fetch: jest.fn(async (id) => ({ id, name: 'journal' })),
      },
    };

    await Journal.checkNewDecrees(client);

    const entries = fs.readFileSync(publicationLog, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    const byDestination = entries.reduce((result, entry) => {
      result[entry.destination] = [...(result[entry.destination] || []), entry];
      return result;
    }, {});

    expect(byDestination.discord).toHaveLength(1);
    expect(byDestination.twitter).toHaveLength(1);
    expect(byDestination.mastodon).toHaveLength(1);
    expect(byDestination.facebook).toBeUndefined();
    expect(byDestination.discord[0].payload).toMatchObject({
      channelId: 'channel-journal',
      text: expect.stringContaining('A second-series notice'),
    });
    expect(byDestination.twitter[0].payload).toMatchObject({
      account: 'dre',
      text: expect.stringContaining('A new regulation'),
    });
    expect(byDestination.mastodon[0].payload).toMatchObject({
      account: 'dre',
      text: expect.stringContaining('A new regulation'),
    });
    expect(mockSaveDecree).toHaveBeenCalledTimes(2);
    expect(client.channels.fetch).toHaveBeenCalledWith('channel-journal');
  });

  test('does not republish decrees already stored in the local database', async () => {
    mockFindDecree.mockResolvedValue({ id: 'already-stored' });
    const client = {
      channels: {
        cache: new Map(),
        fetch: jest.fn(async (id) => ({ id, name: 'journal' })),
      },
    };

    await Journal.checkNewDecrees(client);

    expect(fs.readFileSync(publicationLog, 'utf8')).toBe('');
    expect(mockSaveDecree).not.toHaveBeenCalled();
    expect(client.channels.fetch).not.toHaveBeenCalled();
  });
});
