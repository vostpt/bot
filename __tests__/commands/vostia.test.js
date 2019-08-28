const Discord = require('discord.js');
const VostiaCommand = require('../../src/commands/vostia');

const client = new Discord.Client();

describe('Vostia command', () => {
  test('No args passed', () => {
    VostiaCommand.execute(client.message, []);

    expect(client.message.reply).toHaveBeenCalledTimes(1);
    expect(client.message.reply.mock.calls[0][0]).toContain(VostiaCommand.usage);
  });

  describe('Args passed', () => {
    test('Invalid args', async () => {
      await VostiaCommand.execute(client.message, ['arg']);

      expect(client.message.reply).toHaveBeenCalledTimes(1);
      expect(client.message.reply.mock.calls[0][0]).toContain('Esse pedido não é válido.');
    });

    test('status', async () => {
      client.message.guild.roles = [{ name: 'admins' }];
      await VostiaCommand.execute(client.message, ['start', 'activation', '123']);

      client.message.guild.roles = [];
      setImmediate(async () => {
        await VostiaCommand.execute(client.message, ['status', 'activation', '123']);

        expect(client.message.reply.send).toHaveBeenCalledTimes(1);
        expect(client.message.reply.mock.calls[0][0]).toContain('a decorrer há');
      });
    });

    test('start from non-allowed', async () => {
      await VostiaCommand.execute(client.message, ['start', 'activation', 'lel']);

      expect(client.message.reply).toHaveBeenCalledTimes(0);
    });


    test('stop from non-allowed', async () => {
      await VostiaCommand.execute(client.message, ['stop', 'activation', '123']);

      expect(client.message.reply).toHaveBeenCalledTimes(0);
    });

    test('start from allowed', async () => {
      client.message.guild.roles = [{ name: 'admins' }];
      client.message.member.roles = [{ name: 'admins' }];
      await VostiaCommand.execute(client.message, ['start', 'activation', '123']);

      expect(client.message.channel.send).toHaveBeenCalledTimes(1);
      expect(client.message.channel.send.mock.calls[0][0]).toContain('entramos agora em ativação devido');
    });

    test('stop from allowed', async () => {
      client.message.guild.roles = [{ name: 'admins' }];
      client.message.member.roles = [{ name: 'admins' }];
      await VostiaCommand.execute(client.message, ['stop', 'activation', '123']);

      expect(client.message.channel.send).toHaveBeenCalledTimes(1);
      expect(client.message.channel.send.mock.calls[0][0]).toContain('acabou a ativação devido');
    });
  });
});
