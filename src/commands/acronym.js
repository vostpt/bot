const { Acronyms } = require('../services');
const { cooldown } = require('../../config/bot');

module.exports = {
  name: 'acronimo',
  args: true,
  cooldown,
  usage: `
    **!acronimo [acronimo]** - *Mostra a definição de qualquer acronimo na base de dados, por ex. !acronimo ANPC*
  `,
  description: '',

  /**
  * Send to Discord acronym definition
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  async execute(message, args) {
    if (this.args && args.length === 0) {
      message.reply(`Preciso de mais dados para poder trabalhar!\n${this.usage}`);

      return;
    }

    const [acronym] = args;
    const result = await Acronyms.getExactAcronym(acronym);

    if (!result) {
      message.reply('Esse acrónimo não consta na base de dados!');

      return;
    }

    message.channel.send(`${result.acronym} - ${result.description}`);
  },
};
