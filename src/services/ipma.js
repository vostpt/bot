const { IPMA } = require('../config/services');
const { DateTime } = require('luxon');
const moment = require('moment');
const { IpmaApi, WarningsApi } = require('../api');
const { db, Op } = require('../database/models');
const { locale } = require('../../config/locale');
const { 
  warningTypes, 
  regionsData, 
  warningSeverities, 
  DATE_FORMATS 
} = require('../../config/warnings');
const { channels } = require('../../config/bot');
const { baseImagesURL } = require('../../config/api');
const { telegramKeys } = require('../../config/telegram');

const { uploadThreadTwitter } = require('./twitter');
const { sendMessageToChannel } = require('./discord');
const { removeAccent, splitMessageString } = require('../helpers');
const { sendMessagesTelegram } = require('./telegram');
const { sendPostMastodon } = require('./Mastodon');
const { postMessageFacebook } = require('./facebook');
const { sendPostsToBsky } = require('./Bsky');

// Constants
const LOG_PREFIX = '[IPMA]';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Initialize moment locale settings
moment.locale(locale);
moment.updateLocale(locale, {
  calendar: {
    lastDay: 'HH:mm[h de ontem]',
    sameDay: 'HH:mm[h de hoje]',
    nextDay: 'HH:mm[h de amanhã]',
    lastWeek: 'HH:mm[h do dia]',
    nextWeek: 'HH:mm[h do dia]',
    sameElse: 'HH:mm[h do dia]',
  },
});

/**
 * Custom logger for IPMA service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Number} attempts - Number of attempts
 * @param {Number} delay - Initial delay in ms
 */
const retry = async (fn, attempts = RETRY_ATTEMPTS, delay = RETRY_DELAY) => {
  try {
    return await fn();
  } catch (error) {
    if (attempts === 1) throw error;
    logger.warning(`Retrying operation. Attempts remaining: ${attempts - 1}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, attempts - 1, delay * 2);
  }
};

/**
 * Format warning time and date
 * @param {String} startTime - Warning start time
 * @param {String} endTime - Warning end time
 * @returns {String} Formatted time string
 */
const formatWarningTime = (startTime, endTime) => {
  const actualTime = moment();
  const beginTimeObj = moment(startTime, DATE_FORMATS.first);
  const endTimeObj = moment(endTime, DATE_FORMATS.first);
  const strBeginHour = beginTimeObj.format('HH:mm');
  const strBeginDate = beginTimeObj.format('DDMMMYY').toUpperCase();
  const strEndDate = endTimeObj.format('DDMMMYY').toUpperCase();

  if (beginTimeObj.isBefore(actualTime)) {
    return `até às ${endTimeObj.calendar(actualTime)} ${strEndDate}`;
  }

  if (beginTimeObj.isSame(endTimeObj, 'day')) {
    return `entre as ${strBeginHour}h e as ${endTimeObj.calendar(actualTime)} ${strEndDate}`;
  }

  return `entre as ${beginTimeObj.calendar(actualTime)} ${strBeginDate} e as ${endTimeObj.calendar(actualTime)} ${strEndDate}`;
};

/**
 * Format district list based on regions and zone
 * @param {Array} regions - List of region codes
 * @param {String} zone - Zone type (mainland, azores, madeira)
 * @param {Boolean} startSentence - Whether this starts a sentence
 * @returns {String} Formatted district string
 */
const formatDistrictString = (regions, zone, startSentence = false) => {
  const getDistrictList = () => {
    if (regions.length === 1) {
      return `#${regionsData[regions[0]].strRegion}`;
    }

    return regions.map((region, index) => {
      if (index === regions.length - 1) {
        return `e #${regionsData[region].strRegion}`;
      }
      if (index === regions.length - 2) {
        return `#${regionsData[region].strRegion} `;
      }
      return `#${regionsData[region].strRegion}, `;
    }).join('');
  };

  const startStr = startSentence ? '' : 'para ';
  const districtList = getDistrictList();

  switch (zone) {
    case 'mainland':
      if (regions.length === 1) {
        return startSentence
          ? `Distrito de ${districtList}`
          : `${startStr}o distrito de ${districtList}`;
      }
      return startSentence
        ? `Distritos de ${districtList}`
        : `${startStr}os distritos de ${districtList}`;
    case 'azores':
      return `${startStr}${districtList} do arquipélago dos #Açores`;
    case 'madeira':
      return `${startStr}${districtList} do arquipélago da #Madeira`;
    default:
      return `${startStr}${districtList}`;
  }
};

