const moment = require('moment');
const { Sns } = require('../services');
const { cooldown } = require('../../config/bot');

module.exports = {
  active: true,
  args: true,
  cooldown,
  name: 'sns24',
  usage: `
      **!sns24 alerts** - *Mostra os alertas do sns.*
    `,

  /**
  * Send to Discord SNS24 alerts.
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  async execute(message, args) {
    if (this.args && args.length > 0) {
      if (args[0].toLowerCase() !== 'alerts') {
        message.reply(`Desconheço essa opção.\n${this.usage}`);
      } else {
        const data = await Sns.getAlerts();

        if (data.length === 0) {
          message.channel.send('***Sem Alertas***');

          return;
        }

        const events = data.map((item) => (
          `**${item.title}**\n${item.description}\n${item.link}\n${moment(item.dateTime, moment.ISO_8601)}`
        ));

        message.channel.send('***SNS24 Alertas :***\n\n');
        message.channel.send(events.join('\n'));
      }
    }
  },
};
