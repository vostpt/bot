const moment = require('moment');

const { Corona } = require('../services');
const { cooldown, roles } = require('../../config/bot');
const { sendMessageAnswer } = require('../services/Discord');
const { parseVostDate } = require('../helpers');

module.exports = {
  active: true,
  allowedArgs: [
    'reports',
    'resumo',
    'notificacao',
  ],
  args: true,
  cooldown,
  name: 'corona',
  usage: `
    **!corona reports** - Retorna todos os relatórios de situação acerca do COVID-19 emitidos pela DGS.
    **!corona resumo <data>** - Retorna o resumo do relatório da DGS da data especificada ('hoje', ou data no formato VOSTPT -> DDMMMAAAA).
  `,

  /**
  * Send to Discord all coronavirus reports made by DGS
  * Or send to Discord DGS daily report resume
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

      const msgReportArray = reports.map(report => `\`${report.md5sum.slice(0, 8)}\` | ${report.title}: ${report.link}`).join('\n');
      sendMessageAnswer(message, string.concat(msgReportArray));

      return;
    }

    if (requestedParam === 'resumo') {
      if (args.length < 2) {
        sendMessageAnswer(message, `falta introduzir a data.\n${this.usage}`);

        return;
      }

      const searchDateFormat = 'DD/MM/YYYY';

      const searchDate = args[1] === 'hoje'
        ? moment().format(searchDateFormat)
        : (await parseVostDate(args[1])).format(searchDateFormat);

      const result = await Corona.getResume(searchDate);

      const string = typeof result === 'undefined' || result.text === ''
        ? 'não foi encontrado nenhum resumo nesta data'
        : `aqui está o resumo do relatório de ${searchDate}:\n${result.text}`;

      sendMessageAnswer(message, string);

      return;
    }

    if (requestedParam === 'notificacao') {
      if (message.member.roles.has(roles.core)) {
        const searchDateFormat = 'DD/MM/YYYY';

        const searchDate = moment().format(searchDateFormat);

        const result = await Corona.getResume(searchDate);

        if (typeof result !== 'undefined' && result.text !== '') {
          const notifyDate = moment().format('DDMMMYYYY').toUpperCase();

          const footer = '* Variação % comparada com o dia anterior\nSaiba mais em covid19estamoson.gov.pt';

          const notification = {
            title: `Dados de ${notifyDate}`,
            body: `${result.text}\n${footer}`,
          };

          const notifyResult = await Corona.sendNotification(notification);

          if (notifyResult > -1) {
            sendMessageAnswer(message, `notificação enviada.\n**${notification.title}**\n${notification.body}`);

            return;
          }

          sendMessageAnswer(message, 'ocorreu um erro, notificação não enviada');

          return;
        }
        sendMessageAnswer(message, 'não existem dados de hoje, notificação não enviada');

        return;
      }
      sendMessageAnswer(message, 'não tens permissão para usar o comando');

      return;
    }

    sendMessageAnswer(message, `desconheço essa opção.\n${this.usage}`);
  },
};
