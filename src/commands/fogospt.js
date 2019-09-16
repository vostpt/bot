const Fires = require('../services/Fires');
const { cooldown, prefix } = require('../../config/bot');

module.exports = {
  active: true,
  allowedArgs: [
    'hoje',
  ],
  args: true,
  cooldown,
  name: 'fogospt',
  usage: `
    **${prefix}fogospt - Envia tweet para o twitter fogos.pt e faz retweet na conta da VOST PT**
  `,

  /**
  * Tweet in fogos.pt account, and RT in VOST PT account
  *
  * @async
  * @param {Message} message
  */
  async execute(message) {
    if (!message.member.roles.has(r => r.name === 'Founders')) {
      await Fires.tweetFogosPt();

      message.channel.send('Tweet para o fogos.pt e retweet feito');

      return;
    }

    message.channel.send('Não tens permissão para efetuar esta ação');
  },
};
