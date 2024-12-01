const { WEATHER } = require('../config/services');
const moment = require('moment');
const { WeatherApi } = require('../api');
const { channels } = require('../../config/bot');
const { sendMessageToChannel } = require('./discord');
const { uploadThreadTwitter } = require('./twitter');
const { sendMessagesTelegram } = require('./telegram');
const { telegramKeys } = require('../../config/telegram');
const { locale } = require('../../config/locale');
const { convertBase64 } = require('../helpers');
const { sendPostsToBsky } = require('./Bsky');
const { uploadThreadMastodon } = require('./Mastodon');

// Constants
const LOG_PREFIX = '[Weather]';
const IMAGE_DESCRIPTION = "Métricas de Extremos Diários Verificados pelas estações do IPMA";

/**
 * Custom logger for Weather service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

// Initialize moment with locale
moment.locale(locale);

/**
 * Create report messages for each region
 * @param {String} date - Formatted date string
 * @returns {Object} Report messages by region
 */
const createReportMessages = (date) => ({
  pt: {
    text: `ℹ️🌦️ Extremos diários de ontem, ${date}, em Portugal Continental, reportados pelo @ipma_pt 🌦️ℹ️`,
    textTlg: `ℹ️🌦️ Extremos diários de ontem, ${date}, em Portugal Continental, reportados pelo IPMA 🌦️ℹ️`,
    channel: channels.WARNINGS_CHANNEL_ID,
  },
  mad: {
    text: `ℹ️🌦️ Extremos diários de ontem, ${date}, no Arquipélago da Madeira, reportados pelo @ipma_pt 🌦️ℹ️`,
    textTlg: `ℹ️🌦️ Extremos diários de ontem, ${date}, no Arquipélago da Madeira, reportados pelo IPMA 🌦️ℹ️`,
    channel: channels.WARNINGS_MD_CHANNEL_ID,
  },
  az: {
    text: `ℹ️🌦️ Extremos diários de ontem, ${date}, no Arquipélago dos Açores, reportados pelo @ipma_pt 🌦️ℹ️`,
    textTlg: `ℹ️🌦️ Extremos diários de ontem, ${date}, no Arquipélago dos Açores, reportados pelo IPMA 🌦️ℹ️`,
    channel: channels.WARNINGS_AZ_CHANNEL_ID,
  }
});

/**
 * Get weather data for a specific day
 * @param {Number} day - Day offset (0 for today, 1 for tomorrow)
 * @returns {Promise<Array>} Weather events
 */
const getByDay = async (day) => {
  try {
    if ( WEATHER || !WEATHER.enabled ) {
      logger.warning('Weather service is disabled in configuration');
      return;
    }

    const { data: events = [] } = await WeatherApi.getByDay(day);
    logger.info(`Retrieved ${events.length} weather events for day offset ${day}`);
    return events;
  } catch (error) {
    logger.error(`Failed to get weather data for day ${day}`, error);
    throw error;
  }
};

/**
 * Get daily report URLs
 * @returns {Promise<Object>} Report URLs
 */
const sendReportDiscord = async () => {
  try {
    const urls = await WeatherApi.getDailyReportURL();
    logger.info('Retrieved daily report URLs');
    return urls;
  } catch (error) {
    logger.error('Failed to get daily report URLs', error);
    throw error;
  }
};

/**
 * Process and send daily weather report to all platforms
 * @param {Object} client - Discord client
 */
const getDailyReport = async (client) => {
  try {
    if ( WEATHER || !WEATHER.enabled ) {
      logger.warning('Weather service is disabled in configuration');
      return;
    }
    logger.info('Starting daily weather report generation');

    // Fetch reports and URLs
    const [reportImg, reportUrl] = await Promise.all([
      WeatherApi.getDailyReportImg(),
      WeatherApi.getDailyReportURL()
    ]);

    const todayStr = moment().subtract(1, "days").format('DDMMMYYYY').toUpperCase();
    const reports = createReportMessages(todayStr);

    // Process images
    const processedReports = {
      pt: { ...reports.pt, base64: await convertBase64(reportImg.pt), url: reportUrl.pt },
      mad: { ...reports.mad, base64: await convertBase64(reportImg.mad), url: reportUrl.mad },
      az: { ...reports.az, base64: await convertBase64(reportImg.az), url: reportUrl.az }
    };

    // Send to Twitter
    await Promise.all([
      uploadThreadTwitter([{
        status: processedReports.pt.text,
        media: [processedReports.pt.base64],
      }], '', 'main'),
      
      uploadThreadTwitter([{
        status: processedReports.az.text,
        media: [processedReports.az.base64],
      }], '', 'azores')
    ]);

    // Send to Mastodon
    await uploadThreadMastodon([
      { status: processedReports.pt.text, media: processedReports.pt.base64 },
      { status: processedReports.mad.text, media: processedReports.mad.base64 },
      { status: processedReports.az.text, media: processedReports.az.base64 }
    ], 'main');

    // Send to Discord and prepare Telegram messages
    const tlgMessages = [];
    const bskyMessages = [];

    for (const region of ['pt', 'mad', 'az']) {
      const result = await sendMessageToChannel(
        client.channels.get(processedReports[region].channel),
        processedReports[region].text,
        processedReports[region].url
      );

      const attachmentURL = result.attachments.first().url;

      tlgMessages.push({
        chatId: telegramKeys.chat_id,
        photoURL: attachmentURL,
        options: {
          caption: processedReports[region].textTlg,
        },
      });

      bskyMessages.push({
        message: processedReports[region].text,
        imageUrl: attachmentURL,
        imageDes: IMAGE_DESCRIPTION,
      });
    }

    // Send to Telegram and Bluesky
    await Promise.all([
      sendMessagesTelegram(tlgMessages),
      sendPostsToBsky(bskyMessages)
    ]);

    logger.info('Successfully sent daily report to all platforms');
  } catch (error) {
    logger.error('Failed to process daily report', error);
    throw error;
  }
};

module.exports = {
  getByDay,
  sendReportDiscord,
  getDailyReport,
};
