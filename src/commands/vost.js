const { cooldown } = require(`../config/bot`);
const {
  SIBLINGS,
  SOCIALNETWORKS
} = require(`../config/strings`);

module.exports = {
  active: true,
  allowedArgs: [
    'registro',
    'irmaos',
    'rs',
  ],
  args: true,
  cooldown,
  name: 'vost',
  usage: ``,
  commands: ['!vost registro', '!vost irmaos', '!vost rs'],

  /**
  * Send to Discord info intern to VOST Portugal
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  async execute(message, args) {
    if (this.args == null || args.length == 0) {
      message.reply(`Preciso de mais dados para poder trabalhar!`);
      return;
    }
    const requestedArguments = args[0].toLowerCase();
    if (!this.allowedArgs.includes(requestedArguments)) {
      message.reply(`${requestedArguments} não é válido.`);
    }

    switch (requestedArguments) {
      case 'registro':
        message.channel.send(`Os teus amigos podem se registrar neste link: XXXXXX`) // TODO : add correct link
        break;
      case 'irmaos':
        message.channel.send(`Temos muitos irmãos como podes ver:\n${SIBLINGS.join("\n")}`);
        break;
      case 'rs':
        message.author.send(`As nossas redes sociais são:\n${SOCIALNETWORKS.join("\n")}`);
        break;
      default:
        console.log("Error on vost commands file")
    }
  },
};
