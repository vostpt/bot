const { Acronyms } = require('../services');

module.exports = {
  name: 'acronimo',
  args: true,
  cooldown: 10,
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

    const [requestedAcronym] = args;
    const { data: acronyms = [] } = await Acronyms.getExactAcronym(requestedAcronym);
    const [acronym] = acronyms;

    if (!acronym) {
      message.channel.send('Não reconheço esse acrónimo');
      return;
    }

    const {
      initials,
      meaning,
    } = acronym.attributes;

    message.channel.send(`${initials} - ${meaning}`);
  },
};
