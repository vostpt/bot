const { cooldown } = require('../../config/bot');

const siblings = [
  '🇪🇺 VOST Europe (https://twitter.com/VOSTeurope)',
  '🇫🇷 VISOV France (https://twitter.com/VISOV1)',
  '🇧🇪 VOST Belgique (https://twitter.com/VOSTbe)',
  '🇩🇪 VOST Germany (https://twitter.com/VOST_de)',
  '🇫🇷 VOST Nice (https://twitter.com/NiceVOST)',
  '🇬🇧 VOST UK (https://twitter.com/VOSTUK)',
  '🇮🇹 VOST Italy (https://twitter.com/VOSTitaly)',
  '🇪🇸 VOST Spain (https://twitter.com/vostSPAIN)',
  '🇬🇧 DGVost (https://twitter.com/DGVost)',
];

const sociolNetworks = [
  'Twitter: https://twitter.com/vostpt',
  'Facebook: https://pt-pt.facebook.com/Vostpt/',
  'Instagram: https://www.instagram.com/vostpt/',
];

module.exports = {
  name: 'vost',
  args: false,
  cooldown,
  allowedArgs: [
    'registo',
    'rs',
    'irmaos',
  ],
  usage: `
    **!vost registo** - *Mostra o link para inscrição de novos voluntários.*
    **!vost rs** - *Links das Redes Sociais do VOST Portugal.*
    **!vost irmaos** - *Lista de twitter com as contas VOST europeias.*
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

    if (!this.allowedArgs.includes(requestedArgument)) {
      message.reply(`${requestedArgument} não é válido.\n${this.usage}`);

      return;
    }

    if (requestedArgument === 'registo') {
      message.channel.send('Os teus amigos podem se registar neste link: https://t.co/IeLK77Murx?amp=1');
    } else if (requestedArgument === 'rs') {
      message.author.send(`As nossas redes sociais são:\n${sociolNetworks.join('\n')}`);
      message.react('📧')
        .then(() => message.react('📥'))
        .catch(() => message.reply('os comandos foram enviados por DM'));
    } else if (requestedArgument === 'irmaos') {
      message.channel.send(`Temos muitos irmãos como podes ver:\n${siblings.join('\n')}`);
    }
  },
};
