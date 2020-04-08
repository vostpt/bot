/**
  Coronavirus-related services
 */
const { db } = require('../database/models');
const { CoronaApi } = require('../api');
const { channels } = require('../../config/bot');
const { sendMessageToChannel } = require('./Discord');
const { uploadThreadTwitter } = require('./Twitter');
const { splitMessageString } = require('../helpers');

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
  const results = await CoronaApi.getFaqs();

  const channel = client.channels.get(channels.CORONAFAQ_CHANNEL_ID);

  const maxLength = {
    question: 205,
    answer: 155,
  };

  await results.data.feed.entry.forEach(async (row, id) => {
    const result = {
      id,
      area: row['gsx$área'].$t,
      question: row.gsx$pergunta.$t,
      answer: row.gsx$resposta.$t,
      entity: row.gsx$entidade.$t,
    };

    const startTweet = 'ℹ️🦠 #COVID19PT #COVID19PTFAQ';

    const endTweet = '🦠ℹ️';

    const websiteURL = 'https://covid19estamoson.gov.pt/perguntas-frequentes/';

    const record = await db.CoronaFaqs.findByPk(id) || { answer: '', newAnswer: true };

    if (result.answer === record.answer) {
      if (record.awaiting) {
        const recNewAnswer = record.newAnswer;

        const startMessage = recNewAnswer
          ? 'FAQ Covid-19 - Nova resposta'
          : 'FAQ Covid-19 - Resposta alterada';

        const recMessage = `**${startMessage}:**\nÁrea: ${result.area}\nPergunta: ${result.question}\nResposta: ${result.answer}\nEntidade responsável: ${result.entity}`;

        sendMessageToChannel(channel, recMessage);

        if (recNewAnswer) {
          const questionString = result.question.length > maxLength.question
            ? `"${splitMessageString(result.question, maxLength.question - 63, true)[0]}(...)" (pergunta completa disponível no site #COVID19EstamosON)`
            : `"${result.question}"`;

          const answerString = result.answer.length + result.entity.length > maxLength.answer
            ? `${splitMessageString(result.answer, maxLength.answer - 62, true)[0]}(...) (resposta completa disponível no site #COVID19EstamosON)\n\nEntidade responsável: ${result.entity}`
            : `${result.answer}\n\nEntidade responsável: ${result.entity}`;

          const thread = [{
            status: `${startTweet}\n\nNova resposta à pergunta ${questionString} 👇\n\n${endTweet}`,
          }, {
            status: `${startTweet}\n\n${answerString}\n\n${websiteURL}\n\n${endTweet}`,
          }];

          uploadThreadTwitter(thread, undefined, 'main');
        }

        if (result.answer === '') {
          await record.destroy();
        } else {
          result.awaiting = false;
          result.newAnswer = false;

          await db.CoronaFaqs.upsert(result);
        }
      }
    } else {
      result.awaiting = true;

      const newAnswer = record.answer === '' && record.newAnswer;
      result.newAnswer = newAnswer;

      await db.CoronaFaqs.upsert(result);
    }
  });
};

module.exports = {
  getAll,
  updateReports,
  getAnsweredFaqs,
};
