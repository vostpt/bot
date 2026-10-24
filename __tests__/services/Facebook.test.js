const mockApi = jest.fn();
const mockFindOne = jest.fn();
const mockUpsert = jest.fn();
const mockGetChannel = jest.fn();
const mockSendMessageToChannel = jest.fn();

jest.mock('fb', () => ({
  withAccessToken: jest.fn(() => ({ api: mockApi })),
}));

jest.mock('../../config/facebook', () => ({
  defaultReference: 'main',
  facebookKeys: [{
    reference: 'main',
    pageName: 'VOSTPT',
    fetchPosts: true,
    keys: { access_token: 'token' },
  }],
}));

jest.mock('../../src/database/models', () => ({
  db: {
    FbPosts: {
      findOne: mockFindOne,
      upsert: mockUpsert,
    },
  },
}));

jest.mock('../../src/services/Discord', () => ({
  getChannel: mockGetChannel,
  sendMessageToChannel: mockSendMessageToChannel,
}));

const Facebook = require('../../src/services/Facebook');

describe('Facebook adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockResolvedValue({ lastPostId: 1 });
    mockUpsert.mockResolvedValue(undefined);
    mockGetChannel.mockResolvedValue({ id: 'facebook-feed' });
    mockSendMessageToChannel.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('resolves only after Facebook confirms a publication', async () => {
    mockApi.mockImplementation((_path, method, _payload, callback) => {
      expect(method).toBe('POST');
      callback({ id: 'new-post' });
    });

    await expect(Facebook.postMessageFacebook({ message: 'test' }))
      .resolves.toEqual({ id: 'new-post' });
  });

  test('rejects a failed Facebook publication', async () => {
    mockApi.mockImplementation((_path, _method, _payload, callback) => {
      callback({ error: { message: 'denied' } });
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(Facebook.postMessageFacebook({ message: 'test' }))
      .rejects.toEqual({ message: 'denied' });
  });

  test('propagates Discord delivery failures while polling the Facebook feed', async () => {
    mockApi.mockImplementation((_path, method, _payload, callback) => {
      expect(method).toBe('GET');
      callback({ data: [{ id: 'page_2', message: 'new post' }] });
    });
    mockSendMessageToChannel.mockRejectedValue(new Error('Discord unavailable'));

    await expect(Facebook.getVostPostsAndSendToDiscord({}))
      .rejects.toThrow('Discord unavailable');
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
