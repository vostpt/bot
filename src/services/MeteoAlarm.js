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
    nms: '@ZAMG_AT',
  },
  belguim: {
    strTwitter: 'Belgium',
    nms: '@meteobenl',
  },
  'bosnia-herzegovina': {
    strTwitter: 'BosniaAndHerzegovina',
    nms: '@FHMZBIH',
  },
  bulgaria: {
    strTwitter: 'Bulgaria',
    nms: 'meteo.bg',
  },
  croatia: {
    strTwitter: 'Croatia',
    nms: '@DHMZ_HR',
  },
  cyprus: {
    strTwitter: 'Cyprus',
    nms: 'Republic of Cyprus - Department of Meteorology',
  },
  czechia: {
    strTwitter: 'CzechRepublic',
    nms: 'chmi.cz',
  },
  denmark: {
    strTwitter: 'Denmark',
    nms: 'dmi.dk',
  },
  estonia: {
    strTwitter: 'Estonia',
    nms: 'ilmateenistus.ee',
  },
  finland: {
    strTwitter: 'Finland',
    nms: '@meteorologit',
  },
  france: {
    strTwitter: 'France',
    vostHandle: 'VISOV1',
    nms: '@meteofrance',
  },
  germany: {
    strTwitter: 'Germany',
    vostHandle: 'VOST_de',
    nms: '@DWD_presse',
  },
  greece: {
    strTwitter: 'Greece',
    nms: '@EMY_HNMS',
  },
  hungary: {
    strTwitter: 'Hungary',
    nms: '@meteorologiahu',
  },
  iceland: {
    strTwitter: 'Iceland',
    nms: '@Vedurstofan',
  },
  ireland: {
    strTwitter: 'Ireland',
    nms: '@MetEireann',
  },
  israel: {
    strTwitter: 'Israel',
    nms: 'ims.gov.il',
  },
  italy: {
    strTwitter: 'Italy',
    nms: '@ItalianAirForce',
  },
  latvia: {
    strTwitter: 'Latvia',
    nms: '@LVGMC_Meteo',
  },
  lithuania: {
    strTwitter: 'Lithuania',
    nms: 'meteo.lt',
  },
  luxembourg: {
    strTwitter: 'Luxembourg',
    nms: 'meteolux.lu',
  },
  malta: {
    strTwitter: 'Malta',
    nms: '@Maltairport',
  },
  moldova: {
    strTwitter: 'Moldova',
    nms: 'meteo.md',
  },
  montenegro: {
    strTwitter: 'Montenegro',
    nms: 'meteo.co.me',
  },
  netherlands: {
    strTwitter: 'Netherlands',
    nms: 'knmi.nl',
  },
  'republic-of-north-macedonia': {
    strTwitter: 'NorthMacedonia',
    nms: 'The HMS of the Republic of North Macedonia',
  },
  norway: {
    strTwitter: 'Norway',
    nms: '@Meteorologene',
  },
  poland: {
    strTwitter: 'Poland',
    nms: '@IMGWmeteo',
  },
  portugal: {
    strTwitter: 'Portugal',
    vostHandle: 'VOSTPT',
    nms: '@ipma_pt',
  },
  romania: {
    strTwitter: 'Romania',
    nms: 'meteoromania.ro',
  },
  serbia: {
    strTwitter: 'Serbia',
    nms: 'hidmet.gov.rs',
  },
  slovakia: {
    strTwitter: 'Slovakia',
    vostHandle: 'VostSlovakia',
    nms: 'shmu.sk',
  },
  slovenia: {
    strTwitter: 'Slovenia',
    nms: '@meteoSI',
  },
  spain: {
    strTwitter: 'Spain',
    vostHandle: 'vostSPAIN',
    nms: '@AEMET_Esp',
  },
  sweden: {
    strTwitter: 'Sweden',
    nms: 'smhi.se',
  },
  switzerland: {
    strTwitter: 'Switzerland',
    nms: '@meteoschweiz',
  },
  'united-kingdom': {
    strTwitter: 'UnitedKingdom',
    nms: '@metoffice',
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
    nms,
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
      ? ` starting ${formattedStartTime}, and`
      : '';

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

  const firstTweetStr = `ℹ️⚠️ New weather warnings in #${strCountry}${vostInfo}\n\nSource: meteoalarm.org | ${nms}\n\n#SevereWeather ⚠️ℹ️`;

  const lastTweetStr = 'Time delays between this warning and the www.meteoalarm.org website are possible, for the most up to date information about alert levels as published by the participating National Meteorological Services please use www.meteoalarm.org.';

  const thread = [{
    status: firstTweetStr,
  },
  ...warnTweets,
  {
    status: lastTweetStr,
  }];

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
