const Fires = require('../services/Fires');

const allowedArgs = ['hoje'];

module.exports = {
  name: 'rcm',
  args: true,
  description: '!rcm',
  usage: `
    **!rcm hoje**
  `,
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
