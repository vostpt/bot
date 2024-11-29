const { cooldown } = require(`../config/bot`);

module.exports = {
  active: true,
  cooldown,
  name: 'help',
  description: 'Shows available commands',
  usage: ['help'],
  commands: ['!help'],

  /**
  * Send to Discord a message with the available commands
  *
  * @async
  * @param {Message} message
  * @param {Client} client
  */
  async execute(message, client) {
    const commandUsage = client.commands
      .filter(({ active }) => active)
      .map(({ commands }) => commands.join('\n'));

    await message.author.send(`***Comandos:***\n${commandUsage.join('\n')}`);
    await message.react('📧');
    await message.react('📥');
  },
};

