const Discord = require('discord.js');
const EarthquakesService = require('../../src/services/Earthquakes');
const earthquakesCommand = require('../../src/commands/earthquakes');

jest.mock('../../src/services/Earthquakes');
jest.mock('../../data/auth/vostpt-bot', () => {}, { virtual: true });

const client = new Discord.Client();

describe('Earthquakes command', () => {
  test('No args passed', () => {
    earthquakesCommand.execute(client.message, []);

    expect(client.message.reply).toHaveBeenCalledTimes(1);
    expect(client.message.reply.mock.calls[0][0]).toContain(earthquakesCommand.usage);
  });

  describe('Args provided', () => {
    test('if required date has no events', async () => {
      EarthquakesService.getByDate.mockResolvedValue([]);

      await earthquakesCommand.execute(client.message, ['arg']);

      expect(client.message.reply).toHaveBeenCalledTimes(1);
      expect(client.message.reply.mock.calls[0][0]).toContain('arg');
    });

    test('if required date has both events (regular/sensed)', async () => {
      EarthquakesService.getByDate.mockResolvedValue([
        { sensed: true },
        { sensed: false },
      ]);

      await earthquakesCommand.execute(client.message, ['arg']);

      expect(client.message.channel.send).toHaveBeenCalledTimes(2);
      expect(client.message.channel.send.mock.calls[0][0]).toContain('Sismos sentidos');
      expect(client.message.channel.send.mock.calls[1][0]).toContain('Sismos de');
    });

    test('if required date has only regular events', async () => {
      EarthquakesService.getByDate.mockResolvedValue([
        { sensed: false },
      ]);

      await earthquakesCommand.execute(client.message, ['arg']);

      expect(client.message.channel.send).toHaveBeenCalledTimes(1);
      expect(client.message.channel.send.mock.calls[0][0]).toContain('Sismos de');
    });

    test('if required date has only sensed events', async () => {
      EarthquakesService.getByDate.mockResolvedValue([
        { sensed: true },
      ]);

      await earthquakesCommand.execute(client.message, ['arg']);

      expect(client.message.channel.send).toHaveBeenCalledTimes(1);
      expect(client.message.channel.send.mock.calls[0][0]).toContain('Sismos sentidos');
    });
  });
});
