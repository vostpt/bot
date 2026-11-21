const { publishAll } = require('../../src/helpers');
const errorReporter = require('../../src/helpers/errorReporter');

describe('publishAll', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('one failed destination does not block another destination', async () => {
    const success = jest.fn(() => Promise.resolve('ok'));
    const failure = jest.fn(() => Promise.reject(new Error('offline')));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const reportSpy = jest.spyOn(errorReporter, 'reportCriticalError').mockResolvedValue({ sent: true });
    const results = await publishAll('test-workflow', { failure, success });

    expect(failure).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledTimes(1);
    expect(results.failure.status).toBe('rejected');
    expect(results.success).toEqual({ status: 'fulfilled', value: 'ok' });
    expect(errorSpy).toHaveBeenCalledWith(
      '[test-workflow] failure publication failed:',
      expect.any(Error),
    );
    expect(reportSpy).toHaveBeenCalledWith(
      'social:test-workflow:failure',
      expect.any(Error),
    );
  });
});
