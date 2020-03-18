const { Corona } = require('../services');
const { cooldown } = require('../../config/bot');
const { sendMessageAnswer } = require('../services/Discord');

module.exports = {
  active: true,
  allowedArgs: [
    'reports',
  ],
  args: true,
  cooldown,
  name: 'corona',
  usage: `
    **!corona reports** - Retorna todos os relatórios de situação acerca do COVID-19 emitidos pela DGS.
  `,

  /**
  * Send to Discord all coronavirus reports made by DGS
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  async execute(message, args) {
    if (this.args && args.length === 0) {
      sendMessageAnswer(message, `falta o parâmetro.\n${this.usage}`);

      return;
    }

    const requestedParam = args[0].toLowerCase();

    if (requestedParam === 'reports') {
      const reports = await Corona.getAll();

      const string = 'aqui estão os relatórios de situação:\n';

      const msgReportArray = reports.map(report => `${report.title}: ${report.link}`).join('\n');

      sendMessageAnswer(message, string.concat(msgReportArray));
    } else {
      message.reply(`desconheço essa opção.\n${this.usage}`);
    }
  },
};
