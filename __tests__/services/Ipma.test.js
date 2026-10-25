const mockFetchWarnings = jest.fn();
const mockPostNewWarning = jest.fn();
const mockFindOne = jest.fn();
const mockCreateWarning = jest.fn();
const mockUploadThreadTwitter = jest.fn();
const mockGetChannel = jest.fn();
const mockSendMessageToChannel = jest.fn();
const mockSendMessagesTelegram = jest.fn();
const mockSendPostMastodon = jest.fn();
const mockPostMessageFacebook = jest.fn();
const mockSendPostsToBsky = jest.fn();

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
    WARNINGS_CHANNEL_ID: 'mainland-warnings',
    WARNINGS_AZ_CHANNEL_ID: 'azores-warnings',
    WARNINGS_MD_CHANNEL_ID: 'madeira-warnings',
  },
}));

jest.mock('../../config/api', () => ({
  baseImagesURL: 'https://example.test/images',
}));

jest.mock('../../config/telegram', () => ({
  telegramKeys: { chat_id: '@vostpt-test' },
}));

jest.mock('../../src/services/Twitter', () => ({
  uploadThreadTwitter: mockUploadThreadTwitter,
}));

jest.mock('../../src/services/Discord', () => ({
  getChannel: mockGetChannel,
  sendMessageToChannel: mockSendMessageToChannel,
}));

jest.mock('../../src/services/Telegram', () => ({
  sendMessagesTelegram: mockSendMessagesTelegram,
}));

jest.mock('../../src/services/Mastodon', () => ({
  sendPostMastodon: mockSendPostMastodon,
}));

jest.mock('../../src/services/Facebook', () => ({
  postMessageFacebook: mockPostMessageFacebook,
}));

jest.mock('../../src/services/Bsky', () => ({
  sendPostsToBsky: mockSendPostsToBsky,
}));

const Ipma = require('../../src/services/Ipma');

const makeWarning = (overrides = {}) => ({
  idAreaAviso: 'LSB',
  awarenessTypeName: 'Vento',
  awarenessLevelID: 'orange',
  startTime: '2030-01-01 10:00',
  endTime: '2030-01-01 18:00',
  end: '2030-01-01T18:00:00.000Z',
  ...overrides,
});

