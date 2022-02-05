/**
  Coronavirus-related services
 */
const { GoogleSpreadsheet } = require('google-spreadsheet');
const moment = require('moment');

const authFile = require('../../data/auth/vostpt-bot');
const { db } = require('../database/models');
const { CoronaApi } = require('../api');
const { channels } = require('../../config/bot');
const { dgsResumes } = require('../../config/api');
const { sendMessageToChannel } = require('./Discord');
const { uploadThreadTwitter } = require('./Twitter');
const { sendDocumentTelegram } = require('./Telegram');
const { telegramKeys } = require('../../config/telegram');
const { sendPostMastodon } = require('./Mastodon');
const { postMessageFacebook } = require('./Facebook');
const { splitMessageString } = require('../helpers');

/**
 * Get all reports
 *
 * @returns {Object}
 * @async
 */
const getAll = async () => {
  const result = await db.CoronaReports.findAll();
  return result.map((report) => report.dataValues);
};

/**
 * Check if report link/URL is not in database
 *
 * @param {Object} report
 */
const reportLinkNotInDb = (report) => db.CoronaReports.findOne({
  where: {
    link: report.link,
  },
})
  .then((result) => result === null);

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

  const newSearchResults = await Promise.all(reports.map((report) => reportLinkNotInDb(report)));

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

  const updatedReports = await Promise.all(getReportMd5.filter((rep) => rep.oldMd5 !== rep.md5sum));

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
  const doc = new GoogleSpreadsheet(dgsResumes.id);

  await doc.useServiceAccountAuth(authFile);

  await doc.loadInfo();

  const sheet = await doc.sheetsByIndex[dgsResumes.resumeGid - 1];

  await sheet.loadCells(['A2:A', 'V2:V', 'W2:W']);

  const googleEpoch = moment('30/12/1899', 'DD/MM/YYYY');

  const updateDate = (date).diff(googleEpoch, 'days');

  const { rowCount } = sheet;

  for (let i = 1; i < rowCount; i += 1) {
    const cell = sheet.getCell(i, 0);

    if (cell.value === updateDate) {
      const resume = (sheet.getCell(i, 21)).value;
      const weekVar = (sheet.getCell(i, 22)).value;

      return {
        resume,
        weekVar 
      };
    }
  }

  return '';
};

/**
 * Add coronavirus daily numbers to spreadsheet
 *
 * @async
 * @param {Object} notification
 */

const updateSpreadsheet = async (reportValues) => {
  const doc = new GoogleSpreadsheet(dgsResumes.id);

  await doc.useServiceAccountAuth(authFile);

  await doc.loadInfo();

  const sheet = await doc.sheetsByIndex[dgsResumes.dataGid - 1];

  await sheet.loadCells(['A1:1', 'A5:5', 'A6:6', 'A8:8', 'A9:9', 'A10:10']);

  const googleEpoch = moment('30/12/1899', 'DD/MM/YYYY');

  const updateDate = (reportValues.date).diff(googleEpoch, 'days');

  const { columnCount } = sheet;

  for (let i = 0; i < columnCount; i += 1) {
    const cell = sheet.getCell(0, i);

    if (cell.value === updateDate) {
      (sheet.getCell(4, i)).value = Number(reportValues.deaths);
      (sheet.getCell(5, i)).value = Number(reportValues.recovered);
      (sheet.getCell(7, i)).value = Number(reportValues.confirmed);
      (sheet.getCell(8, i)).value = Number(reportValues.atHospital);
      (sheet.getCell(9, i)).value = Number(reportValues.atICU);
    }
  }

  await sheet.saveUpdatedCells();
};

const sendNotification = async (report, attachmentURL, reportURL) => {
  try {
    const notifyDate = moment().format('DDMMMYYYY').toUpperCase();

    const strTwitter = {
      first: `ℹ️🦠 #COVID19PT Relatório @DGSaude ${notifyDate}\n${report.resume}\n${reportURL} 🦠ℹ️`,
      second: `ℹ️🦠 #COVID19PT Variação semanal\n${report.weekVar} 🦠ℹ️`
    };

    const strFbPlr = `ℹ️🦠 #COVID19PT Relatório @DGSaude ${notifyDate}\n${report.resume}\n\nVariação semanal:\n${report.weekVar}\n${reportURL} 🦠ℹ️`;

    const fileName = 'corona/VOSTPT_DGS_Covid19_Report.png';

    const splitFirstStrTwitter = splitMessageString(strTwitter.first, 280).map((string) => ({
      status: string,
    }));

    splitFirstStrTwitter[0].media = [fileName];

    const thrTwitter = [
      ...splitFirstStrTwitter,
      {
        status: strTwitter.second,
        media: [fileName],
      }
    ];

    uploadThreadTwitter(thrTwitter, '', 'main');

    const strTelegram = `#COVID19PT Boletim DGS ${notifyDate}\n${report.resume}\n\nVariação semanal:\n${report.weekVar}\nFonte: DGS/@VOSTPT by @VOSTPT`;

    const tlgMessage = {
      chatId: telegramKeys.chat_id,
      document: attachmentURL,
      options: {
        caption: strTelegram,
      },
    };

    sendDocumentTelegram(tlgMessage);

    const post = {
      status: strFbPlr,
      media: fileName,
      options: {
        spoiler_text: 'Covid-19',
        sensitive: false,
        language: 'pt',
      },
    };

    sendPostMastodon(post);

    
    const fbpost = {
      message: strFbPlr,
      media: fileName,
    }

    postMessageFacebook(fbpost);

    return 0;
  } catch (e) {
    return -1;
  }
};

module.exports = {
  getAll,
  checkNewReports,
  checkOldReports,
  getResume,
  updateSpreadsheet,
  sendNotification,
};
