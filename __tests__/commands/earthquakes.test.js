const EarthquakesService = require('../../src/services/Earthquakes');
const earthquakesCommand = require('../../src/commands/earthquakes');

jest.mock('../../src/services/Earthquakes');

const mockMessage = {
  reply: jest.fn(),
  channel: {
    send: jest.fn(),
  },
};

describe('Earthquakes command', () => {
  test('No args passed', () => {
    earthquakesCommand.execute(mockMessage, []);

    expect(mockMessage.reply).toHaveBeenCalledTimes(1);
    expect(mockMessage.reply.mock.calls[0][0]).toContain(earthquakesCommand.usage);
  });

  describe('Args provided', () => {
    test('if required date has no events', async () => {
      EarthquakesService.getByDate.mockResolvedValue([]);

      await earthquakesCommand.execute(mockMessage, ['arg']);

      expect(mockMessage.reply).toHaveBeenCalledTimes(1);
      expect(mockMessage.reply.mock.calls[0][0]).toContain('arg');
    });

    test('if required date has both events (regular/sensed)', async () => {
      EarthquakesService.getByDate.mockResolvedValue([
        { sensed: true },
        { sensed: false },
      ]);

      await earthquakesCommand.execute(mockMessage, ['arg']);

      expect(mockMessage.channel.send).toHaveBeenCalledTimes(2);
      expect(mockMessage.channel.send.mock.calls[0][0]).toContain('Sismos sentidos');
      expect(mockMessage.channel.send.mock.calls[1][0]).toContain('Sismos de');
    });

    test('if required date has only regular events', async () => {
      EarthquakesService.getByDate.mockResolvedValue([
        { sensed: false },
      ]);

      await earthquakesCommand.execute(mockMessage, ['arg']);

      expect(mockMessage.channel.send).toHaveBeenCalledTimes(1);
      expect(mockMessage.channel.send.mock.calls[0][0]).toContain('Sismos de');
    });

    test('if required date has only sensed events', async () => {
      EarthquakesService.getByDate.mockResolvedValue([
        { sensed: true },
      ]);

      await earthquakesCommand.execute(mockMessage, ['arg']);

      expect(mockMessage.channel.send).toHaveBeenCalledTimes(1);
      expect(mockMessage.channel.send.mock.calls[0][0]).toContain('Sismos sentidos');
    });
  });
});
