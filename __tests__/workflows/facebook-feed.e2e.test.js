const fs = require('fs');
const os = require('os');
const path = require('path');

const mockFacebookApi = jest.fn();
const mockFindFeedCursor = jest.fn();
const mockSaveFeedCursor = jest.fn();

jest.mock('fb', () => ({
  withAccessToken: jest.fn(() => ({ api: mockFacebookApi })),
}));

jest.mock('../../config/facebook', () => ({
  defaultReference: 'main',
  facebookKeys: [{
    reference: 'main',
    pageName: 'VOSTPT',
    fetchPosts: true,
    keys: { access_token: 'fixture-token' },
  }],
}));

jest.mock('../../config/bot', () => ({
  channels: { FBFEED_CHANNEL_ID: 'channel-facebook-feed' },
}));

jest.mock('../../src/database/models', () => ({
  db: {
    FbPosts: {
      findOne: mockFindFeedCursor,
      upsert: mockSaveFeedCursor,
    },
  },
}));

const originalPublishMode = process.env.PUBLISH_MODE;
const originalLogFile = process.env.PUBLISH_LOG_FILE;
process.env.PUBLISH_MODE = 'dry-run';
const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'vost-facebook-feed-e2e-'));
const publicationLog = path.join(outputDirectory, 'publications.jsonl');
process.env.PUBLISH_LOG_FILE = publicationLog;

const Facebook = require('../../src/services/Facebook');

describe('Facebook feed polling end-to-end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync(publicationLog, '');
    mockFindFeedCursor.mockResolvedValue({ lastPostId: 10 });
    mockSaveFeedCursor.mockResolvedValue(undefined);
    mockFacebookApi.mockImplementation((_path, method, _params, callback) => {
      expect(method).toBe('GET');
      callback({
        data: [
          { id: 'page_11', message: 'A new public update' },
          { id: 'page_10', message: 'Already processed' },
          { id: 'page_12', story: 'VOSTPT was live.' },
          { id: 'page_13', message: 'Second public update' },
        ],
      });
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

  test('forwards unseen feed posts to Discord and stores the latest feed cursor', async () => {
    const client = {
      channels: {
        cache: new Map(),
        fetch: jest.fn(async (id) => ({ id, name: 'facebook-feed' })),
      },
    };

    await Facebook.getVostPostsAndSendToDiscord(client);

    const entries = fs.readFileSync(publicationLog, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    const messages = entries.map((entry) => entry.payload.text);

    expect(entries).toHaveLength(3);
    expect(entries.every((entry) => entry.destination === 'discord')).toBe(true);
    expect(entries.every((entry) => entry.payload.channelId === 'channel-facebook-feed')).toBe(true);
    expect(messages[0]).toContain('2 novos posts');
    expect(messages.join('\n')).toContain('A new public update');
    expect(messages.join('\n')).toContain('Second public update');
    expect(messages.join('\n')).not.toContain('Already processed');
    expect(messages.join('\n')).not.toContain('was live');

    expect(mockSaveFeedCursor).toHaveBeenCalledWith({
      reference: 'main',
      lastPostId: 13,
    });
    expect(client.channels.fetch).toHaveBeenCalledWith('channel-facebook-feed');
  });

  test('does not forward posts older than the stored cursor', async () => {
    mockFindFeedCursor.mockResolvedValue({ lastPostId: 13 });
    const client = {
      channels: {
        cache: new Map(),
        fetch: jest.fn(async (id) => ({ id, name: 'facebook-feed' })),
      },
    };

    await Facebook.getVostPostsAndSendToDiscord(client);

    expect(fs.readFileSync(publicationLog, 'utf8')).toBe('');
    expect(client.channels.fetch).not.toHaveBeenCalled();
    expect(mockSaveFeedCursor).not.toHaveBeenCalled();
  });
});
