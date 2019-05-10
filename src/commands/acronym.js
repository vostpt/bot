const { AcronymsApi } = require('../api');

module.exports = {
  name: 'acronimo',
  args: true,
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
      try {
        message.reply(`*Give me more data* para eu poder trabalhar!\n${this.usage}`);
      } catch (e) {
        //
      }

      return;
    }

    const [acronym] = args;
    try {
      const { data = {} } = await AcronymsApi.get(acronym);

      message.channel.send(`${data.acronym} - ${data.description}`);
    } catch (e) {
      message.reply('Esse acrónimo não consta na base de dados!');
    }
  },
};
