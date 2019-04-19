const replies = [
  'Provavelmente a melhor VOST do mundo',
  ':eyes:',
  ':heart:',
  'Sabias que a VOSTPT primeiro se chamou CONAC-TW no Twitter?',
];

module.exports = {
  name: 'Miscellaneous',
  description: 'Miscellaneous things',
  async execute(message) {
    const messageContent = message.content.toLowerCase();

    if (messageContent.includes('vostpt')) {
      const replytext = Math.floor(Math.random() * replies.length + 0);

      try {
        message.reply(replies[replytext]);
      } catch (e) {
        //
      }

      return;
    }
    if (messageContent === '!coffee') {
      message.channel.send(`@everyone A pedido de ${message.author} tomem lá um café! :coffee:`);
    }

    if (messageContent === '!champagne') {
      message.channel.send(`@everyone A pedido de ${message.author} vamos todos celebrar :champagne: :champagne_glass:`);
    }

    // Teaching
    if (messageContent.includes('voluntários')) {
      message.reply(
        'Desculpa interromper, mas na VOST Portugal ser voluntário é trabalhar para a invisibilidade e sempre com transparência',
      );
    }

    if (messageContent.includes('💪')) {
      message.channel.send('Muito vai esta gente ao ginásio, graças a Deus :rolling_eyes: ');
    }
  },
};
