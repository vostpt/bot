/**
 * Warnings' gets a list of updated meteo warnings issued by IPMA,
 * using bot api, and send it to Discord and Twitter
 * Note that will be sent one message including all warnings to Discord,
 * while one message per warning will be sent to Twitter
 */

const moment = require('moment');
const { WarningsApi } = require('../api');
const { clientTwitter, uploadThreadTwitter } = require('./Twitter');
const { channels } = require('../../config/bot');
const { locale } = require('../../config/locale');
const { removeAccent } = require('../helpers');

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
    lastDay: 'HH:mm [de ontem]',
    sameDay: 'HH:mm [de hoje]',
    nextDay: 'HH:mm [de amanhã]',
    lastWeek: 'HH:mm [do dia]',
    nextWeek: 'HH:mm [do dia]',
    sameElse: 'HH:mm [do dia]',
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
const getWarningsZones = (warningsZone, zone, client) => {
  let strDiscord = '';

  warningsZone.forEach((warning) => {
    const {
      icon,
      tipo: type = '',
      inicio: begin,
      fim: end,
      nivel: level,
      locais: places = [],
    } = warning;

    let strWarning = '';

    // If warning type is 'Precipitação' (EN: rain), replace by a synonym
    const weatherType = type === 'Precipitação' ? 'Chuva' : type.replace(' ', '');

    // Format warning time and date
    const actualTime = moment();

    const beginTime = moment(begin, DATE_FORMATS.first);
    const endTime = moment(end, DATE_FORMATS.first);

    const strBeginHour = beginTime.format('HH:mm');

    const strBeginDate = beginTime.format('DDMMMYY').toUpperCase();
    const strEndDate = endTime.format('DDMMMYY').toUpperCase();

    const strTime = beginTime.isSame(endTime, 'day')
      ? `${strBeginHour} e as ${endTime.calendar(actualTime)} ${strBeginDate}`
      : `${beginTime.calendar(actualTime)} ${strBeginDate} e as ${endTime.calendar(actualTime)} ${strEndDate}`;

    strWarning += `#Aviso${level} devido a #${weatherType} entre as ${strTime} para `;

    const numPlaces = places.length;

    if (zone === 'continente') {
      strWarning += numPlaces === 1
        ? 'o distrito de '
        : 'os distritos de ';
    }

    if (numPlaces === 1) {
      const { local } = places[0];

      strWarning += `#${local}`;
    } else {
      places.forEach(({ local }, index) => {
        switch (numPlaces - index) {
          case 1:
            strWarning += `e #${local}`;
            break;
          case 2:
            strWarning += `#${local} `;
            break;
          default:
            strWarning += `#${local}, `;
        }
      });
    }

    // Add final emojis
    if (zone === 'acores') {
      strWarning += ' do arquipélago dos #Açores';
    } else if (zone === 'madeira') {
      strWarning += ' do arquipélago da #Madeira';
    }

    // Send message to Twitter
    if (clientTwitter && strWarning !== '') {
      const fileName = `Twitter_Post_Aviso${level}_${removeAccent(weatherType)}.png`;

      const strTwitter = `ℹ️⚠️${iconsMap.get(icon)} ${strWarning} ${iconsMap.get(icon)}⚠️ℹ️`;

      uploadThreadTwitter([{
        status: strTwitter,
        media: [fileName],
      }]);
    }

    strDiscord += `:information_source: :warning: ${icon} ${strWarning} ${icon} :warning: :information_source:\n\n`;
  });

  // Send message to Discord
  if (strDiscord !== '') {
    if (zone === 'continente') {
      client.channels.get(channels.WARNINGS_CHANNEL_ID).send(`***Novos Alertas do Continente:***\n${strDiscord}`);
    } else if (zone === 'acores') {
      client.channels.get(channels.WARNINGS_CHANNEL_ID).send(`***Novos Alertas dos Açores:***\n${strDiscord}`);
    } else if (zone === 'madeira') {
      client.channels.get(channels.WARNINGS_CHANNEL_ID).send(`***Novos Alertas da Madeira:***\n${strDiscord}`);
    }
  }
};

/**
 * Get updated meteo warnings, data and send response to Discord
 *
 * @param {Client} client
 */
const getWarnings = async (client) => {
  const warnings = await getAll();

  getWarningsZones(warnings.acores, 'acores', client);
  getWarningsZones(warnings.madeira, 'madeira', client);
  getWarningsZones(warnings.continente, 'continente', client);
};

module.exports = {
  getAll,
  getWarnings,
};
