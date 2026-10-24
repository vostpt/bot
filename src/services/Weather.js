const moment = require('moment');
const { WeatherApi } = require('../api');
const { channels } = require('../../config/bot');
const { getChannel, sendMessageToChannel } = require('./Discord');
const { uploadThreadTwitter } = require('./Twitter');
const { sendMessagesTelegram } = require('./Telegram');
const { telegramKeys } = require('../../config/telegram');
const { locale } = require('../../config/locale');
const { convertBase64, publishAll } = require('../helpers');
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
  const imgDes = "Métricas de Extremos Diários Verificados pelas estações do IPMA";
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

  const tweetAz = [{
    status: reports.az.text,
    media: [reports.az.base64],
  }];

  const postMast = [
    {
      status: reports.pt.text.replace('@ipma_pt', 'IPMA'),
      media: reports.pt.base64,
      description: imgDes,
    },
    {
      status: reports.mad.text.replace('@ipma_pt', 'IPMA'),
      media: reports.mad.base64,
      description: imgDes,
    },
    {
      status: reports.az.text.replace('@ipma_pt', 'IPMA'),
      media: reports.az.base64,
      description: imgDes,
    }
  ]

  const tlgMessages = Object.values(reports).map((report) => ({
    chatId: telegramKeys.chat_id,
    photoURL: report.url,
    options: { caption: report.textTlg },
  }));
  const bskyMessages = Object.values(reports).map((report) => ({
    message: report.text.replace('@ipma_pt', 'IPMA'),
    imageUrl: report.url,
    imageDes: imgDes,
  }));
  const publishDiscord = async () => {
    for (const report of Object.values(reports)) {
      const channel = await getChannel(client, report.channel);
      if (!channel) throw new Error(`Discord channel ${report.channel} is not accessible`);
      await sendMessageToChannel(channel, report.text, report.url);
    }
  };

  return publishAll('daily-weather', {
    discord: publishDiscord,
    twitterMain: () => uploadThreadTwitter(tweetsPt, '', 'main'),
    twitterAzores: () => uploadThreadTwitter(tweetAz, '', 'azores'),
    mastodon: () => uploadThreadMastodon(postMast, 'main'),
    telegram: () => sendMessagesTelegram(tlgMessages),
    bluesky: () => sendPostsToBsky(bskyMessages),
  });
};

module.exports = {
  getByDay,
  sendReportDiscord,
  getDailyReport,
};
