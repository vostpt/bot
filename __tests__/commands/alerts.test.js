const WarningsService = require('../../src/services/Warnings');
const alertsCommand = require('../../src/commands/alerts');

jest.mock('../../src/services/Warnings');

const mockMessage = {
  channel: {
    send: jest.fn(),
  },
};

describe('!alerts command', () => {
  test('it has no warnings', async () => {
    WarningsService.getAll.mockResolvedValue([]);
    await alertsCommand.execute(mockMessage);

    expect(mockMessage.channel.send).toHaveBeenCalledTimes(1);
    expect(mockMessage.channel.send.mock.calls[0][0]).toContain('Sem Alertas');
  });

  test('it has locals but no alerts to display', async () => {
    WarningsService.getAll.mockResolvedValue([
      {
        local: 'local',
        alerts: [],
      },
    ]);

    await alertsCommand.execute(mockMessage);

    expect(mockMessage.channel.send).toHaveBeenCalledTimes(1);
    expect(mockMessage.channel.send.mock.calls[0][0]).toContain('Alertas');
  });

  test('it has locals and alerts to display', async () => {
    WarningsService.getAll.mockResolvedValue([
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
    ]);

    await alertsCommand.execute(mockMessage);

    expect(mockMessage.channel.send).toHaveBeenCalledTimes(1);
    expect(mockMessage.channel.send.mock.calls[0][0]).toContain('**something**');
  });
});
