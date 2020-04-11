/**
  Coronavirus-related services
 */
const { db } = require('../database/models');
const { CoronaApi } = require('../api');
const { channels } = require('../../config/bot');
const { sendMessageToChannel } = require('./Discord');

/**
 * Get all reports
 *
 * @returns {Object}
 * @async
 */
const getAll = async () => {
  try {
    const result = await db.CoronaReports.findAll();

    return result.map(report => report.dataValues);
  } catch (e) {
    throw e;
  }
};

/**
 * Check if report is not in database
 *
 * @param {Object} report
 */
const reportNotInDb = report => db.CoronaReports.findOne({
  where: {
    md5sum: report.md5sum,
  },
})
  .then(result => result === null);

/**
 * Send new reports to Discord and Twitter
 *
 * @async
 * @param {Object} client
 */
const updateReports = async (client) => {
  const reports = await CoronaApi.getReports();

  const newSearchResults = await Promise.all(reports.map(report => reportNotInDb(report)));

  const newReports = reports.filter((_report, i) => newSearchResults[i]);

  db.CoronaReports.bulkCreate(newReports);

  const channel = client.channels.get(channels.DGSCORONA_CHANNEL_ID);

  const startMessage = '**Novo relatório de situação:**';

  newReports.forEach(async (report) => {
    // Using the first 8 characters of the checksum looks better on Discord
    const repMessage = `${startMessage}\n\`${report.md5sum.slice(0, 8)}\` | ${report.title}`;
    sendMessageToChannel(channel, repMessage, report.link);

    CoronaApi.uploadToFtp(report);
  });
};

/**
 * Send new answers inserted in both Covid19 FAQ spreadsheets to Discord
 * The function should check if answer was written entirely
 *
 * @async
 * @param {Object} client
 */
const getAnsweredFaqs = async (client) => {
  const { coronaFaqs, coronaDgsFaqs } = await CoronaApi.getFaqs();

  const faqLists = [{
    title: 'Ministérios / Áreas',
    faqs: coronaFaqs.data.feed.entry,
    database: db.CoronaFaqs,
  },
  {
    title: 'DGS',
    faqs: coronaDgsFaqs.data.feed.entry,
    database: db.CoronaDgsFaqs,
  }];

  const channel = client.channels.get(channels.CORONAFAQ_CHANNEL_ID);

  faqLists.forEach(async (list) => {
    list.faqs.forEach(async (row, id) => {
      const result = {
        id,
        question: row.gsx$pergunta.$t,
        answer: row.gsx$resposta.$t,
        entity: row.gsx$entidade.$t,
      };

      if (row['gsx$área']) {
        result.area = row['gsx$área'].$t;
      }

      const record = await list.database.findByPk(id) || { answer: '', newAnswer: true };

      if (result.answer === record.answer) {
        if (record.awaiting) {
          const recNewAnswer = record.newAnswer;

          const startMessage = recNewAnswer
            ? `FAQ ${list.title} - Nova resposta`
            : `FAQ ${list.title} - Resposta alterada`;

          const strArea = result.area
            ? `Área: ${result.area}\n`
            : '';

          const recMessage = `**${startMessage}:**\n${strArea}Pergunta: ${result.question}\nResposta: ${result.answer}\nEntidade responsável: ${result.entity}`;

          sendMessageToChannel(channel, recMessage);

          if (result.answer === '') {
            await record.destroy();
          } else {
            result.awaiting = false;
            result.newAnswer = false;

            await list.database.upsert(result);
          }
        }
      } else {
        result.awaiting = true;

        const newAnswer = record.answer === '' && record.newAnswer;
        result.newAnswer = newAnswer;

        await list.database.upsert(result);
      }
    });
  });
};

module.exports = {
  getAll,
  updateReports,
  getAnsweredFaqs,
};
