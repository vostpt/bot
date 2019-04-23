const AcronymsAPI = require('../../src/api/Acronyms');
const AcronymCommand = require('../../src/commands/acronym');

jest.mock('../../src/api/Acronyms');

const mockMessage = {
  reply: jest.fn(),
  channel: {
    send: jest.fn(),
  },
};

AcronymsAPI.get.mockImplementation((acronym) => {
  if (acronym === 'ok') {
    return Promise.resolve({
      data: {
        acronym,
        description: 'desc',
      },
    });
  }

  return Promise.reject();
});

describe('Acronym command', () => {
  test('No args passed', () => {
    AcronymCommand.execute(mockMessage, []);

    expect(mockMessage.reply).toHaveBeenCalledTimes(1);
    expect(mockMessage.reply.mock.calls[0][0]).toContain(AcronymCommand.usage);
  });

  describe('Args passed', () => {
    test('Valid acronym', async () => {
      await AcronymCommand.execute(mockMessage, ['ok']);

      expect(mockMessage.channel.send).toHaveBeenCalledTimes(1);
      expect(mockMessage.channel.send.mock.calls[0][0]).toContain('ok - desc');
    });

    test('Invalid acronym', async () => {
      await AcronymCommand.execute(mockMessage, ['arg1']);

      expect(mockMessage.reply).toHaveBeenCalledTimes(1);
      expect(mockMessage.reply.mock.calls[0][0]).toContain('Esse acrónimo não consta na base de dados!');
    });
  });
});
