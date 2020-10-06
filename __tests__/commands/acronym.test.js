const Discord = require('discord.js');
const AcronymsAPI = require('../../src/api/Acronyms');
const AcronymCommand = require('../../src/commands/acronym');

jest.mock('../../src/api/Acronyms');
jest.mock('../../data/auth/vostpt-bot', () => {}, { virtual: true });

const client = new Discord.Client();

describe('Acronym command', () => {
  test('No args passed', () => {
    AcronymCommand.execute(client.message, []);

    expect(client.message.reply).toHaveBeenCalledTimes(1);
    expect(client.message.reply.mock.calls[0][0]).toContain(AcronymCommand.usage);
  });

  describe('Args passed', () => {
    test('Valid acronym but no data returned', async () => {
      AcronymsAPI.get.mockResolvedValue({
        data: {
          data: [],
        },
      });
      await AcronymCommand.execute(client.message, ['arg']);

      expect(client.message.reply).toHaveBeenCalledTimes(1);
      expect(client.message.reply.mock.calls[0][0]).toContain('Não reconheço o acrónimo');
    });

    test('Valid acronym and data returned', async () => {
      AcronymsAPI.get.mockResolvedValue({
        data: {
          data: [{
            attributes: {
              initials: 'ok',
              meaning: 'desc',
            },
          }],
        },
      });
      await AcronymCommand.execute(client.message, ['ok']);

      expect(client.message.channel.send).toHaveBeenCalledTimes(1);
      expect(client.message.channel.send.mock.calls[0][0]).toContain('ok - desc');
    });
  });
});
