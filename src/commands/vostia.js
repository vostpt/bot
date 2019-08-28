const moment = require('moment');
const { cooldown, prefix } = require('../../config/bot');
const { react } = require('../helpers');

// Since we don't have DB integration yet, this approach will do the job
const activations = new Map();

module.exports = {
  active: true,
  allowedArgs: [
    'list',
    'start',
    'status',
    'stop',
  ],
  args: true,
  cooldown,
  name: 'vostia',
  usage: `
    **${prefix}vostia start activation <activation_name>** - Só disponível para Founders
    **${prefix}vostia stop activation <activation_name>** - Só disponível para Founders
    **${prefix}vostia stats activation <activation name>**
  `,

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

    const [type, what, ...rest] = args;

    const activationName = rest.join(' ');

    if (!this.allowedArgs.includes(type.toLowerCase()) || what !== 'activation' || !activationName) {
      message.reply(`Esse pedido não é válido.\n${this.usage}`);

      return;
    }

    if (type.toLowerCase() === 'status') {
      const activation = activations.get(activationName);

      if (!activation) {
        message.author.send(`${activationName} - não é uma ativação. Ativações disponíveis:\n\n${[...activations.keys()].join('\n')}`);

        react(message, ['📧', '📥']);
        return;
      }

      const isOngoing = !activation.stop;

      if (isOngoing) {
        const duration = moment.duration(moment().diff(activation.start)).humanize();

        message.reply(`${activationName} a decorrer há ${duration}, desde ${activation.start}`);

        return;
      }

      message.reply(`${activationName} começou às ${activation.start} e terminou às ${activation.stop} tendo durado ${activation.duration}.`);
    }

    const allowedRole = message.guild.roles.find(({ name }) => name === 'admins');

    if (!allowedRole) {
      return;
    }

    const isAllowed = message.member.roles.find(({ id }) => id === allowedRole.id);

    if (!isAllowed) {
      return;
    }

    if (type.toLowerCase() === 'start') {
      activations.set(activationName, { start: moment(), stop: undefined });

      message.channel.send(`everyone entramos agora em ativação devido a ${activationName}`);
    } else if (type.toLowerCase() === 'stop') {
      const activation = activations.get(activationName);

      if (!activation) {
        message.author.send(`${activationName} - não é uma ativação:\n\n${[...activations.values()].join('\n')}`);

        react(message, ['📧', '📥']);
        return;
      }

      activations.set(activationName, {
        ...activation,
        stop: moment(),
        duration: moment.duration(moment().diff(activation.start)).humanize(),
      });

      message.channel.send(`everyone acabou a ativação devido a ${activationName}. Obrigado!`);
    }
  },
};
