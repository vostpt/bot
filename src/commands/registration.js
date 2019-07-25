const { Acronyms } = require('../services');
const { cooldown } = require('../../config/bot');

module.exports = {
  name: 'registro',
  args: false,
  cooldown,
  usage: `
    **!registro** - *Mostra o link para inscrição de novos voluntários*
  `,
  description: '',

  /**
  * Send to Discord registration link
  *
  * @async
  * @param {Message} message
  */
  async execute(message, args) {
    if (this.args && args.length === 0) {
      message.reply(`Preciso de mais dados para poder trabalhar!\n${this.usage}`);

      return;
    }


    message.channel.send(`Os teus amigos podem se registrar neste link: https://t.co/IeLK77Murx?amp=1`);
  },
};
