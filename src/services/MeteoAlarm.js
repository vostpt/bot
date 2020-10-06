/**
 * MeteoAlarm' gets a list of updated meteo warnings issued by MeteoAlarm,
 * and send it to Twitter
 * Note that will be sent to Twitter one thread per country with new warnings
 */

const moment = require('moment');
const { MeteoAlarmApi } = require('../api');
const { uploadThreadTwitter } = require('./Twitter');
const { db, Op } = require('../database/models');

const warningTypes = {
  coastalevent: {
    strTwitter: 'CoastalEvent',
    emoji: '🌊',
  },
  thunderstorm: {
    strTwitter: 'Thunderstorm',
    emoji: '⛈',
  },
  rain: {
    strTwitter: 'Rain',
    emoji: '🌧',
  },
  'rain-flood': {
    strTwitter: 'RainFlood',
    emoji: '🌧',
  },
  flooding: {
    strTwitter: 'Flooding',
    emoji: '🌧',
  },
  wind: {
    strTwitter: 'Wind',
    emoji: '🌬️',
  },
  'snow-ice': {
    strTwitter: 'SnowAndIce',
    emoji: '❄',
  },
  fog: {
    strTwitter: 'Fog',
    emoji: '🌫',
  },
  avalanches: {
    strTwitter: 'Avalanches',
    emoji: '☠️',
  },
  'forest-fire': {
    strTwitter: 'Forestfire',
    emoji: '🔥',
  },
  'high-temperature': {
    strTwitter: 'HighTemperature',
    emoji: '☀🌡',
  },
  'low-temperature': {
    strTwitter: 'LowTemperature',
    emoji: '❄🌡',
  },
};

const countriesData = {
  AT: {
    strTwitter: 'Austria',
  },
  BA: {
    strTwitter: 'BosniaAndHerzegovina',
  },
  BE: {
    strTwitter: 'Belgium',
  },
  BG: {
    strTwitter: 'Bulgaria',
  },
  CH: {
    strTwitter: 'Switzerland',
  },
  CY: {
    strTwitter: 'Cyprus',
  },
  CZ: {
    strTwitter: 'CzechRepublic',
  },
  DE: {
    strTwitter: 'Germany',
    vostHandle: 'VOST_de',
  },
  DK: {
    strTwitter: 'Denmark',
  },
  EE: {
    strTwitter: 'Estonia',
  },
  ES: {
    strTwitter: 'Spain',
    vostHandle: 'vostSPAIN',
  },
  FI: {
    strTwitter: 'Finland',
  },
  FR: {
    strTwitter: 'France',
    vostHandle: 'VISOV1',
  },
  GR: {
    strTwitter: 'Greece',
  },
  HR: {
    strTwitter: 'Croatia',
  },
  HU: {
    strTwitter: 'Hungary',
  },
  IE: {
    strTwitter: 'Ireland',
  },
  IL: {
    strTwitter: 'Israel',
  },
  IS: {
    strTwitter: 'Iceland',
  },
  IT: {
    strTwitter: 'Italy',
  },
  LT: {
    strTwitter: 'Lithuania',
  },
  LU: {
    strTwitter: 'Luxembourg',
  },
  LV: {
    strTwitter: 'Latvia',
  },
  MD: {
    strTwitter: 'Moldova',
  },
  ME: {
    strTwitter: 'Montenegro',
  },
  MK: {
    strTwitter: 'NorthMacedonia',
  },
  MT: {
    strTwitter: 'Malta',
  },
  NL: {
    strTwitter: 'Netherlands',
  },
  NO: {
    strTwitter: 'Norway',
  },
  PL: {
    strTwitter: 'Poland',
  },
  PT: {
    strTwitter: 'Portugal',
    vostHandle: 'VOSTPT',
  },
  RO: {
    strTwitter: 'Romania',
  },
  RS: {
    strTwitter: 'Serbia',
  },
  SE: {
    strTwitter: 'Sweden',
  },
  SI: {
    strTwitter: 'Slovenia',
  },
  SK: {
    strTwitter: 'Slovakia',
    vostHandle: 'VostSlovakia',
  },
  UK: {
    strTwitter: 'UnitedKingdom',
  },
};

const warningSeverities = {
  severe: 'Orange',
  extreme: 'Red',
};

