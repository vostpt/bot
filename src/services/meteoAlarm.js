const { METEOALARM } = require('../config/services');
const { DateTime } = require('luxon');
const { MeteoAlarmApi } = require('../api');
const { uploadThreadTwitter } = require('./twitter');
const { db, Op } = require('../database/models');
const { 
  warningTypes, 
  countriesData, 
  warningSeverities 
} = require('../../config/meteoalarm');

// Constants
const LOG_PREFIX = '[MeteoAlarm]';
const TIME_ZONE = 'Europe/Paris';
const TWEET_MAX_LENGTH = 277;

/**
 * Custom logger for MeteoAlarm service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Format datetime for display
 * @param {DateTime} datetime - Luxon DateTime object
 * @returns {String} Formatted datetime string
 */
const formatDateTime = (datetime) => {
  const now = DateTime.now({ zone: TIME_ZONE });

  if (now.hasSame(datetime, 'day')) {
    return `today at ${datetime.toLocaleString(DateTime.TIME_24_SIMPLE)} CET`;
  }

  if (now.plus({ days: 1 }).hasSame(datetime, 'day')) {
    return `tomorrow at ${datetime.toLocaleString(DateTime.TIME_24_SIMPLE)} CET`;
  }

  return `${datetime.toFormat('dd/LL/yyyy HH:mm')} CET`;
};

/**
 * Check if warning exists in DB and is still valid
 * @param {String} country - Country code
 * @param {Object} warning - Warning data
 * @returns {Promise<Boolean>} Whether warning should be processed
 */
const isNewWarning = async (country, warning) => {
  try {
    const now = DateTime.now();
    const end = DateTime.fromISO(warning.end);

    if (end < now) {
      return false;
    }

    const result = await db.MeteoAlarmWarnings.findOne({
      attributes: ['country', 'region', 'type', 'start', 'end', 'severity'],
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

    return result === null;
  } catch (error) {
    logger.error('Error checking warning status', error);
    throw error;
  }
};

/**
 * Create tweet content for warning
 * @param {Object} warning - Warning data
 * @param {String} country - Country code
 * @returns {Object} Tweet data
 */
const createWarningTweet = (warning, countryCode) => {
  const countryData = countriesData[countryCode];
  const warningType = warningTypes[warning.type];
  const level = warningSeverities[warning.severity.toLowerCase()];

  const strRegions = warning.regions.join(', ');
  const startTime = DateTime.fromISO(warning.start, { zone: TIME_ZONE });
  const endTime = DateTime.fromISO(warning.end, { zone: TIME_ZONE });

  const strStartTime = DateTime.now({ zone: TIME_ZONE }) < startTime
    ? ` starting ${formatDateTime(startTime)}, and`
    : '';

  const tweetComponents = {
    beforeReg: `ℹ️⚠️${warningType.emoji} #${level}Alert due to #${warningType.strTwitter} in #${countryData.strTwitter}`,
    afterReg: `,${strStartTime} ending ${formatDateTime(endTime)}\n\n#SevereWeather ${warningType.emoji}⚠️ℹ️`
  };

  const tweetLength = tweetComponents.beforeReg.length + tweetComponents.afterReg.length + strRegions.length;
  const tweetContent = tweetLength < TWEET_MAX_LENGTH
    ? `${tweetComponents.beforeReg} (${strRegions})${tweetComponents.afterReg}`
    : `${tweetComponents.beforeReg} (several regions)${tweetComponents.afterReg}`;

  return {
    status: tweetContent,
    media: [`vost_eu/warnings/${level}_WARNING_${warningType.strTwitter.toUpperCase()}.png`]
  };
};

/**
 * Create and send tweets for new warnings
 * @param {String} country - Country code
 * @param {Array} newWarnings - Array of new warnings
 */
const publishNewWarnings = async (country, newWarnings) => {
  try {
    const countryData = countriesData[country];
    
    // Group warnings by type and severity
    const groupedWarnings = newWarnings.reduce((acc, warning) => {
      const key = `${warning.type}-${warning.status}-${warning.start}-${warning.end}-${warning.severity}`;
      
      if (!acc[key]) {
        acc[key] = { ...warning, regions: [warning.region] };
      } else if (!acc[key].regions.includes(warning.region)) {
        acc[key].regions.push(warning.region);
      }
      
      return acc;
    }, {});

    // Create warning tweets
    const warningTweets = Object.values(groupedWarnings).map(warning => 
      createWarningTweet(warning, country)
    );

    // Create thread
    const thread = [
      {
        status: `ℹ️⚠️ New weather warnings in #${countryData.strTwitter}${
          countryData.vostHandle ? `\nFollow @${countryData.vostHandle} for more updates` : ''
        }\n\nSource: meteoalarm.org | ${countryData.nms}\n\n#SevereWeather ⚠️ℹ️`
      },
      ...warningTweets,
      {
        status: 'Time delays between this warning and the www.meteoalarm.org website are possible, for the most up to date information about alert levels as published by the participating National Meteorological Services please use www.meteoalarm.org.'
      }
    ];

    await uploadThreadTwitter(thread, null, 'europe');
    logger.info(`Published ${warningTweets.length} warnings for ${country}`);
  } catch (error) {
    logger.error(`Failed to publish warnings for ${country}`, error);
    throw error;
  }
};

/**
 * Fetch and process warnings
 */
const getWarnings = async () => {
  try {
    if ( !METEOALARM || !METEOALARM.enabled) {
      logger.warning('MeteoAlarm service is disabled');
      return [];
    }
    logger.info('Starting warning check');
    const warns = await MeteoAlarmApi.fetch();
    const { countries } = MeteoAlarmApi;

    for (const country of countries) {
      try {
        // Filter new warnings
        const countryNewWarn = await Promise.all(
          warns[country].map(warn => isNewWarning(country, warn))
        ).then(results => warns[country].filter((_, i) => results[i]));

        if (countryNewWarn.length > 0) {
          // Store new warnings
          await Promise.all(
            countryNewWarn.map(warning => 
              db.MeteoAlarmWarnings.create({
                ...warning,
                country,
              })
            )
          );

          // Publish warnings
          await publishNewWarnings(country, countryNewWarn);
        }
      } catch (error) {
        logger.error(`Failed to process warnings for ${country}`, error);
      }
    }
  } catch (error) {
    logger.error('Failed to fetch warnings', error);
  }
};

/**
 * Clear expired warnings from database
 */
const clearDb = async () => {
  try {
    const result = await db.MeteoAlarmWarnings.destroy({
      where: {
        end: {
          [Op.lt]: DateTime.now({ zone: 'utc' }).toJSDate(),
        },
      },
    });
    logger.info(`Cleared ${result} expired warnings`);
  } catch (error) {
    logger.error('Failed to clear database', error);
  }
};

module.exports = {
  getWarnings,
  clearDb,
};
