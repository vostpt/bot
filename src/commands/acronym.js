const { AcronymsApi } = require('../api');

module.exports = {
  name: 'acronimo',
  args: true,
  usage: `
    **!acronimo [acronimo]** - *Mostra a definição de qualquer acronimo na base de dados, por ex. !acronimo ANPC*
  `,
  description: '',
  async execute(message, args) {
    if (this.args && args.length === 0) {
      message.reply(`*Give me more data* para eu poder trabalhar!\n${this.usage}`);

      return;
    }

    const [acronym] = args;
    const { data } = await AcronymsApi.get(acronym);

    if (!data) {
      message.reply('Esse acrónimo não consta na base de dados!');

      return;
    }

    message.channel.send(`${data.acronym} - ${data.description}`);
  },
};
