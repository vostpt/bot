const Discord = require('discord.js');
const debugCommand = require('../../src/commands/debug');
const DiscordService = require('../../src/services/Discord');

jest.mock('../../src/services/Discord');
jest.mock('../../data/auth/vostpt-bot', () => {}, { virtual: true });


const client = new Discord.Client();

describe('Debug command', () => {
  test('Execution', async () => {
    await debugCommand.execute(client.message, []);

    expect(DiscordService.sendMessageAnswer).toHaveBeenCalledTimes(1);
    expect(DiscordService.sendMessageAnswer.mock.calls[0][1]).toContain('aqui está o debug');
  });
});