describe('IPMA warning publication workflow', () => {
  const discordClient = { id: 'shadow-discord-client' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWarnings.mockResolvedValue([makeWarning()]);
    mockFindOne.mockResolvedValue(null);
    mockCreateWarning.mockResolvedValue(undefined);
    mockPostNewWarning.mockResolvedValue({ status: 200 });
    mockUploadThreadTwitter.mockResolvedValue(undefined);
    mockGetChannel.mockImplementation(async (_client, id) => ({ id }));
    mockSendMessageToChannel.mockResolvedValue(undefined);
    mockSendMessagesTelegram.mockResolvedValue(undefined);
    mockSendPostMastodon.mockResolvedValue(undefined);
    mockPostMessageFacebook.mockResolvedValue(undefined);
    mockSendPostsToBsky.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('publishes a mainland orange warning to all configured destinations', async () => {
    await Ipma.getWarnings(discordClient);

    expect(mockCreateWarning).toHaveBeenCalledWith(expect.objectContaining({
      idAreaAviso: 'LSB',
      awarenessLevelID: 'orange',
    }));
    expect(mockGetChannel).toHaveBeenCalledWith(discordClient, 'mainland-warnings');
    expect(mockSendMessageToChannel).toHaveBeenCalledWith(
      { id: 'mainland-warnings' },
      expect.stringContaining('#AvisoLaranja devido a #Vento'),
    );

    expect(mockUploadThreadTwitter).toHaveBeenCalledWith([
      expect.objectContaining({
        status: expect.stringContaining('#AvisoLaranja devido a #Vento'),
        media: ['warnings/Twitter_Post_AvisoLaranja_Vento.png'],
      }),
    ], '', 'main');
    expect(mockPostMessageFacebook).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('#AvisoLaranja devido a #Vento'),
      media: 'warnings/Twitter_Post_AvisoLaranja_Vento.png',
    }));

    expect(mockSendMessagesTelegram).toHaveBeenCalledWith([
      expect.objectContaining({
        chatId: '@vostpt-test',
        photoURL: 'https://example.test/images/warnings/Twitter_Post_AvisoLaranja_Vento.png',
      }),
    ]);
    expect(mockSendPostMastodon).toHaveBeenCalledWith(expect.objectContaining({
      status: expect.stringContaining('#AvisoLaranja devido a #Vento'),
    }), 'main');
    expect(mockSendPostsToBsky).toHaveBeenCalledWith([
      expect.objectContaining({
        message: expect.stringContaining('#AvisoLaranja devido a #Vento'),
      }),
    ]);
    expect(mockPostNewWarning).toHaveBeenCalledWith(expect.objectContaining({
      awarenessTypeName: 'Vento',
      regions: ['LSB'],
    }));
  });

  test('does not send mainland yellow warnings to Twitter or Facebook', async () => {
    mockFetchWarnings.mockResolvedValue([
      makeWarning({ awarenessLevelID: 'yellow' }),
    ]);

    await Ipma.getWarnings(discordClient);

    expect(mockSendMessageToChannel).toHaveBeenCalledWith(
      { id: 'mainland-warnings' },
      expect.stringContaining('#AvisoAmarelo devido a #Vento'),
    );
    expect(mockUploadThreadTwitter).not.toHaveBeenCalled();
    expect(mockPostMessageFacebook).not.toHaveBeenCalled();
    expect(mockSendMessagesTelegram).toHaveBeenCalledTimes(1);
    expect(mockSendPostMastodon).toHaveBeenCalledTimes(1);
    expect(mockSendPostsToBsky).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['yellow', 'ACE', 'azores-warnings', 'azores'],
    ['red', 'MCN', 'madeira-warnings', null],
  ])('routes %s warnings for %s to the correct region', async (
    level,
    area,
    channelId,
    twitterAccount,
  ) => {
    mockFetchWarnings.mockResolvedValue([
      makeWarning({ idAreaAviso: area, awarenessLevelID: level }),
    ]);

    await Ipma.getWarnings(discordClient);

    expect(mockGetChannel).toHaveBeenCalledWith(discordClient, channelId);
    expect(mockSendMessageToChannel).toHaveBeenCalledWith(
      { id: channelId },
      expect.stringContaining(`#Aviso${level === 'yellow' ? 'Amarelo' : 'Vermelho'}`),
    );

    if (twitterAccount) {
      expect(mockUploadThreadTwitter).toHaveBeenCalledWith(expect.any(Array), '', twitterAccount);
    } else {
      expect(mockUploadThreadTwitter).not.toHaveBeenCalled();
    }
    if (level === 'red') {
      expect(mockPostMessageFacebook).toHaveBeenCalledTimes(1);
    }
  });

  test('ignores expired warnings and warnings already stored in the database', async () => {
    mockFetchWarnings.mockResolvedValue([
      makeWarning({ end: '2000-01-01T00:00:00.000Z' }),
      makeWarning({ idAreaAviso: 'PTO' }),
    ]);
    mockFindOne.mockResolvedValue({ id: 'already-recorded' });

    await Ipma.getWarnings(discordClient);

    expect(mockCreateWarning).not.toHaveBeenCalled();
    expect(mockSendMessageToChannel).not.toHaveBeenCalled();
    expect(mockUploadThreadTwitter).not.toHaveBeenCalled();
    expect(mockPostMessageFacebook).not.toHaveBeenCalled();
  });

  test('keeps other warning destinations running when Facebook fails', async () => {
    mockPostMessageFacebook.mockRejectedValue(new Error('Facebook unavailable'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(Ipma.getWarnings(discordClient)).resolves.toBeUndefined();

    expect(mockPostMessageFacebook).toHaveBeenCalledTimes(1);
    expect(mockUploadThreadTwitter).toHaveBeenCalledTimes(1);
    expect(mockSendMessagesTelegram).toHaveBeenCalledTimes(1);
    expect(mockSendPostMastodon).toHaveBeenCalledTimes(1);
    expect(mockSendPostsToBsky).toHaveBeenCalledTimes(1);
    expect(mockPostNewWarning).toHaveBeenCalledTimes(1);
  });
});
