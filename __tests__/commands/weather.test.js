const Discord = require('discord.js');
const weatherCommand = require('../../src/commands/weather');
const WeatherService = require('../../src/services/Weather');

jest.mock('../../src/services/Weather');
jest.mock('../../data/auth/vostpt-bot', () => {}, { virtual: true });


const client = new Discord.Client();

describe('weather command', () => {
  test('No args passed', async () => {
    WeatherService.getByDay.mockReturnValueOnce([]);

    await weatherCommand.execute(client.message, []);

    expect(client.message.channel.send).toHaveBeenCalledTimes(1);
    expect(client.message.channel.send.mock.calls[0][0]).toContain('Sem Dados');
  });

  describe('Args passed', () => {
    test('Allowed day', async () => {
      WeatherService.getByDay.mockReturnValueOnce([{}, {}]);
      await weatherCommand.execute(client.message, ['tomorrow']);

      expect(client.message.channel.send).toHaveBeenCalledTimes(1);
      expect(client.message.channel.send.mock.calls[0][0]).toContain('Meteorologia');
    });

    test('Not allowed day', () => {
      weatherCommand.execute(client.message, ['notAllowedDay']);

      expect(client.message.reply).toHaveBeenCalledTimes(1);
      expect(client.message.reply.mock.calls[0][0]).toContain(weatherCommand.usage);
    });
  });
});
