jest.mock('../../src/services/Discord', () => ({
  getChannel: jest.fn(),
  sendMessageToChannel: jest.fn(),
}));

const {
  createWebhookHandler,
  getWebhookSecret,
  isAuthorized,
} = require('../../src/server/server');
const startHttpServer = require('../../src/server/server');
const {
  getChannel,
  sendMessageToChannel,
} = require('../../src/services/Discord');

const invokeWebhook = async (handler, authorization, body = {}) => {
  const request = {
    body,
    headers: {},
  };
  if (authorization !== undefined) request.headers.authorization = authorization;

  const response = {
    send: jest.fn(),
    status: jest.fn(),
  };
  response.status.mockReturnValue(response);

  await handler(request, response);

  return {
    body: response.send.mock.calls[0][0],
    status: response.status.mock.calls[0][0],
  };
};

describe('Copernicus webhook authentication', () => {
  const originalSecret = process.env.COPERNICUS_WEBHOOK_SECRET;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();

    if (originalSecret === undefined) {
      delete process.env.COPERNICUS_WEBHOOK_SECRET;
    } else {
      process.env.COPERNICUS_WEBHOOK_SECRET = originalSecret;
    }
  });

  test('disables the webhook without a configured secret', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    delete process.env.COPERNICUS_WEBHOOK_SECRET;
    expect(getWebhookSecret()).toBeNull();
    expect(startHttpServer()).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Copernicus webhook disabled'));

    process.env.COPERNICUS_WEBHOOK_SECRET = '   ';
    expect(getWebhookSecret()).toBeNull();
  });

  test('trims and returns a configured secret', () => {
    process.env.COPERNICUS_WEBHOOK_SECRET = '  secret-value  ';
    expect(getWebhookSecret()).toBe('secret-value');
  });

  test('accepts only the configured raw or bearer token', () => {
    expect(isAuthorized('secret-value', 'secret-value')).toBe(true);
    expect(isAuthorized('Bearer secret-value', 'secret-value')).toBe(true);
    expect(isAuthorized('Bearer undefined', 'secret-value')).toBe(false);
    expect(isAuthorized(undefined, 'secret-value')).toBe(false);
  });

  test.each([
    ['a missing authorization header', undefined],
    ['an invalid authorization header', 'Bearer wrong-secret'],
    ['the old undefined bearer value', 'Bearer undefined'],
  ])('returns 403 for %s', async (description, authorization) => {
    const handler = createWebhookHandler({}, 'secret-value');
    const response = await invokeWebhook(handler, authorization);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Forbidden: Invalid or missing authorization header.',
    });
    expect(getChannel).not.toHaveBeenCalled();
  });

  test.each(['secret-value', 'Bearer secret-value'])(
    'accepts the supported authorization format: %s',
    async (authorization) => {
      const channel = { id: 'discord-channel' };
      getChannel.mockResolvedValue(channel);
      sendMessageToChannel.mockResolvedValue({ id: 'discord-message' });
      const handler = createWebhookHandler({ id: 'discord-client' }, 'secret-value');

      const response = await invokeWebhook(handler, authorization, {
        event_code: 'EMSR001',
        product_id: 'product-1',
        type: 'wildfire',
        burnt_area_ha: 12,
        acquisition_date: '2026-11-21T10:00:00Z',
        aoi: 'Test area',
        download_link: 'https://example.test/product',
      });

      expect(response.status).toBe(200);
      expect(getChannel).toHaveBeenCalledTimes(1);
      expect(getChannel.mock.calls[0][0]).toEqual({ id: 'discord-client' });
      expect(sendMessageToChannel).toHaveBeenCalledWith(
        channel,
        expect.stringContaining('EMSR001'),
        '',
      );
    },
  );

  test('returns 404 when the configured Discord channel cannot be found', async () => {
    getChannel.mockResolvedValue(null);
    const handler = createWebhookHandler({}, 'secret-value');

    const response = await invokeWebhook(handler, 'Bearer secret-value');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Discord channel not found.' });
    expect(sendMessageToChannel).not.toHaveBeenCalled();
  });

  test('returns 500 when Discord delivery fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getChannel.mockRejectedValue(new Error('Discord unavailable'));
    const handler = createWebhookHandler({}, 'secret-value');

    const response = await invokeWebhook(handler, 'Bearer secret-value');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error.' });
  });

  test('does not write request headers or the secret to logs', async () => {
    const log = console.log;
    const handler = createWebhookHandler({}, 'secret-value');

    await invokeWebhook(handler, 'Bearer secret-value');

    const loggedOutput = log.mock.calls.flat().join(' ');
    expect(loggedOutput).not.toContain('Headers:');
    expect(loggedOutput).not.toContain('secret-value');
  });
});
