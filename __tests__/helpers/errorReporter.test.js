const {
  configureErrorReporter,
  describeError,
  reportCriticalError,
  resetErrorReporter,
} = require('../../src/helpers/errorReporter');

describe('critical error reporter', () => {
  const originalChannelId = process.env.ERRORS_CHANNEL_ID;

  afterEach(() => {
    jest.restoreAllMocks();
    resetErrorReporter();

    if (originalChannelId === undefined) {
      delete process.env.ERRORS_CHANNEL_ID;
    } else {
      process.env.ERRORS_CHANNEL_ID = originalChannelId;
    }
  });

  test('does nothing when the Discord client or channel is not configured', async () => {
    delete process.env.ERRORS_CHANNEL_ID;

    await expect(reportCriticalError('test', new Error('failure'))).resolves.toEqual({
      sent: false,
      reason: 'not-configured',
    });
  });

  test('sends a formatted alert to the cached channel', async () => {
    process.env.ERRORS_CHANNEL_ID = 'errors-channel';
    const channel = { send: jest.fn().mockResolvedValue({ id: 'message' }) };
    const client = {
      channels: {
        cache: new Map([['errors-channel', channel]]),
        fetch: jest.fn(),
      },
    };
    configureErrorReporter(client);

    await expect(reportCriticalError(
      'social:weather:twitter',
      new Error('network offline'),
      { attempt: 1 },
    )).resolves.toEqual({ sent: true });

    expect(client.channels.fetch).not.toHaveBeenCalled();
    expect(channel.send).toHaveBeenCalledWith({
      content: expect.stringContaining('social:weather:twitter'),
      allowedMentions: { parse: [] },
    });
    expect(channel.send.mock.calls[0][0].content).toContain('network offline');
    expect(channel.send.mock.calls[0][0].content).toContain('"attempt":1');
  });

  test('fetches the channel when it is not cached', async () => {
    process.env.ERRORS_CHANNEL_ID = 'errors-channel';
    const channel = { send: jest.fn().mockResolvedValue({}) };
    const client = {
      channels: {
        cache: new Map(),
        fetch: jest.fn().mockResolvedValue(channel),
      },
    };
    configureErrorReporter(client);

    await reportCriticalError('job:weather', new Error('failed'));

    expect(client.channels.fetch).toHaveBeenCalledWith('errors-channel');
    expect(channel.send).toHaveBeenCalledTimes(1);
  });

  test('redacts secrets from errors and metadata', () => {
    expect(describeError({
      authorization: 'Bearer abc123',
      nested: { password: 'do-not-send', token: 'private-token' },
      safe: 'visible',
    })).toBe(JSON.stringify({
      authorization: '[REDACTED]',
      nested: { password: '[REDACTED]', token: '[REDACTED]' },
      safe: 'visible',
    }));

    expect(describeError(new Error('request used Bearer abc123'))).not.toContain('abc123');
  });

  test('contains alert delivery failures and permits a later retry', async () => {
    process.env.ERRORS_CHANNEL_ID = 'errors-channel';
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const channel = {
      send: jest.fn()
        .mockRejectedValueOnce(new Error('Discord unavailable'))
        .mockResolvedValueOnce({}),
    };
    configureErrorReporter({
      channels: {
        cache: new Map([['errors-channel', channel]]),
        fetch: jest.fn(),
      },
    });

    await expect(reportCriticalError('job:first', new Error('first'))).resolves.toEqual({
      sent: false,
      reason: 'send-failed',
    });
    await expect(reportCriticalError('job:second', new Error('second'))).resolves.toEqual({
      sent: true,
    });
  });
});
