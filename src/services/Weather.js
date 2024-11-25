const moment = require('moment');
const { WeatherApi } = require('../api');
const { channels } = require('../../config/bot');
const { sendMessageToChannel } = require('./Discord');
const { uploadThreadTwitter } = require('./Twitter');
const { sendMessagesTelegram } = require('./Telegram');
const { telegramKeys } = require('../../config/telegram');
const { locale } = require('../../config/locale');
const { convertBase64 } = require('../helpers');
const { sendPostsToBsky } = require('./Bsky');
const { uploadThreadMastodon } = require('./Mastodon');

/**
 * Get weather data for today or tomorrow
 *
 * @param {Number} day
 * @returns {Array} events
 */
const getByDay = async (day) => {
  const { data: events = [] } = await WeatherApi.getByDay(day);

  return events;
};

moment.locale(locale);

/**
 * Send daily extreme report image URL's
 *
 */
const sendReportDiscord = async () => {
  return WeatherApi.getDailyReportURL();
};

/**
 * Check daily extreme report and send to social networks
 *
 */
const getDailyReport = async (client) => {
  const reportImg = await WeatherApi.getDailyReportImg();

  const reportUrl = await WeatherApi.getDailyReportURL();

  const todayStr = moment().subtract(1, "days").format('DDMMMYYYY').toUpperCase();

  const reports = {
    pt: {
      base64: await convertBase64(reportImg.pt),
      text: `ℹ️🌦️ Extremos diários de ontem, ${todayStr}, em Portugal Continental, reportados pelo @ipma_pt 🌦️ℹ️`,
      textTlg: `ℹ️🌦️ Extremos diários de ontem, ${todayStr}, em Portugal Continental, reportados pelo IPMA 🌦️ℹ️`,
      channel: channels.WARNINGS_CHANNEL_ID,
      url: reportUrl.pt,
    },
    mad: {
      base64: await convertBase64(reportImg.mad),
      text: `ℹ️🌦️ Extremos diários de ontem, ${todayStr}, no Arquipélago da Madeira, reportados pelo @ipma_pt 🌦️ℹ️`,
      textTlg: `ℹ️🌦️ Extremos diários de ontem, ${todayStr}, no Arquipélago da Madeira, reportados pelo IPMA 🌦️ℹ️`,
      channel: channels.WARNINGS_MD_CHANNEL_ID,
      url: reportUrl.mad,
    },
    az: {
      base64: await convertBase64(reportImg.az),
      text: `ℹ️🌦️ Extremos diários de ontem, ${todayStr}, no Arquipélago dos Açores, reportados pelo @ipma_pt 🌦️ℹ️`,
      textTlg: `ℹ️🌦️ Extremos diários de ontem, ${todayStr}, no Arquipélago dos Açores, reportados pelo IPMA 🌦️ℹ️`,
      channel: channels.WARNINGS_AZ_CHANNEL_ID,
      url: reportUrl.az,
    }
  };

  const tweetsPt = [
    {
      status: reports.pt.text,
      media: [reports.pt.base64],
    }
  ];

  uploadThreadTwitter(tweetsPt, '', 'main');

  const tweetAz = [{
    status: reports.az.text,
    media: [reports.az.base64],
  }];

  uploadThreadTwitter(tweetAz, '', 'azores');

  const postMast = [
    {
      status: reports.pt.text,
      media: reports.pt.base64,
    },
    {
      status: reports.mad.text,
      media: reports.mad.base64,
    },
    {
      status: reports.az.text,
      media: reports.az.base64,
    }
  ]

  uploadThreadMastodon(postMast, 'main');

  const tlgMessages = [];

  const resultPt = await sendMessageToChannel(client.channels.get(reports.pt.channel), reports.pt.text, reports.pt.url);

  const attachmentURLsPt = resultPt.attachments.map((attachment) => attachment.url);

  tlgMessages.push({
    chatId: telegramKeys.chat_id,
    photoURL: attachmentURLsPt[0],
    options: {
      caption: reports.pt.textTlg,
    },
  });

  const resultMad = await sendMessageToChannel(client.channels.get(reports.mad.channel), reports.mad.text, reports.mad.url);

  const attachmentURLsMad = resultMad.attachments.map((attachment) => attachment.url);

  tlgMessages.push({
    chatId: telegramKeys.chat_id,
    photoURL: attachmentURLsMad[0],
    options: {
      caption: reports.mad.textTlg,
    },
  });

  const resultAz = await sendMessageToChannel(client.channels.get(reports.az.channel), reports.az.text, reports.az.url);

  const attachmentURLsAz = resultAz.attachments.map((attachment) => attachment.url);

  tlgMessages.push({
    chatId: telegramKeys.chat_id,
    photoURL: attachmentURLsAz[0],
    options: {
      caption: reports.az.textTlg,
    },
  });

  await sendMessagesTelegram(tlgMessages);

  const imgDes = "Métricas de Extremos Diários Verificados pelas estações do IPMA";

  const bskyMessages = [];
  bskyMessages.push({
    message: reports.pt.text,
    imageUrl: attachmentURLsPt[0],
    imageDes: imgDes,
  });
  bskyMessages.push({
    message: reports.mad.text,
    imageUrl: attachmentURLsMad[0],
    imageDes: imgDes,
  });
  bskyMessages.push({
    message: reports.az.text,
    imageUrl: attachmentURLsAz[0],
    imageDes: imgDes,
  });

  await sendPostsToBsky(bskyMessages);
};

module.exports = {
  getByDay,
  sendReportDiscord,
  getDailyReport,
};
