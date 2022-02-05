const moment = require('moment');

const { Corona } = require('../services');
const { cooldown, userLists, roleLists } = require('../../config/bot');
const { sendMessageAnswer } = require('../services/Discord');
const { parseVostDate } = require('../helpers');

const vostDateFormat = 'DDMMMYYYY';

const getSearchDate = async (date) => {
  return date === 'hoje'
    ? moment()
    : (await parseVostDate(date)).add(12, 'hours');
};

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
    **!corona update <data> <num_confirmados> <num_hospitalizados> <num_UCI> <num_óbitos> <num_recuperados>** *[comando restrito]* - Atualiza a spreadsheet Covid-19 com os valores fornecidos, na data especificada ('hoje', ou data no formato VOSTPT -> DDMMMAAAA).
    **!corona notify <URL relatório>** *[comando restrito | obrigatório anexar 1 ficheiro]* - Envia os dados do relatório para o Twitter, Telegram e Mastodon (no caso do Telegram também é enviado o ficheiro em anexo).
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

      const msgReportArray = reports.map((report) => `\`${report.md5sum.slice(0, 8)}\` | ${report.title}: ${report.link}`).join('\n');
      sendMessageAnswer(message, string.concat(msgReportArray));

      return;
    }

    if (requestedParam === 'resumo') {
      if (args.length < 2) {
        sendMessageAnswer(message, `falta introduzir a data.\n${this.usage}`);

        return;
      }

      const resSearchDate = await getSearchDate(args[1]);

      const result = await Corona.getResume(resSearchDate);

      const string = result.resume === null || typeof result === 'undefined' || result === ''
        ? 'não foi encontrado nenhum resumo nesta data'
        : `aqui está o resumo do relatório:\n**Boletim DGS ${await resSearchDate.format(vostDateFormat).toUpperCase()}**:\n${result.resume}\n\nVariação semanal:\n${result.weekVar}\nFonte: DGS/@VOSTPT`;

      sendMessageAnswer(message, string);

      return;
    }

    // update and notify commands are restricted

    const checkUserAuth = () => {
      const userId = message.author.id;

      const authUser = userLists.coronaUpdate.includes(userId);

      if (authUser) {
        return true;
      }

      const authRole = roleLists.coronaUpdate.some((role) => message.member.roles.has(role));

      return authRole;
    };

    if (!checkUserAuth()) {
      sendMessageAnswer(message, 'não tens permissão para usar o comando');

      return;
    }

    if (requestedParam === 'update') {
      if (args.length < 7) {
        sendMessageAnswer(message, `falta introduzir valores.\n${this.usage}`);

        return;
      }

      try {
        const updSearchDate = await getSearchDate(args[1]);

        const reportValues = {
          date: updSearchDate,
          confirmed: args[2],
          atHospital: args[3],
          atICU: args[4],
          deaths: args[5],
          recovered: args[6],
        };

        await Corona.updateSpreadsheet(reportValues);

        const result = await Corona.getResume(updSearchDate);

        const updateDate = updSearchDate.format(vostDateFormat).toUpperCase();

        sendMessageAnswer(message, `os dados foram atualizados, aqui está o resumo:\n**Boletim DGS ${updateDate}**\n${result.resume}\n\nVariação semanal:\n${result.weekVar}\nFonte: DGS/@VOSTPT`);
      } catch (e) {
        sendMessageAnswer(message, `não foi possível atualizar os dados. Erro:\n'''${e}'''`);
      }
      return;
    }

    if (requestedParam === 'notify') {
      const searchDate = moment();

      const attachmentURLs = message.attachments.map((attachment) => attachment.url);

      const numAttachments = attachmentURLs.length;

      if (numAttachments !== 1) {
        sendMessageAnswer(message, `foram enviados ${numAttachments} anexos, quando deveria ter sido enviado 1 -> Tenta outra vez`);

        return;
      }

      const reportURL = args[1];

      if (!reportURL) {
        sendMessageAnswer(message, 'falta introduzir o URL do relatório');

        return;
      }

      const result = await Corona.getResume(searchDate);

      if (result.resume !== null || typeof result !== 'undefined' && result !== '') {
        const notifyResult = await Corona.sendNotification(
          result,
          attachmentURLs[0],
          reportURL,
        );

        if (notifyResult > -1) {
          sendMessageAnswer(message, 'notificação enviada');

          return;
        }

        sendMessageAnswer(message, 'ocorreu um erro, notificação não enviada');

        return;
      }
      sendMessageAnswer(message, 'não existem dados de hoje, notificação não enviada');

      return;
    }

    sendMessageAnswer(message, `desconheço essa opção.\n${this.usage}`);
  },
};