/**
 * Create warning messages for different platforms
 * @param {Object} warning - Warning data
 * @param {String} zone - Zone type
 * @returns {Object} Messages for different platforms
 */
const createWarningMessages = (warning, zone) => {
  const {
    awarenessTypeName,
    startTime,
    endTime,
    awarenessLevelID,
    regions,
  } = warning;

  const { strType, emoji, emojiDiscord } = warningTypes[awarenessTypeName];
  const level = warningSeverities[awarenessLevelID.toLowerCase()];
  const timeStr = formatWarningTime(startTime, endTime);
  const districtStr = formatDistrictString(regions, zone, false);
  const strHeader = `#Aviso${level} devido a #${strType}`;

  const strTwitter = `ℹ️⚠️${emoji} ${strHeader} ${timeStr} ${districtStr} ${emoji}⚠️ℹ️`;
  const strTelegram = `ℹ️⚠️${emoji} ${strHeader} ${districtStr} ${timeStr} ${emoji}⚠️ℹ️`;
  const strDiscord = `:information_source: :warning: ${emojiDiscord} ${strHeader} ${timeStr} ${districtStr} ${emojiDiscord} :warning: :information_source:\n\n`;

  const fileName = `warnings/Twitter_Post_Aviso${level}_${removeAccent(strType)}.png`;
  const photoURL = `${baseImagesURL}/${fileName}`;

  return {
    strTwitter,
    strTelegram,
    strDiscord,
    fileName,
    photoURL,
    level,
    strImgDesc: `Aviso ${level} devido a ${awarenessTypeName}`
  };
};

/**
 * Check if a warning exists in DB and is still valid
 * @param {Object} warning - Warning data
 * @returns {Promise<Boolean>} Whether warning should be processed
 */
const isNewWarning = async (warning) => {
  const now = DateTime.now();
  const end = DateTime.fromISO(warning.end);

  if (end < now) {
    return false;
  }

  const result = await db.IpmaWarnings.findOne({
    attributes: ['idAreaAviso', 'awarenessTypeName', 'startTime', 'endTime', 'awarenessLevelID'],
    where: {
      idAreaAviso: warning.idAreaAviso,
      awarenessTypeName: warning.awarenessTypeName,
      startTime: {
        [Op.lte]: DateTime.fromISO(warning.startTime).toJSDate(),
      },
      endTime: warning.endTime,
      awarenessLevelID: warning.awarenessLevelID,
    },
  });

  return (result === null);
};

/**
 * Send messages to social media platforms with retry logic
 * @param {Object} messages - Prepared messages for different platforms
 * @param {String} zone - Geographic zone
 */
const sendSocialMediaMessages = async (messages, zone) => {
  const { strTwitter, fileName, level } = messages;

  try {
    // Twitter
    const twitterMessage = splitMessageString(strTwitter, 280).map(status => ({
      status,
      media: status === strTwitter ? [fileName] : undefined,
    }));

    if (zone === 'azores') {
      await retry(() => uploadThreadTwitter([...twitterMessage], '', 'azores'));
      logger.info(`Posted Azores warning to Twitter: ${level}`);
    } else if (zone !== 'madeira' && level !== 'Amarelo') {
      await retry(() => uploadThreadTwitter([...twitterMessage], '', 'main'));
      logger.info(`Posted mainland warning to Twitter: ${level}`);
    }

    // Mastodon
    await retry(() => 
      sendPostMastodon({
        status: strTwitter,
        media: fileName,
        options: { sensitive: false, language: 'pt' },
      }, 'main')
    );
    logger.info(`Posted warning to Mastodon: ${level}`);

    // Facebook (high severity only)
    if (level === 'Laranja' || level === 'Vermelho') {
      await retry(() => 
        postMessageFacebook({
          message: strTwitter,
          media: fileName,
        })
      );
      logger.info(`Posted high severity warning to Facebook: ${level}`);
    }
  } catch (error) {
    logger.error('Failed to send social media messages', error);
    throw error;
  }
};

/**
 * Process and publish warnings for a specific zone
 * @param {Object} client - Discord client
 * @param {String} zone - Zone type
 * @param {Array} warnings - List of warnings
 */
