const AcronymsAPI = require('../../src/api/Acronyms');
const AcronymCommand = require('../../src/commands/acronym');

jest.mock('../../src/api/Acronyms');

const mockMessage = {
  reply: jest.fn(),
  channel: {
    send: jest.fn(),
  },
};

describe('Acronym command', () => {
  test('No args passed', () => {
    AcronymCommand.execute(mockMessage, []);

    expect(mockMessage.reply).toHaveBeenCalledTimes(1);
    expect(mockMessage.reply.mock.calls[0][0]).toContain(AcronymCommand.usage);
  });

  describe('Args passed', () => {
    test('Valid acronym but no data retuned', async () => {
      AcronymsAPI.get.mockResolvedValue({});
      await AcronymCommand.execute(mockMessage, ['ok']);

      expect(mockMessage.reply).toHaveBeenCalledTimes(1);
      expect(mockMessage.reply.mock.calls[0][0]).toContain('Esse acrónimo não consta na base de dados!');
    });

    test('Valid acronym and data retuned', async () => {
      AcronymsAPI.get.mockResolvedValue({
        data: {
          acronym: 'ok',
          description: 'desc',
        },
      });
      await AcronymCommand.execute(mockMessage, ['ok']);

      expect(mockMessage.channel.send).toHaveBeenCalledTimes(1);
      expect(mockMessage.channel.send.mock.calls[0][0]).toContain('ok - desc');
    });
  });
});
