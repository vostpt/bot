const { Acronyms } = require('../services');
const { cooldown, prefix } = require('../../config/bot');
const { printAliases } = require('../helpers');
const { acronimo: aliases } = require('../../config/commandAliases');

module.exports = {
  aliases,
  active: true,
  args: true,
  cooldown,
  name: 'acronimo',
  usage: `
    **${prefix}acronimo [acronimo]** - *Mostra a definição de qualquer acronimo na base de dados, por ex. ${prefix}acronimo ANPC*
    ${printAliases(aliases)}
  `,

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
    const { data } = await Acronyms.getExactAcronym(acronym);

    if (!data || data.length === 0) {
      message.reply(`Não reconheço o acrónimo \`${acronym}\` !`);

      return;
    }

    const [first] = data;

    message.channel.send(`${first.attributes.initials} - ${first.attributes.meaning}`);
  },
};