const publishWarnings = async (client, zone, warnings) => {
  logger.info(`Processing ${warnings.length} warnings for zone: ${zone}`);

  try {
    // Group warnings by type, time and severity
    const groupedWarnings = warnings.reduce((acc, warning) => {
      const key = `${warning.awarenessTypeName}-${warning.startTime}-${warning.endTime}-${warning.awarenessLevelID}`;
      if (!acc[key]) {
        acc[key] = {
          ...warning,
          regions: [warning.idAreaAviso],
        };
      } else {
        acc[key].regions.push(warning.idAreaAviso);
      }
      return acc;
    }, {});

    logger.info(`Grouped into ${Object.keys(groupedWarnings).length} unique warnings`);

    const discordMessages = [];
    const telegramMessages = [];
    const bskyPosts = [];

    // Process each grouped warning
    for (const warning of Object.values(groupedWarnings)) {
      const messages = createWarningMessages(warning, zone);

      // Collect messages for batch sending
      discordMessages.push(messages.strDiscord);
      telegramMessages.push({
        chatId: telegramKeys.chat_id,
        photoURL: messages.photoURL,
        options: { caption: messages.strTelegram },
      });
      bskyPosts.push({
        imageUrl: messages.photoURL,
        imageDes: messages.strImgDesc,
        message: messages.strTwitter,
      });

      // Send to social media platforms
      await sendSocialMediaMessages(messages, zone);

      // Store warning in database
      await retry(() => WarningsApi.postNewWarning(warning));
      logger.info(`Stored warning in database: ${warning.awarenessTypeName} - ${warning.awarenessLevelID}`);
    }

    // Send batch messages to platforms
    if (discordMessages.length > 0) {
      const channelId = {
        mainland: channels.WARNINGS_CHANNEL_ID,
        azores: channels.WARNINGS_AZ_CHANNEL_ID,
        madeira: channels.WARNINGS_MD_CHANNEL_ID,
      }[zone];

      const header = {
        mainland: 'Novos Avisos do Continente:',
        azores: 'Novos Avisos dos Açores:',
        madeira: 'Novos Avisos da Madeira:',
      }[zone];

      await sendMessageToChannel(
        client?.channels.get(channelId), 
        `***${header}***\n${discordMessages.join('')}`
      );
      logger.info(`Sent ${discordMessages.length} messages to Discord for ${zone}`);
    }

    await sendMessagesTelegram(telegramMessages);
    logger.info(`Sent ${telegramMessages.length} messages to Telegram for ${zone}`);

    await sendPostsToBsky(bskyPosts);
    logger.info(`Sent ${bskyPosts.length} posts to Bluesky for ${zone}`);

  } catch (error) {
    logger.error(`Failed to publish warnings for zone ${zone}`, error);
    throw error;
  }
};

/**
 * Fetch and process new warnings from IPMA
 * @param {Object} client - Discord client
 */
const getWarnings = async (client = undefined) => {
  try {
    if (IPMA.enabled === false) {
      logger.info('IPMA warnings are disabled');
      return;
    }
    logger.info('Starting IPMA warnings check');

    const warnings = await retry(() => IpmaApi.fetch());
    logger.info(`Fetched ${warnings.length} warnings from IPMA`);

    const newWarnings = await Promise.all(
      warnings.map(warning => isNewWarning(warning))
    ).then(results => warnings.filter((_, i) => results[i]));

    logger.info(`Found ${newWarnings.length} new warnings`);

    if (newWarnings.length > 0) {
      // Store new warnings in database
      await Promise.all(
        newWarnings.map(warning => db.IpmaWarnings.create({ ...warning }))
      );
      logger.info('Stored new warnings in database');

      // Process warnings by zone
      const warningsByZone = {
        mainland: newWarnings.filter(w => regionsData[w.idAreaAviso].zone === 'mainland'),
        azores: newWarnings.filter(w => regionsData[w.idAreaAviso].zone === 'azores'),
        madeira: newWarnings.filter(w => regionsData[w.idAreaAviso].zone === 'madeira'),
      };

      // Publish warnings for each zone
      for (const [zone, zoneWarnings] of Object.entries(warningsByZone)) {
        if (zoneWarnings.length > 0) {
          logger.info(`Processing ${zoneWarnings.length} warnings for ${zone}`);
          await publishWarnings(client, zone, zoneWarnings);
        }
      }
    }
  } catch (error) {
    logger.error('Failed to process IPMA warnings', error);
  }
};

/**
 * Clear expired warnings from database
 */
const clearDb = async () => {
  try {
    logger.info('Starting database cleanup');

    const result = await db.IpmaWarnings.destroy({
      where: {
        end: {
          [Op.lt]: DateTime.now({ zone: 'utc' }).toJSDate(),
        },
      },
    });

    logger.info(`Cleaned up ${result} expired warnings from database`);
  } catch (error) {
    logger.error('Failed to clean database', error);
  }
};

module.exports = {
  getWarnings,
  clearDb,
};
