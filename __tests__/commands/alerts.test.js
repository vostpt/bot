const Discord = require('discord.js');
const WarningsService = require('../../src/services/Warnings');
const alertsCommand = require('../../src/commands/alerts');

jest.mock('../../src/services/Warnings');
jest.mock('../../data/auth/vostpt-bot', () => {}, { virtual: true });


const client = new Discord.Client();

describe('!alerts command', () => {
  test('it has no warnings', async () => {
    WarningsService.getAll.mockResolvedValue({});
    await alertsCommand.execute(client.message);

    expect(client.message.channel.send).toHaveBeenCalledTimes(1);
    expect(client.message.channel.send.mock.calls[0][0]).toContain('Sem Avisos');
  });

  test('it has locals but no alerts to display', async () => {
    WarningsService.getAll.mockResolvedValue({
      madeira: [
        { local: 'local', alertas: [] },
      ],
    });

    await alertsCommand.execute(client.message);

    expect(client.message.channel.send).toHaveBeenCalledTimes(1);
    expect(client.message.channel.send.mock.calls[0][0]).toContain('Avisos');
  });

  test('it has locals and alerts to display', async () => {
    WarningsService.getAll.mockResolvedValue({
      continente: [
        {
          local: 'local',
          alertas: [
            {
              nivel: 'something',
              tipo: 'Precipitação',
              icon: 'something',
              inicio: 'something',
              fim: 'something',
            },
            {
              nivel: 'something',
              tipo: 'something',
              icon: 'something',
              inicio: 'something',
              fim: 'something',
            },
          ],
        },
      ],
    });

    await alertsCommand.execute(client.message);

    expect(client.message.channel.send).toHaveBeenCalledTimes(1);
    expect(client.message.channel.send.mock.calls[0][0]).toContain('**something**');
  });
});
