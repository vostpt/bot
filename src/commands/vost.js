const { cooldown } = require('../../config/bot');

module.exports = {
  name: 'vost',
  args: false,
  cooldown,
  allowerdArgs: [
    'irmaos',
    'registo',
  ],
  usage: `
    **!vost irmaos** - *Lista de twitter com as contas VOST europeias.*
    **!vost rs** - *Links das Redes Sociais do VOST Portugal.* 
    **!vost registo** - *Mostra o link para inscrição de novos voluntários.*
  `,
  description: '',

  /**
  * Send to Discord info intern to VOST Portugal
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

    const requestedArgument = args[0].toLowerCase();

    if (requestedArgument === 'registo') {
      message.channel.send('Os teus amigos podem se registar neste link: https://t.co/IeLK77Murx?amp=1');
    } else if (requestedArgument === 'rs') {
      message.author.send('As nossas redes sociais são:\nTwitter: https://twitter.com/vostpt\nFacebook: https://pt-pt.facebook.com/Vostpt/\nInstagram: https://www.instagram.com/vostpt/');
      message.react('📧')
        .then(() => message.react('📥'))
        .catch(() => message.reply('os comandos foram enviados por DM'));
    } else if (requestedArgument === 'irmaos') {
      message.channel.send('Temos muitos irmãos como podes ver:\n🇪🇺 VOST Europe (https://twitter.com/VOSTeurope)\n🇫🇷 VISOV France (https://twitter.com/VISOV1)\n🇧🇪 VOST Belgique (https://twitter.com/VOSTbe)\n🇩🇪 VOST Germany (https://twitter.com/VOST_de)\n🇫🇷 VOST Nice (https://twitter.com/NiceVOST)\n🇬🇧 VOST UK (https://twitter.com/VOSTUK)\n🇮🇹 VOST Italy (https://twitter.com/VOSTitaly)\n🇪🇸 VOST Spain (https://twitter.com/vostSPAIN)\n🇬🇧 DGVost (https://twitter.com/DGVost)');
    }
  },
};
