const { AcronymsApi } = require('../api');

module.exports = {
  name: 'acronimo',
  description: 'Acrónimo!',
  async execute(message, args) {
    if (args.length === 0) {
      message.reply(`*Give me more data* para eu poder trabalhar!`);

      return;
    }

    const [acronym] = args;
    try {
      const response = await AcronymsApi.get(acronym);

      message.channel.send(
        `${response.data.acronym} - ${response.data.description}`,
      );
    } catch (e) {
      message.reply('Esse acrónimo não consta na base de dados!');
    }
  },
};
