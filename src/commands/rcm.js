const Fires = require('../services/Fires');


module.exports = {
  name: 'rcm',
  args: true,
  allowedArgs: ['hoje'],
  description: '!rcm',
  usage: `
    **!rcm hoje**
  `,
  execute(message, args) {
    if (this.args && args.length === 0) {
      try {
        message.reply(`falta o dia!\n${this.usage}`);
      } catch (e) {
        //
      }

      return;
    }

    const [day] = args;

    if (!this.allowedArgs.includes(day)) {
      message.reply(`dias disponíveis: ${this.allowedArgs.join(', ')}`);
    }

    if (day.toLowerCase() === 'hoje') {
      const map = Fires.getMap();

      message.channel.send('Risco de Incêndio', { files: [map] });
    }
  },
};
