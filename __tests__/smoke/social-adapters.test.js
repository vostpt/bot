const mockTwitterClient = {
  v1: { uploadMedia: jest.fn() },
  v2: { tweet: jest.fn() },
};

const originalTwitterEnvironment = {
  TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN_KEY: process.env.TWITTER_ACCESS_TOKEN_KEY,
  TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};

jest.mock('twitter-api-v2', () => ({
  TwitterApi: jest.fn(() => mockTwitterClient),
}));

const mockTelegramClient = {
  sendMessage: jest.fn(),
  sendPhoto: jest.fn(),
  sendDocument: jest.fn(),
};

jest.mock('messaging-api-telegram', () => ({
  TelegramClient: jest.fn(() => mockTelegramClient),
}));

describe('social adapter smoke tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    Object.entries(originalTwitterEnvironment).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  test('Twitter sends every text item in a thread in order', async () => {
    jest.resetModules();
    process.env.TWITTER_CONSUMER_KEY = 'key';
    process.env.TWITTER_CONSUMER_SECRET = 'secret';
    process.env.TWITTER_ACCESS_TOKEN_KEY = 'token';
    process.env.TWITTER_ACCESS_TOKEN_SECRET = 'token-secret';
    mockTwitterClient.v2.tweet.mockResolvedValue({ data: {} });
    const { uploadThreadTwitter } = require('../../src/services/Twitter');

    await uploadThreadTwitter([{ status: 'first' }, { status: 'second' }]);

    expect(mockTwitterClient.v2.tweet.mock.calls).toEqual([
      [{ text: 'first', media: undefined }],
      [{ text: 'second', media: undefined }],
    ]);
  });

  test('Telegram batch sending does not mutate caller data', async () => {
    jest.resetModules();
    const { sendMessagesTelegram } = require('../../src/services/Telegram');
    const messages = [
      { chatId: '123', text: 'first', options: {} },
      { chatId: '123', text: 'second', options: {} },
    ];
    const original = JSON.parse(JSON.stringify(messages));

    await sendMessagesTelegram(messages);

    expect(messages).toEqual(original);
    expect(mockTelegramClient.sendMessage).toHaveBeenCalledTimes(2);
  });

  test('Telegram accepts an empty publication batch', async () => {
    jest.resetModules();
    const { sendMessagesTelegram } = require('../../src/services/Telegram');

    await expect(sendMessagesTelegram([])).resolves.toBeUndefined();
    expect(mockTelegramClient.sendMessage).not.toHaveBeenCalled();
  });
});
