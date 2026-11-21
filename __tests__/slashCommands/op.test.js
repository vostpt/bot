jest.mock('../../src/services', () => ({
  Fires: {},
  Prociv: {},
  Winds: {
    getWindGlobal: jest.fn(),
  },
}));

const { Winds } = require('../../src/services');
const command = require('../../src/slashCommands/OP');

describe('/op', () => {
  test('uses the reworked global wind service', async () => {
    Winds.getWindGlobal.mockResolvedValue({
      speed: '42.5',
      direction: 7,
      stations: 5,
    });
    const interaction = {
      deferReply: jest.fn(() => Promise.resolve()),
      editReply: jest.fn(() => Promise.resolve()),
      options: {
        getSubcommand: jest.fn(() => 'vento'),
      },
    };

    await command.execute(interaction);

    expect(Winds.getWindGlobal).toHaveBeenCalledTimes(1);
    expect(interaction.editReply).toHaveBeenCalledWith(expect.stringContaining('42.5 km/h'));
  });
});
