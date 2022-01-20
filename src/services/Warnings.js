/**
 * TO BE DEPRECATED SOON
 * Warnings' gets a list of updated meteo warnings issued by IPMA,
 * using bot api, and send it to Discord and Twitter
 * Note that will be sent one message including all warnings to Discord,
 * while one message per warning will be sent to Twitter
 */

const moment = require('moment');
const { WarningsApi } = require('../api');
const { uploadThreadTwitter } = require('./Twitter');
const { sendMessageToChannel } = require('./Discord');
const { channels } = require('../../config/bot');
const { baseImagesURL } = require('../../config/api');
const { locale } = require('../../config/locale');
const { removeAccent, splitMessageString } = require('../helpers');
const { sendMessagesTelegram } = require('./Telegram');
const { telegramKeys } = require('../../config/telegram');
const { sendPostMastodon } = require('./Mastodon');
const { postMessageFacebook } = require('./Facebook');

const iconsMap = new Map([
  [':dash:', '🌬'],
  [':sunny:️:thermometer:', '☀🌡'],
  [':snowflake:️:thermometer:', '❄🌡'],
  [':cloud_rain:', '🌧'],
  [':fog:', '🌫'],
  [':snowflake:', '❄'],
  [':ocean:', '🌊'],
  [':thunder_cloud_rain:', '⛈'],
]);

const DATE_FORMATS = {
  first: 'YYYY-MM-DD H:mm',
};

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
 * Returns array of updated meteo warnings
 *
 * @returns {Array} warnings
 */
const getAll = async () => {
  const { data: warnings = [] } = await WarningsApi.getNewWarnings();

  return warnings;
};

/**
 * Returns array of updated meteo warnings
 *
 * @param {Array} warningsZone
 * @param {String} zone
 * @param {Client} client
 */
const getWarningsZones = async (warningsZone, zone, client) => {
  let strDiscord = '';

  const tlgMessages = [];

  await warningsZone.forEach(async (warning) => {
    const {
      icon,
      tipo: type = '',
      inicio: begin,
      fim: end,
      nivel: level,
      locais: places = [],
    } = warning;

    // If warning type is 'Precipitação' (EN: rain), replace by a synonym
    const weatherType = type === 'Precipitação' ? 'Chuva' : type.replace(' ', '');

    // Format warning time and date
    const actualTime = moment();

    const beginTime = moment(begin, DATE_FORMATS.first);
    const endTime = moment(end, DATE_FORMATS.first);

    const strBeginHour = beginTime.format('HH:mm');

    const strBeginDate = beginTime.format('DDMMMYY').toUpperCase();
    const strEndDate = endTime.format('DDMMMYY').toUpperCase();

    const getTime = (() => {
      if (beginTime.isBefore(actualTime)) {
        return `até às ${endTime.calendar(actualTime)} ${strEndDate}`;
      }

      if (beginTime.isSame(endTime, 'day')) {
        return `entre as ${strBeginHour}h e as ${endTime.calendar(actualTime)} ${strEndDate}`;
      }

      return `entre as ${beginTime.calendar(actualTime)} ${strBeginDate} e as ${endTime.calendar(actualTime)} ${strEndDate}`;
    });

    const numPlaces = places.length;

    const getDistrictList = (() => {
      let strDistrictList = '';

      if (numPlaces === 1) {
        const { local } = places[0];

        strDistrictList += `#${local}`;
      } else {
        places.forEach(({ local }, index) => {
          switch (numPlaces - index) {
            case 1:
              strDistrictList += `e #${local}`;
              break;
            case 2:
              strDistrictList += `#${local} `;
              break;
            default:
              strDistrictList += `#${local}, `;
          }
        });
      }

      return strDistrictList;
    });

    const getDistrictStr = ((startSentence) => {
      const startStr = startSentence
        ? ''
        : 'para ';

      switch (zone) {
        case 'continente':
          if (numPlaces === 1) {
            if (startSentence) {
              return `Distrito de ${getDistrictList()}`;
            }

            return `${startStr} o distrito de ${getDistrictList()}`;
          } if (startSentence) {
            return `Distritos de ${getDistrictList()}`;
          }

          return `${startStr} os distritos de ${getDistrictList()}`;
        case 'acores':
          return `${startStr}${getDistrictList()} do arquipélago dos #Açores`;
        case 'madeira':
          return `${startStr}${getDistrictList()} do arquipélago da #Madeira`;
        default:
          return `${startStr}${getDistrictList()}`;
      }
    });

    const strType = `devido a #${weatherType}`;

    const strHeader = `#Aviso${level} ${strType}`;

    const strTwitter = `ℹ️⚠️${iconsMap.get(icon)} ${strHeader} ${getTime()} ${getDistrictStr(false)} ${iconsMap.get(icon)}⚠️ℹ️`;

    const strTelegram = `ℹ️⚠️${iconsMap.get(icon)} ${getDistrictStr(true)} ${iconsMap.get(icon)}⚠️ℹ️\n 🕰️ ${getTime()}\n${strHeader}`;

    strDiscord += `:information_source: :warning: ${icon} ${strHeader} ${getTime()} ${getDistrictStr(false)} ${icon} :warning: :information_source:\n\n`;

    const fileName = `warnings/Twitter_Post_Aviso${level}_${removeAccent(weatherType)}.png`;

    const photoURL = `${baseImagesURL}/${fileName}`;

    const splitStrTwitter = splitMessageString(strTwitter, 280).map((string) => ({
      status: string,
    }));

    splitStrTwitter[0].media = [fileName];

    if (zone === 'acores') {
      const azTweet = Object.assign([], splitStrTwitter);

      uploadThreadTwitter(azTweet, '', 'azores');
    }

    uploadThreadTwitter(splitStrTwitter, '', 'main');

    tlgMessages.push({
      chatId: telegramKeys.chat_id,
      photoURL,
      options: {
        caption: strTelegram,
      },
    });

    WarningsApi.postNewWarning(warning);

    if (level === 'Laranja' || level === 'Vermelho') {
      const post = {
        status: strTwitter,
        media: fileName,
        options: {
          spoiler_text: 'Meteorologia',
          sensitive: false,
          language: 'pt',
        },
      };

      sendPostMastodon(post, 'main');
      
      const fbpost = {
        message: strTwitter,
        media: fileName,
      }
      postMessageFacebook(fbpost);
    }
  });

  // Send messages to Discord and Telegram
  if (warningsZone.length > 0) {
    if (zone === 'continente') {
      sendMessageToChannel(client.channels.get(channels.WARNINGS_CHANNEL_ID), `***Novos Avisos do Continente:***\n${strDiscord}`);
    } else if (zone === 'acores') {
      sendMessageToChannel(client.channels.get(channels.WARNINGS_AZ_CHANNEL_ID), `***Novos Avisos dos Açores:***\n${strDiscord}`);
    } else if (zone === 'madeira') {
      sendMessageToChannel(client.channels.get(channels.WARNINGS_MD_CHANNEL_ID), `***Novos Avisos da Madeira:***\n${strDiscord}`);
    }

    await sendMessagesTelegram(tlgMessages);
  }
};

/**
 * Get updated meteo warnings, data and send response to Discord
 *
 * @param {Client} client
 */
const getWarnings = async (client) => {
  const warnings = await getAll();

  await getWarningsZones(warnings.continente, 'continente', client);
  await getWarningsZones(warnings.acores, 'acores', client);
  await getWarningsZones(warnings.madeira, 'madeira', client);
};

module.exports = {
  getAll,
  getWarnings,
};
