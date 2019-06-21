const Fires = require('../services/Fires');
const { cooldown } = require('../../config/bot');

const allowedArgs = ['hoje'];

module.exports = {
  name: 'rcm',
  args: true,
  cooldown,
  description: '!rcm',
  usage: `
    **!rcm hoje**
  `,

  /**
  * Send to Discord fire risk for today
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  execute(message, args) {
    if (args && args.length === 0) {
      try {
        message.reply(`falta o dia!\n${this.usage}`);
      } catch (e) {
        //
      }

      return;
    }

    const [day] = args;

    if (!allowedArgs.includes(day)) {
      message.reply(`dias disponíveis: ${allowedArgs.join(', ')}`);
    }

    if (day.toLowerCase() === 'hoje') {
      const map = Fires.getMap();

      message.channel.send('Risco de Incêndio', { files: [map] });
    }
  },
};
