const Fires = require('../services/Fires');


module.exports = {
  name: 'rcm',
  args: true,
  allowedArgs: ['hoje'],
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
    if (this.args && args.length === 0) {
      message.reply(`falta o dia!\n${this.usage}`);

      return;
    }

    const [day] = args;

    if (!this.allowedArgs.includes(day)) {
      message.reply(`opções disponíveis: ${this.allowedArgs.join(', ')}`);
    }

    if (day.toLowerCase() === 'hoje') {
      const map = Fires.getMap();

      message.channel.send('Risco de Incêndio', { files: [map] });
    }
  },
};
