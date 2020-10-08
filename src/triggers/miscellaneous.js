const { channels } = require('../../config/bot');

module.exports = {
  name: 'Miscellaneous',
  description: 'Miscellaneous things',
  limitToChannels: [
    channels.TRIGGERS_CHANNEL_ID,
    channels.VOLUNTEERS_CHANNEL_ID,
  ],

  /**
  * Send to Discord a custom message according to the trigger or the content of the message
  *
  * @async
  * @param {Message} message
  */
  async execute(message) {
    const messageContent = message.content.toLowerCase();

    if (messageContent === '!coffee') {
      message.channel.send(`@everyone A pedido de ${message.author} tomem lá um café! :coffee:`);
    }

    if (messageContent === '!champagne') {
      message.channel.send(`@everyone A pedido de ${message.author} vamos todos celebrar :champagne: :champagne_glass:`);
    }

    if (messageContent === '!bolo') {
      message.channel.send(`A pedido de ${message.author}, aqui está o bolo! :cake:\nhttps://media1.tenor.com/images/930e055fd80ba465ad20ee13e5badb1d/tenor.gif`);
    }

    if (messageContent === '!alheira') {
      message.channel.send(`A pedido de ${message.author}, aqui está a alheira!\nhttps://www.teleculinaria.pt/wp-content/uploads/2016/01/alheiras-no-forno-com-grelos-e-batatas-cozidas.jpg`);
    }

    // Teaching
    if (messageContent.includes('voluntários')) {
      message.reply('Desculpa interromper, mas na VOST Portugal ser voluntário é trabalhar para a invisibilidade e sempre com transparência');
    }

    if (messageContent.includes('💪')) {
      message.channel.send('Muito vai esta gente ao ginásio, graças a Deus :rolling_eyes: ');
    }
  },
};
