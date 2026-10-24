const { channels } = require('../../config/bot');

module.exports = {
  name: 'football',
  description: 'Football related replies',
  limitToChannels: [
    channels.TRIGGERS_CHANNEL_ID,
    channels.VOLUNTEERS_CHANNEL_ID,
  ],

  /**
  * Send to Discord a custom message according to football club
  *
  * @async
  * @param {Message} message
  */
  async execute(message) {
    const messageContent = message.content.toLowerCase();
    let handled = false;

    if (messageContent.includes('benfica') || messageContent.includes('slb')) {
      message.reply(':eagle: **SLB! SLB! SLB! SLB! SLB! SLB! Glorioso SLB! GLORIOSO SLB!** :eagle:');
      handled = true;
    }

    if (messageContent.includes('sporting')) {
      message.reply(':lion_face: **Rapaziada oiçam bem o que eu vos digo, gritem todos comigo: VIVA O SPORTING!** :lion_face:');
      handled = true;
    }

    if (messageContent.includes('fcp')) {
      message.reply(':dragon: :**Azul e branco é o coração! E salta Porto! E salta Porto! Allez! Allez!** :dragon:');
      handled = true;
    }

    if (messageContent.includes('fc porto')) {
      message.reply(':dragon: **E salta Porto! E salta Porto! Allez! Allez!** :dragon:');
      handled = true;
    }

    if (messageContent.includes('senhorim')) {
      message.reply(':bear: **SENHORIM! SENHORIM! QUEM AQUI VEM NÃO MANDA AQUI!** :bear:');
      handled = true;
    }

    if (messageContent.includes('scb') || messageContent.includes('sc braga')) {
      message.reply('**Braga Braga Braga, vamos para a frente!**');
      handled = true;
    }

    return handled;
  },
};
