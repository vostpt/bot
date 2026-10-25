const { publishAll } = require('../../src/helpers');

describe('publishAll', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('one failed destination does not block another destination', async () => {
    const success = jest.fn(() => Promise.resolve('ok'));
    const failure = jest.fn(() => Promise.reject(new Error('offline')));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const results = await publishAll('test-workflow', { failure, success });

    expect(failure).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledTimes(1);
    expect(results.failure.status).toBe('rejected');
    expect(results.success).toEqual({ status: 'fulfilled', value: 'ok' });
    expect(errorSpy).toHaveBeenCalledWith(
      '[test-workflow] failure publication failed:',
      expect.any(Error),
    );
  });
});
