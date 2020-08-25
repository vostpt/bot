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
 * Check if report link/URL is not in database
 *
 * @param {Object} report
 */
const reportLinkNotInDb = report => db.CoronaReports.findOne({
  where: {
    link: report.link,
  },
})
  .then(result => result === null);

/**
 * Send reports to Discord
 *
 * @param {Object} client
 * @param {String} startMessage
 * @param {Object} reports
 */
const sendReports = async (client, startMessage, reports) => {
  const channel = client.channels.get(channels.DGSCORONA_CHANNEL_ID);

  reports.forEach(async (report) => {
    // Using the first 8 characters of the checksum looks better on Discord
    const strMd5sum = report.md5sum === ''
      ? '*Indisponível*'
      : `\`${report.md5sum.slice(0, 8)}\``;

    const repMessage = `${startMessage}\n${strMd5sum} | ${report.title}`;

    const reportLink = report.md5sum === ''
      ? undefined
      : report.link;

    sendMessageToChannel(channel, repMessage, reportLink);

    // CoronaApi.uploadToFtp(report);
  });
};

/**
 * Check new reports. If exists, send to Discord
 *
 * @async
 * @param {Object} client
 */
const checkNewReports = async (client) => {
  const reports = (await CoronaApi.getReports()).slice(-30);

  const newSearchResults = await Promise.all(reports.map(report => reportLinkNotInDb(report)));

  const newReports = await Promise.all(reports.filter((_report, i) => newSearchResults[i]));

  const newReportsWithMd5 = await Promise.all(newReports.map(async (report) => {
    const md5sum = await CoronaApi.md5FromUrl(report.link);

    return {
      link: report.link,
      title: report.title,
      md5sum,
    };
  }));

  db.CoronaReports.bulkCreate(newReportsWithMd5);

  const startMessage = '**Novo relatório de situação:**';

  sendReports(client, startMessage, newReportsWithMd5);
};

/**
 * Check updated reports. If exists, send to Discord
 *
 * @async
 * @param {Object} client
 */
const checkOldReports = async (client) => {
  const reports = await getAll();

  const getReportMd5 = await Promise.all(reports.map(async (report) => {
    const newMd5sum = await CoronaApi.md5FromUrl(report.link);

    return {
      link: report.link,
      title: report.title,
      oldMd5: report.md5sum,
      md5sum: newMd5sum,
    };
  }));

  const updatedReports = await Promise.all(getReportMd5.filter(rep => rep.oldMd5 !== rep.md5sum));

  updatedReports.forEach((report) => {
    db.CoronaReports.update({
      title: report.title,
      md5sum: report.md5sum,
    },
    { where: { link: report.link } });
  });

  const startMessage = '**Relatório de situação atualizado:**';

  sendReports(client, startMessage, updatedReports);
};

module.exports = {
  getAll,
  checkNewReports,
  checkOldReports,
};
