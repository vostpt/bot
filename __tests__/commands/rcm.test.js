const Discord = require('discord.js');
const rcmCommand = require('../../src/commands/rcm');

jest.mock('../../src/api/Acronyms');
jest.mock('../../data/auth/vostpt-bot', () => {}, { virtual: true });


const client = new Discord.Client();

describe('RCM command', () => {
  test('No args passed', () => {
    rcmCommand.execute(client.message, []);

    expect(client.message.reply).toHaveBeenCalledTimes(1);
    expect(client.message.reply.mock.calls[0][0]).toContain(rcmCommand.usage);
  });

  describe('Args passed - day', () => {
    test('Allowed day', () => {
      rcmCommand.execute(client.message, ['hoje']);

      expect(client.message.channel.send).toHaveBeenCalledTimes(1);
      expect(client.message.channel.send.mock.calls[0][0]).toContain('Risco de Incêndio');
    });

    test('Not allowed day', () => {
      rcmCommand.execute(client.message, ['notAllowedDay']);

      expect(client.message.reply).toHaveBeenCalledTimes(1);
      expect(client.message.reply.mock.calls[0][0]).toContain(rcmCommand.allowedArgs.join(', '));
    });
  });
});
