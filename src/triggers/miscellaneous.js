module.exports = {
  name: 'Miscellaneous',
  description: 'Miscellaneous things',

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

    // Teaching
    if (messageContent.includes('voluntários')) {
      message.reply('Desculpa interromper, mas na VOST Portugal ser voluntário é trabalhar para a invisibilidade e sempre com transparência');
    }

    if (messageContent.includes('💪')) {
      message.channel.send('Muito vai esta gente ao ginásio, graças a Deus :rolling_eyes: ');
    }
  },
};
