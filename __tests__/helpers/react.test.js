const Discord = require('discord.js');
const { react } = require('../../src/helpers');

const client = new Discord.Client();

describe('react helper', () => {
  test('with reactions', async () => {
    const reactions = ['📧', '📧'];

    await react(client.message, reactions);

    expect(client.message.reply).toHaveBeenCalledTimes(0);
    expect(client.message.react).toHaveBeenCalledTimes(reactions.length);
  });

  test('without reactions', async () => {
    await react(client.message);

    expect(client.message.reply).toHaveBeenCalledTimes(1);
  });

  test('with reactions but async problem occurs', async () => {
    client.message.react.mockRejectedValue();

    const reactions = ['📧', '📧'];

    await react(client.message, reactions);

    expect(client.message.reply).toHaveBeenCalledTimes(1);
    expect(client.message.reply).toHaveBeenCalledTimes(1);
  });
});
