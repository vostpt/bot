const Discord = require('discord.js');
const VostiaCommand = require('../../src/commands/vostia');

const client = new Discord.Client();

describe('Vostia command', () => {
  test('No args passed', async () => {
    await VostiaCommand.execute(client.message, []);

    expect(client.message.reply).toHaveBeenCalledTimes(1);
    expect(client.message.reply.mock.calls[0][0]).toContain(VostiaCommand.usage);
  });

  describe('Args passed', () => {
    test('Invalid args', async () => {
      await VostiaCommand.execute(client.message, ['arg']);

      expect(client.message.reply).toHaveBeenCalledTimes(1);
      expect(client.message.reply.mock.calls[0][0]).toContain('Esse pedido não é válido.');
    });

    test('status on going', async () => {
      client.message.guild.roles = [{ name: 'Founders' }];
      client.message.member.roles = [{ name: 'Founders' }];

      await VostiaCommand.execute(client.message, ['start', 'activation', '1234'])
        .then(async () => {
          client.message.guild.roles = [];
          return VostiaCommand.execute(client.message, ['status', 'activation', '1234']);
        })
        .then(() => {
          expect(client.message.reply).toHaveBeenCalledTimes(1);
          expect(client.message.reply.mock.calls[0][0]).toContain('a decorrer há');
        });
    });

    test('status finished', async () => {
      client.message.guild.roles = [{ name: 'Founders' }];
      client.message.member.roles = [{ name: 'Founders' }];

      await VostiaCommand.execute(client.message, ['start', 'activation', '12345'])
        .then(() => VostiaCommand.execute(client.message, ['stop', 'activation', '12345']))
        .then(() => {
          client.message.guild.roles = [];
          client.message.member.roles = [];
          return VostiaCommand.execute(client.message, ['status', 'activation', '12345']);
        })
        .then(() => {
          expect(client.message.reply).toHaveBeenCalledTimes(1);
          expect(client.message.reply.mock.calls[0][0]).toContain('e terminou às');
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
      client.message.guild.roles = [{ name: 'Founders' }];
      client.message.member.roles = [{ name: 'Founders' }];
      await VostiaCommand.execute(client.message, ['start', 'activation', '123']);

      expect(client.message.channel.send).toHaveBeenCalledTimes(1);
      expect(client.message.channel.send.mock.calls[0][0]).toContain('entramos agora em ativação devido');
    });

    test('stop from allowed', async () => {
      client.message.guild.roles = [{ name: 'Founders' }];
      client.message.member.roles = [{ name: 'Founders' }];
      await VostiaCommand.execute(client.message, ['stop', 'activation', '123']);

      expect(client.message.channel.send).toHaveBeenCalledTimes(1);
      expect(client.message.channel.send.mock.calls[0][0]).toContain('acabou a ativação devido');
    });
  });
});
