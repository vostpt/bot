const Discord = require('discord.js');
const moment = require('moment');
const FiresService = require('../../src/services/Fires');
const WindsService = require('../../src/services/Winds');
const ProCivService = require('../../src/services/ProCiv');
const opCommand = require('../../src/commands/op');

jest.mock('../../src/services/Fires');
jest.mock('../../src/services/Winds');
jest.mock('../../src/services/ProCiv');
jest.mock('../../data/auth/vostpt-bot', () => {}, { virtual: true });


const client = new Discord.Client();

const severeEvent = {
  o: 150,
  d: moment().subtract(2, 'hours'),
};

const regularEvent = {
  o: 1,
  d: moment().subtract(1, 'days'),
};

describe('!op command', () => {
  test('No args passed', () => {
    opCommand.execute(client.message, []);

    expect(client.message.reply).toHaveBeenCalledTimes(1);
    expect(client.message.reply.mock.calls[0][0]).toContain(opCommand.usage);
  });

  describe('Args passed', () => {
    /**
    * !op id <argument>
    */
    describe('\'id\' argument', () => {
      test('if id value is not provided', async () => {
        await opCommand.execute(client.message, ['id']);

        expect(client.message.reply).toHaveBeenCalledTimes(1);
        expect(client.message.reply.mock.calls[0][0]).toContain(opCommand.usage);
      });

      describe('if id value is provided', () => {
        test('it returns no events', async () => {
          ProCivService.getById.mockResolvedValue([]);

          await opCommand.execute(client.message, ['id', '0']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('Sem Ocorrências');
        });

        test('it returns at least one severe event', async () => {
          ProCivService.getById.mockResolvedValue([
            severeEvent,
          ]);

          await opCommand.execute(client.message, ['id', '0']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('***Ocorrências relevantes:***');
        });

        test('it returns at least one regular event', async () => {
          ProCivService.getById.mockResolvedValue([
            regularEvent,
          ]);

          await opCommand.execute(client.message, ['id', '0']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('***Ocorrências:***');
        });
      });
    });

    /**
    * !op if <argument>
    */
    describe('\'if\' argument', () => {
      test('city id value is not provided', async () => {
        await opCommand.execute(client.message, ['if']);

        expect(client.message.reply).toHaveBeenCalledTimes(1);
        expect(client.message.reply.mock.calls[0][0]).toContain(opCommand.usage);
      });

      describe('city id value is provided', () => {
        test('it returns no events', async () => {
          ProCivService.getByCityAndLocal.mockResolvedValue([]);

          await opCommand.execute(client.message, ['if', 'cityId']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('Sem Ocorrências');
        });

        test('it returns at least one severe event', async () => {
          ProCivService.getByCityAndLocal.mockResolvedValue([
            severeEvent,
          ]);

          await opCommand.execute(client.message, ['if', 'cityId']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('***Ocorrências relevantes:***');
        });

        test('it returns at least one regular event', async () => {
          ProCivService.getByCityAndLocal.mockResolvedValue([
            regularEvent,
          ]);

          await opCommand.execute(client.message, ['if', 'cityId']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('***Ocorrências:***');
        });
      });
    });

    /**
    * !op vento <argument>
    */
    describe('\'vento\' argument', () => {
      test('city id value is not provided', async () => {
        await opCommand.execute(client.message, ['vento']);

        expect(client.message.reply).toHaveBeenCalledTimes(1);
        expect(client.message.reply.mock.calls[0][0]).toContain(opCommand.usage);
      });

      describe('city id value is provided', () => {
        test('it returns no events', async () => {
          WindsService.getById.mockResolvedValue();

          await opCommand.execute(client.message, ['vento', 'cityId']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('Sem Ocorrência');
        });

        test('it returns at least one event', async () => {
          WindsService.getById.mockResolvedValue([{}]);

          await opCommand.execute(client.message, ['vento', 'cityId']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('***Ocorrência:***');
        });
      });
    });

    /**
    * !op status <rgument>
    */
    describe('\'status\' argument', () => {
      test('status value is not provided', async () => {
        await opCommand.execute(client.message, ['status']);

        expect(client.message.reply).toHaveBeenCalledTimes(1);
        expect(client.message.reply.mock.calls[0][0]).toContain(opCommand.usage);
      });

      describe('status value is provided', () => {
        test('it returns no events', async () => {
          ProCivService.filterByStatus.mockResolvedValue([]);

          await opCommand.execute(client.message, ['status', 'requestedStatus']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('Sem Ocorrências');
        });

        test('it returns at least one severe event', async () => {
          ProCivService.filterByStatus.mockResolvedValue([severeEvent]);

          await opCommand.execute(client.message, ['status', 'requestedStatus']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('***Ocorrências relevantes:***');
        });

        test('it returns at least one regular event', async () => {
          ProCivService.filterByStatus.mockResolvedValue([regularEvent]);

          await opCommand.execute(client.message, ['status', 'requestedStatus']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('***Ocorrências:***');
        });
      });
    });

    /**
    * !op distrito <argument>
    */
    describe('\'distrito\' argument', () => {
      test('district value is not provided', async () => {
        await opCommand.execute(client.message, ['distrito']);

        expect(client.message.reply).toHaveBeenCalledTimes(1);
        expect(client.message.reply.mock.calls[0][0]).toContain('é necessário fornecer um distrito');
      });

      describe('district value is provided', () => {
        test('district value is invalid', async () => {
          await opCommand.execute(client.message, ['distrito', 'potato']);

          expect(client.message.reply).toHaveBeenCalledTimes(1);
          expect(client.message.reply.mock.calls[0][0]).toContain('não foi possível identificar esse distrito');
        });

        test('it returns no events', async () => {
          FiresService.getByDistrict.mockResolvedValue([]);

          await opCommand.execute(client.message, ['distrito', 'faro']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('Sem Ocorrências');
        });

        test('it returns at least one severe event', async () => {
          FiresService.getByDistrict.mockResolvedValue([severeEvent]);

          await opCommand.execute(client.message, ['distrito', 'faro']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('***Ocorrências relevantes:***');
        });

        test('it returns at least one regular event', async () => {
          FiresService.getByDistrict.mockResolvedValue([regularEvent]);

          await opCommand.execute(client.message, ['distrito', 'faro']);

          expect(client.message.channel.send).toHaveBeenCalledTimes(1);
          expect(client.message.channel.send.mock.calls[0][0]).toContain('***Ocorrências:***');
        });
      });
    });
  });
});
