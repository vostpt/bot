/**
  Coronavirus-related services
 */
const { db } = require('../database/models');
const { CoronaApi, FirebaseApi } = require('../api');
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
 * Send reports to Discord,
 * also remind of unavailable reports on Twitter
 *
 * @param {Object} client
 * @param {String} startMessage
 * @param {Object} reports
 */
const sendDiscord = async (client, startMessage, reports) => {
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

    CoronaApi.uploadToFtp(report);
  });
};

/**
 * Check new reports. If exists, send to Discord
 *
 * @async
 * @param {Object} client
 */
const checkNewReports = async (client) => {
  const reports = await CoronaApi.getReports();

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

  if (newReportsWithMd5.length > 0) {
    db.CoronaReports.bulkCreate(newReportsWithMd5);

    const startMessage = '**Novo relatório de situação:**';

    sendDiscord(client, startMessage, newReportsWithMd5);
  }
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

  sendDiscord(client, startMessage, updatedReports);
};

/**
 * Get resume from a certain date
 *
 * @async
 * @param {Object} date
 * @returns {String}
 */

const getResume = async (date) => {
  const resumes = await CoronaApi.getDgsResumes();

  return resumes.find(resume => resume.date === date);
};

/**
 * Send notification to Estamos On app
 *
 * @async
 * @param {Object} notification
 * @returns {Number}
 */

const sendNotification = async (notification) => {
  const firebaseMsg = {
    name: 'String',
    notification,
    topic: '/topics/all',
  };

  try {
    const result = await FirebaseApi.sendNotification(firebaseMsg);

    console.log(result.toString());

    return 0;
  } catch (err) {
    console.log(err);

    return -1;
  }
};

module.exports = {
  getAll,
  checkNewReports,
  checkOldReports,
  getResume,
  sendNotification,
};
