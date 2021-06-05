/**
 * MeteoAlarm' gets a list of updated meteo warnings issued by MeteoAlarm,
 * and send it to Twitter
 * Note that will be sent to Twitter one thread per country with new warnings
 */

const { DateTime } = require('luxon');
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
    emoji: '🌧🌊',
  },
  flooding: {
    strTwitter: 'Flooding',
    emoji: '🌊',
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
  'high': {
    strTwitter: 'HighTemperature',
    emoji: '☀🌡',
  },
  'low-temperature': {
    strTwitter: 'LowTemperature',
    emoji: '❄🌡',
  },
  'low': {
    strTwitter: 'LowTemperature',
    emoji: '❄🌡',
  },
};

const countriesData = {
  austria: {
    strTwitter: 'Austria',
  },
  belguim: {
    strTwitter: 'Belgium',
  },
  'bosnia-herzegovina': {
    strTwitter: 'BosniaAndHerzegovina',
  },
  bulgaria: {
    strTwitter: 'Bulgaria',
  },
  croatia: {
    strTwitter: 'Croatia',
  },
  cyprus: {
    strTwitter: 'Cyprus',
  },
  czechia: {
    strTwitter: 'CzechRepublic',
  },
  denmark: {
    strTwitter: 'Denmark',
  },
  estonia: {
    strTwitter: 'Estonia',
  },
  finland: {
    strTwitter: 'Finland',
  },
  france: {
    strTwitter: 'France',
    vostHandle: 'VISOV1',
  },
  germany: {
    strTwitter: 'Germany',
    vostHandle: 'VOST_de',
  },
  greece: {
    strTwitter: 'Greece',
  },
  hungary: {
    strTwitter: 'Hungary',
  },
  iceland: {
    strTwitter: 'Iceland',
  },
  ireland: {
    strTwitter: 'Ireland',
  },
  israel: {
    strTwitter: 'Israel',
  },
  italy: {
    strTwitter: 'Italy',
  },
  latvia: {
    strTwitter: 'Latvia',
  },
  lithuania: {
    strTwitter: 'Lithuania',
  },
  luxembourg: {
    strTwitter: 'Luxembourg',
  },
  malta: {
    strTwitter: 'Malta',
  },
  moldova: {
    strTwitter: 'Moldova',
  },
  montenegro: {
    strTwitter: 'Montenegro',
  },
  netherlands: {
    strTwitter: 'Netherlands',
  },
  'republic-of-north-macedonia': {
    strTwitter: 'NorthMacedonia',
  },
  norway: {
    strTwitter: 'Norway',
  },
  poland: {
    strTwitter: 'Poland',
  },
  portugal: {
    strTwitter: 'Portugal',
    vostHandle: 'VOSTPT',
  },
  romania: {
    strTwitter: 'Romania',
  },
  serbia: {
    strTwitter: 'Serbia',
  },
  slovakia: {
    strTwitter: 'Slovakia',
    vostHandle: 'VostSlovakia',
  },
  slovenia: {
    strTwitter: 'Slovenia',
  },
  spain: {
    strTwitter: 'Spain',
    vostHandle: 'vostSPAIN',
  },
  sweden: {
    strTwitter: 'Sweden',
  },
  switzerland: {
    strTwitter: 'Switzerland',
  },
  'united-kingdom': {
    strTwitter: 'UnitedKingdom',
  },
};

const warningSeverities = {
  orange: 'Orange',
  red: 'Red',
};

const formatDateTime = (datetime) => {
  const now = DateTime.now({ zone: 'Europe/Paris' });

  if (now.hasSame(datetime, 'day')) {
    return `today at ${datetime.toLocaleString(DateTime.TIME_24_SIMPLE)} CET`;
  }

  if (now.plus({ days: 1 }).hasSame(datetime, 'day')) {
    return `tomorrow at ${datetime.toLocaleString(DateTime.TIME_24_SIMPLE)} CET`;
  }

  return `${datetime.toFormat('dd/LL/yyyy HH:mm')} CET`;
};

/**
 * Check if a warning is present in local DB
 * And if a warning has ended
 *
 * @param {Object} warning
 */
const filterWarn = async (country, warning) => {
  const now = DateTime.now();
  const end = DateTime.fromISO(warning.end);

  if (end < now) {
    return false;
  }

  const result = await db.MeteoAlarmWarnings.findOne({
    attributes: [
      'country',
      'region',
      'type',
      'start',
      'end',
      'severity',
    ],
    where: {
      country,
      region: warning.region,
      type: warning.type,
      start: {
        [Op.lte]: DateTime.fromISO(warning.start).toJSDate(),
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
    const resIndex = joinNewWarn.findIndex((warn) => (
      warn.type === newWarn.type
        && warn.status === newWarn.status
        && warn.start === newWarn.start
        && warn.end === newWarn.end
        && warn.severity === newWarn.severity));

    if (resIndex > -1) {
      const resDupReg = joinNewWarn[resIndex].regions.find((region) => region === newWarn.region);

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
    const {
      strTwitter: strType,
      emoji,
    } = warningTypes[warning.type];

    const level = warningSeverities[warning.severity.toLowerCase()];

    const strRegions = warning.regions.join(', ');

    const startTime = DateTime.fromISO(warning.start, { zone: 'Europe/Paris' });

    const formattedStartTime = formatDateTime(startTime);

    const strStartTime = DateTime.now({ zone: 'Europe/Paris' }) < startTime
      ? ''
      : ` starting ${formattedStartTime}, and`;

    const endTime = DateTime.fromISO(warning.end, { zone: 'Europe/Paris' });

    const strEndTime = formatDateTime(endTime);

    const tweetStrs = {
      beforeReg: `ℹ️⚠️${emoji} #${level}Alert due to #${strType} in #${strCountry}`,
      afterReg: `,${strStartTime} ending ${strEndTime}\n\n#SevereWeather ${emoji}⚠️ℹ️`,
    };

    const tweetLength = tweetStrs.beforeReg.length + tweetStrs.afterReg.length + strRegions.length;

    const tweetString = tweetLength < 277
      ? `${tweetStrs.beforeReg} (${strRegions})${tweetStrs.afterReg}`
      : `${tweetStrs.beforeReg} (several regions)${tweetStrs.afterReg}`;

    const fileName = `vost_eu/warnings/${level}_WARNING_${strType.toUpperCase()}.png`;

    return {
      status: tweetString,
      media: [fileName],
    };
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
    const countryNewWarn = await Promise.all(warns[country].map((warn) => filterWarn(country, warn)))
      .then((newSrchRes) => warns[country].filter(((_warning, i) => newSrchRes[i])));

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
        [Op.lt]: DateTime.now({ zone: 'utc' }).toJSDate(),
      },
    },
  });
};

module.exports = {
  getWarnings,
  clearDb,
};
