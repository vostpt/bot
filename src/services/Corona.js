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

  const newReports = reports.filter(((_report, i) => newSearchResults[i]));

  db.CoronaReports.bulkCreate(newReports);

  const channel = client.channels.get(channels.DGSCORONA_CHANNEL_ID);

  const startMessage = '**Novo relatório de situação:**';

  newReports.forEach((report) => {
    const repMessage = `${startMessage}\n${report.title}`;

    sendMessageToChannel(channel, repMessage, report.link);
  });
};

module.exports = {
  getAll,
  updateReports,
};
