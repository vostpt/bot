const rcmCommand = require('../../src/commands/rcm');

jest.mock('../../src/api/Acronyms');

const mockMessage = {
  reply: jest.fn(),
  channel: {
    send: jest.fn(),
  },
};

describe('RCM command', () => {
  test('No args passed', () => {
    rcmCommand.execute(mockMessage, []);

    expect(mockMessage.reply).toHaveBeenCalledTimes(1);
    expect(mockMessage.reply.mock.calls[0][0]).toContain(rcmCommand.usage);
  });

  describe('Args passed - day', () => {
    test('Allowed day', async () => {
      await rcmCommand.execute(mockMessage, ['hoje']);

      expect(mockMessage.channel.send).toHaveBeenCalledTimes(1);
      expect(mockMessage.channel.send.mock.calls[0][0]).toContain('Risco de Incêndio');
    });

    test('Not allowed day', async () => {
      await rcmCommand.execute(mockMessage, ['notAllowedDay']);

      expect(mockMessage.reply).toHaveBeenCalledTimes(1);
      expect(mockMessage.reply.mock.calls[0][0]).toContain(rcmCommand.allowedArgs.join(', '));
    });
  });
});
