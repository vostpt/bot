const moment = require('moment');
const { locale } = require('../../config/locale');
const { prefix, channels } = require('../../config/bot');

moment.locale(locale);

const prefixHelp = '?';

/**
* Receives a message from Discord, and execute trigger(s) included in it
*
* @async
* @param {Client} client
* @param {Message} msg
*/
const message = async (client, msg) => {
  if (msg.author.bot) {
    return;
  }

  const channelId = msg.channel.id;

  if (channelId === channels.TRIGGERS_CHANNEL_ID) {
    client.triggers.forEach(({ execute }) => execute(msg));
  }

  if (msg.content.startsWith(prefixHelp)) {
    const args = msg.content.slice(prefixHelp.length).split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'commands') {
      const commandUsage = client.commands.map(({ usage }) => usage);

      msg.author.send(`***Comandos:***\n${commandUsage.join('')}`);

      msg.reply('os comandos foram enviados por DM');
    }
  }

  if (msg.content.startsWith(prefix)) {
    const args = msg.content.slice(prefix.length).split(' ');
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (command) {
      try {
        await command.execute(msg, args);
      } catch (e) {
        msg.reply('infelizmente não consigo satisfazer esse pedido');
      }
    }
  }
};

module.exports = message;
