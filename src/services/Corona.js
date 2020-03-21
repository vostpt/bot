/**
  Coronavirus-related services
 */
const { db } = require('../database/models');
const { CoronaApi } = require('../api');
const { sendMessageToChannel } = require('./Discord');
const { channels } = require('../../config/bot');

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
    title: report.title,
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
    const repMessage = `${startMessage}\n${report.title}`;

    sendMessageToChannel(channel, repMessage, report.link);

    CoronaApi.uploadToFtp(report);
  });
};

/**
 * Send new answers inserted in both Covid19 FAQ spreadsheets to Discord
 *
 * @async
 * @param {Object} client
 */
const getAnsweredFaqs = async (client) => {
  const {
    coronaResults,
    govResults,
  } = await CoronaApi.getFaqs();

  const channel = client.channels.get(channels.CORONAFAQ_CHANNEL_ID);

  coronaResults.forEach(async (result, id) => {
    const record = await db.CoronaFaqs.findByPk(id) || { answer: '' };

    if (result.answer !== record.answer) {
      const startMessage = record.answer === ''
        ? 'FAQ Covid-19 - Nova resposta'
        : 'FAQ Covid-19 - Resposta alterada';

      const recMessage = `**${startMessage}:**\nPergunta: ${result.question}\nResposta: ${result.answer}\nEntidade responsável: ${result.entity}`;

      sendMessageToChannel(channel, recMessage);
    }

    await db.CoronaFaqs.upsert({
      id,
      question: result.question,
      answer: result.answer,
      entity: result.entity,
    });
  });

  govResults.forEach(async (result, id) => {
    const record = await db.GovFaqs.findByPk(id) || { answer: '' };

    if (result.answer !== record.answer) {
      const startMessage = record.answer === ''
        ? 'FAQ Ministérios - Nova resposta'
        : 'FAQ Ministérios - Resposta alterada';

      const insertedOnSite = result.onsite === 'TRUE'
        ? 'Sim'
        : 'Não';

      const recMessage = `**${startMessage}:**\nÁrea: ${result.area}\nPergunta: ${result.question}\nResposta: ${result.answer}\nEntidade responsável: ${result.entity}\nInserido no site: ${insertedOnSite}`;

      sendMessageToChannel(channel, recMessage);
    }

    await db.GovFaqs.upsert({
      id,
      area: result.area,
      question: result.question,
      answer: result.answer,
      entity: result.entity,
      onsite: result.onsite,
    });
  });
};

module.exports = {
  getAll,
  updateReports,
  getAnsweredFaqs,
};