const momentCalendar = {
  lastDay: '[yesterday at] HH:mm',
  sameDay: '[today at] HH:mm',
  nextDay: '[tomorrow at] HH:mm',
  lastWeek: 'DD/MM/YYYY HH:mm',
  nextWeek: 'DD/MM/YYYY HH:mm',
  sameElse: 'DD/MM/YYYY HH:mm',

};

/**
 * Check if a warning is present in local DB
 * And if a warning has ended
 *
 * @param {Object} warning
 */
const filterWarn = async (country, warning) => {
  if (moment(warning.end).isBefore(moment())) {
    return false;
  }

  const result = await db.MeteoAlarmWarnings.findOne({
    attributes: [
      'country',
      'region',
      'type',
      'status',
      'start',
      'end',
      'severity',
    ],
    where: {
      country,
      region: warning.region,
      type: warning.type,
      status: warning.status,
      start: {
        [Op.lte]: moment(warning.start).toDate(),
      },
      end: warning.end,
      severity: warning.severity,
    },
  });

  return (result === null);
};

/**
 * Tweet new warnings
 *
 * @param {Object} newWarnings
 */
const tweetNewWarnings = async (country, newWarnings) => {
  const {
    strTwitter: strCountry,
    vostHandle,
  } = countriesData[country];

  const joinNewWarn = [];

  await newWarnings.forEach((newWarn) => {
    const resIndex = joinNewWarn.findIndex(warn => (
      warn.type === newWarn.type
        && warn.status === newWarn.status
        && warn.start === newWarn.start
        && warn.end === newWarn.end
        && warn.severity === newWarn.severity));

    if (resIndex > -1) {
      const resDupReg = joinNewWarn[resIndex].regions.find(region => region === newWarn.region);

      if (!resDupReg) {
        joinNewWarn[resIndex].regions.push(newWarn.region);
      }
    } else {
      joinNewWarn.push({
        type: newWarn.type,
        status: newWarn.status,
        start: newWarn.start,
        end: newWarn.end,
        severity: newWarn.severity,
        regions: [newWarn.region],
      });
    }
  });

  const warnTweets = joinNewWarn.map(((warning) => {
    const typeKey = (warning.type).split(' ')[1].toLowerCase();

    const {
      strTwitter: strType,
      emoji,
    } = warningTypes[typeKey];

    const level = warningSeverities[warning.severity.toLowerCase()];

    const strRegions = warning.regions.length > 10
      ? 'several regions'
      : warning.regions.join(', ');

    const startTime = moment(warning.start);

    const formattedStartTime = moment(warning.start).calendar(null, momentCalendar);

    const strStartTime = moment().isAfter(startTime)
      ? ''
      : ` starting ${formattedStartTime} CET, and`;

    const strEndTime = moment(warning.end).calendar(null, momentCalendar);

    const tweetString = `ℹ️⚠️${emoji} #${level}Alert due to #${strType} in #${strCountry} (${strRegions}),${strStartTime} ending ${strEndTime} CET\n\n#SevereWeather ${emoji}⚠️ℹ️`;

    return { status: tweetString };
  }));

  const vostInfo = vostHandle
    ? `\nFollow @${vostHandle} for more updates`
    : '';

  const firstTweetStr = `ℹ️⚠️ New weather warnings in #${strCountry}${vostInfo}\n\n#SevereWeather ⚠️ℹ️`;

  const thread = [{
    status: firstTweetStr,
  },
  ...warnTweets];

  uploadThreadTwitter(thread, null, 'europe');
};


/**
 * Fetch severe and extreme warnings from MeteoAlarm
 * Return and update DB with new warnings
 *
 * @param {Client} client
 */
const getWarnings = async () => {
  const warns = await MeteoAlarmApi.fetch();

  const { countries } = MeteoAlarmApi;

  countries.map(async (country) => {
    const countryNewWarn = await Promise.all(warns[country].map(warn => filterWarn(country, warn)))
      .then(newSrchRes => warns[country].filter(((_warning, i) => newSrchRes[i])));

    countryNewWarn.forEach(async (warning) => {
      await db.MeteoAlarmWarnings.create({
        ...warning,
        country,
      });
    });

    if (countryNewWarn.length > 0) {
      tweetNewWarnings(country, countryNewWarn);
    }
  });
};

/**
 * Clear old warnings from MeteoAlarm DB
 *
 */
const clearDb = async () => {
  db.MeteoAlarmWarnings.destroy({
    where: {
      end: {
        [Op.lt]: moment().toDate(),
      },
    },
  });
};

module.exports = {
  getWarnings,
  clearDb,
};
